import { inngest } from "./client";
import { db } from "@/lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { formatINR } from "@/lib/currency"; // Adjust path as needed
import { GoogleGenerativeAI } from "@google/generative-ai";

export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" }, // Every 6 hours
  async ({ step }) => {
    const budgets = await step.run("fetch-budgets", async () => {
      return await db.budget.findMany({
        include: {
          account: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    for (const budget of budgets) {
      await step.run(`check-budget-${budget.id}`, async () => {
        // Start of current month (set time to 00:00:00)
        const startDate = new Date();
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        // End of current month
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Calculate total expenses for this budget's account in current month
        const expenses = await db.transaction.aggregate({
          where: {
            accountId: budget.accountId,
            type: "EXPENSE",
            date: {
              gte: startDate,
              lt: endDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const budgetAmount = budget.amount !== null && budget.amount !== undefined
          ? Number(budget.amount.toString())
          : 0;
        const totalExpenses = Number(expenses._sum.amount?.toString() || "0");
        const remaining = budgetAmount - totalExpenses;
        const percentageUsed = budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

        // Debugging
        console.log({
          budgetId: budget.id,
          rawBudgetAmount: budget.amount,
          budgetAmount,
          rawTotalExpenses: expenses._sum.amount,
          totalExpenses,
          remaining,
          percentageUsed
        });

        if (
          percentageUsed >= 80 && // Default threshold of 80%
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()))
        ) {
          await sendEmail({
            to: budget.account.user.email,
            subject: `Budget Alert for ${budget.account.name}`,
            react: EmailTemplate({
              userName: budget.account.user.name,
              type: "budget-alert",
              data: {
                percentageUsed,
                budgetAmount: formatINR(Number(budgetAmount)),
                totalExpenses: formatINR(Number(totalExpenses)),
                remaining: formatINR(Number(remaining)),
                accountName: budget.account.name,
              },
            }),
          });

          // Update lastAlertSent date
          await db.budget.update({
            where: { id: budget.id },
            data: { lastAlertSent: new Date() },
          });
        }
      });
    }
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  return (
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear()
  );
}

async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();

    // Sometimes Gemini may prepend text, try to extract JSON
    let jsonStart = cleanedText.indexOf("[");
    if (jsonStart > -1) {
      const jsonText = cleanedText.substring(jsonStart);
      return JSON.parse(jsonText);
    }

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}

export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" }, // First day of each month
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}



