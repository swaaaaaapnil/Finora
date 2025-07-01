"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { request } from "@arcjet/next";
import aj from "@/lib/arcjet";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI( process.env.GEMINI_API_KEY);



const serializeAmount = (obj) => ({
  ...obj,
  amount: obj.amount.toNumber(),
});

// Create Transaction
export async function createTransaction(data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Get request data for ArcJet
    const req = await request();

    // Check rate limit
    const decision = await aj.protect(req, {
      userId,
      requested: 1, // Specify how many tokens to consume
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        const { remaining, reset } = decision.reason;
        console.error({
          code: "RATE_LIMIT_EXCEEDED",
          details: {
            remaining,
            resetInSeconds: reset,
          },
        });

        throw new Error("Too many requests. Please try again later.");
      }

      throw new Error("Request blocked");
    }

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: {
        id: data.accountId,
        userId: user.id,
      },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Calculate new balance
    const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
    const newBalance = account.balance.toNumber() + balanceChange;

    // Create transaction and update account balance
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          ...data,
          userId: user.id,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      await tx.account.update({
        where: { id: data.accountId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${transaction.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getTransaction(id) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    // Get original transaction to calculate balance change
    const originalTransaction = await db.transaction.findUnique({
      where: {
        id,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!originalTransaction) throw new Error("Transaction not found");

    // Calculate balance changes
    const oldBalanceChange =
      originalTransaction.type === "EXPENSE"
        ? -originalTransaction.amount.toNumber()
        : originalTransaction.amount.toNumber();

    const newBalanceChange =
      data.type === "EXPENSE" ? -data.amount : data.amount;

    const netBalanceChange = newBalanceChange - oldBalanceChange;

    // Update transaction and account balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: {
          id,
          userId: user.id,
        },
        data: {
          ...data,
          nextRecurringDate:
            data.isRecurring && data.recurringInterval
              ? calculateNextRecurringDate(data.date, data.recurringInterval)
              : null,
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: netBalanceChange,
          },
        },
      });

      return updated;
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${data.accountId}`);

    return { success: true, data: serializeAmount(transaction) };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Get User Transactions
export async function getUserTransactions(query = {}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        ...query,
      },
      include: {
        account: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return { success: true, data: transactions };
  } catch (error) {
    throw new Error(error.message);
  }
}

// Scan Receipt
export async function scanReceipt(file) {
  try {
    // Use Gemini 1.5 Flash for receipt scanning
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      },
    });

    // Convert File to ArrayBuffer and then to Base64
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      - Total amount (just the number)
      - Date (in ISO format)
      - Description or items purchased (brief summary)
      - Merchant/store name
      - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense)
      
      Only respond with valid JSON in this exact format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }

      If it's not a receipt, return an empty object: {}
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    let cleanedText = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();

    // If the model returns an empty object, handle gracefully
    if (cleanedText === "{}") {
      throw new Error("Could not detect a valid receipt in the image.");
    }

    // Sometimes Gemini may prepend text, try to extract JSON
    if (!cleanedText.startsWith("{")) {
      const jsonStart = cleanedText.indexOf("{");
      if (jsonStart >= 0) {
        cleanedText = cleanedText.substring(jsonStart);
      }
    }

    try {
      const data = JSON.parse(cleanedText);

      // Fallbacks for missing or invalid data
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];

      return {
        amount: typeof data.amount === "number" ? data.amount : parseFloat(data.amount) || 0,
        date: data.date ? new Date(data.date) : new Date(formattedDate),
        description: data.description || data.merchantName || "Receipt scan",
        category: data.category || "other-expense",
        merchantName: data.merchantName || "Unknown merchant",
      };
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError, cleanedText);
      throw new Error("Could not read receipt data clearly. Please try with a clearer image.");
    }
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw new Error(error.message || "Failed to scan receipt");
  }
}

// Import Excel Transactions
export async function importExcelTransactions(file) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Load Excel file using exceljs
    const xlsx = await import('exceljs');
    const workbook = new xlsx.default.Workbook();
    
    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(Buffer.from(arrayBuffer));
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error("Excel file contains no worksheets");
    }
    
    // Extract header row to determine columns
    const headerRow = worksheet.getRow(1).values;
    const columns = headerRow.map(String);
    
    // Try to identify column positions
    let dateIndex = findColumnIndex(columns, ['date', 'transaction date', 'time']);
    let amountIndex = findColumnIndex(columns, ['amount', 'sum', 'total', 'value']);
    let typeIndex = findColumnIndex(columns, ['type', 'transaction type', 'category type']);
    let descriptionIndex = findColumnIndex(columns, ['description', 'desc', 'details', 'note', 'memo']);
    let categoryIndex = findColumnIndex(columns, ['category', 'tag', 'label']);

    // If essential columns are missing, try to use AI to infer structure
    if (dateIndex === -1 || amountIndex === -1) {
      // Sample data for AI analysis
      const sampleRows = [];
      for (let i = 2; i <= Math.min(6, worksheet.rowCount); i++) {
        sampleRows.push(worksheet.getRow(i).values);
      }
      
      try {
        // Use Gemini to analyze the structure
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const prompt = `
          Analyze this Excel data where first row is headers and identify the columns for:
          - Transaction date
          - Amount
          - Type (income/expense)
          - Description
          - Category
          
          Data sample:
          ${JSON.stringify(columns)}
          ${JSON.stringify(sampleRows)}
          
          Return JSON with column indices (1-based):
          {
            "dateIndex": number,
            "amountIndex": number,
            "typeIndex": number,
            "descriptionIndex": number,
            "categoryIndex": number
          }
        `;
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
        
        const inferredColumns = JSON.parse(cleanedText);
        
        // Use inferred columns if not found manually
        if (dateIndex === -1 && inferredColumns.dateIndex) dateIndex = inferredColumns.dateIndex;
        if (amountIndex === -1 && inferredColumns.amountIndex) amountIndex = inferredColumns.amountIndex;
        if (typeIndex === -1 && inferredColumns.typeIndex) typeIndex = inferredColumns.typeIndex;
        if (descriptionIndex === -1 && inferredColumns.descriptionIndex) descriptionIndex = inferredColumns.descriptionIndex;
        if (categoryIndex === -1 && inferredColumns.categoryIndex) categoryIndex = inferredColumns.categoryIndex;
      } catch (aiError) {
        console.error("AI inference failed:", aiError);
        // Continue with the columns we have
      }
    }
    
    // If we still don't have essential columns, throw error
    if (dateIndex === -1 || amountIndex === -1) {
      throw new Error("Could not identify date and amount columns in the file");
    }
    
    // Process rows and extract transactions
    const transactions = [];
    
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i).values;
      if (!row[dateIndex] || !row[amountIndex]) continue; // Skip empty rows
      
      let date;
      // Try to parse date in different formats
      if (row[dateIndex] instanceof Date) {
        date = row[dateIndex];
      } else {
        try {
          // Try parsing as ISO date or other common formats
          date = new Date(row[dateIndex]);
          if (isNaN(date.getTime())) {
            // If invalid date, try other formats like DD/MM/YYYY
            const parts = String(row[dateIndex]).split(/[\/\-\.]/);
            if (parts.length === 3) {
              // Try different date formats
              date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              if (isNaN(date.getTime())) {
                date = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
              }
            }
          }
        } catch (e) {
          continue; // Skip rows with unparseable dates
        }
      }
      
      // Parse amount
      let amount = parseFloat(String(row[amountIndex]).replace(/[^\d.-]/g, ''));
      if (isNaN(amount)) continue;
      
      // Determine transaction type if available, otherwise guess from amount sign
      let type;
      if (typeIndex > -1) {
        const typeValue = String(row[typeIndex] || '').toLowerCase();
        if (typeValue.includes('expense') || typeValue.includes('debit') || typeValue.includes('withdrawal')) {
          type = "EXPENSE";
        } else if (typeValue.includes('income') || typeValue.includes('credit') || typeValue.includes('deposit')) {
          type = "INCOME";
        } else {
          type = amount < 0 ? "EXPENSE" : "INCOME";
        }
      } else {
        type = amount < 0 ? "EXPENSE" : "INCOME";
      }
      
      // Ensure amount is positive (type field handles expense vs income)
      amount = Math.abs(amount);
      
      // Get description if available
      const description = descriptionIndex > -1 ? String(row[descriptionIndex] || '') : '';
      
      // Get category if available
      const category = categoryIndex > -1 ? String(row[categoryIndex] || '') : '';
      
      transactions.push({
        date,
        amount,
        type,
        description,
        category
      });
    }
    
    return { 
      success: true, 
      data: transactions,
      message: `Found ${transactions.length} transactions in the Excel file`
    };
  } catch (error) {
    console.error("Error importing Excel transactions:", error);
    throw new Error("Failed to import Excel transactions: " + error.message);
  }
}

// Helper function to find column index by possible names (case insensitive)
function findColumnIndex(columns, possibleNames) {
  const index = columns.findIndex(col => {
    if (!col) return false;
    const colName = String(col).toLowerCase().trim();
    return possibleNames.some(name => colName.includes(name.toLowerCase()));
  });
  return index;
}

// Helper function to calculate next recurring date
function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}