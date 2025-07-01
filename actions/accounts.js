"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Helper function to serialize Decimal values from Prisma to regular numbers
 */
const serializeDecimal = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }
  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  return serialized;
};

/**
 * Get all accounts for the current user
 */
export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return accounts.map(serializeDecimal);
}

/**
 * Create a new account
 */
export async function createAccount(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const existingAccounts = await db.account.findMany({ where: { userId: user.id } });
  const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;

  if (shouldBeDefault) {
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const balanceFloat = parseFloat(data.balance);
  if (isNaN(balanceFloat)) throw new Error("Invalid balance amount");

  const account = await db.account.create({
    data: {
      name: data.name,
      type: data.type,
      balance: balanceFloat,
      userId: user.id,
      isDefault: shouldBeDefault,
      currency: data.currency,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, data: serializeDecimal(account) };
}

/**
 * Get a specific account with its transactions
 */
export async function getAccountWithTransactions(accountId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const account = await db.account.findUnique({
    where: {
      id: accountId,
      userId: user.id,
    },
    include: {
      transactions: {
        orderBy: { date: "desc" },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!account) return null;

  return {
    ...serializeDecimal(account),
    transactions: account.transactions.map(serializeDecimal),
  };
}

/**
 * Update the default account
 */
export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    // First, unset any existing default account
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    // Then set the new default account
    const account = await db.account.update({
      where: { id: accountId, userId: user.id },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");
    return { success: true, data: serializeDecimal(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete an account
 */
export async function deleteAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    // Check if this is the default account
    const account = await db.account.findUnique({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Delete the account
    await db.account.delete({
      where: { id: accountId, userId: user.id },
    });

    // If this was the default account, set another account as default
    if (account.isDefault) {
      const anotherAccount = await db.account.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      if (anotherAccount) {
        await db.account.update({
          where: { id: anotherAccount.id },
          data: { isDefault: true },
        });
      }
    }

    revalidatePath("/dashboard");
    revalidatePath("/accounts");
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Bulk delete transactions from an account
 */
export async function bulkDeleteTransactions(transactionIds) {
  try {
    // First, get the transactions to calculate balance changes
    const transactions = await db.transaction.findMany({
      where: {
        id: {
          in: transactionIds
        }
      },
      select: {
        id: true,
        amount: true,
        type: true,
        accountId: true
      }
    });

    // Calculate the net balance change
    const balanceChanges = transactions.reduce((acc, t) => {
      // Convert Prisma Decimal to number before calculations
      const transactionAmount = typeof t.amount === 'object' ? 
        t.amount.toNumber() : Number(t.amount);
      
      // For expenses, add to balance (removing expense increases balance)
      // For income, subtract from balance (removing income decreases balance)
      const amount = t.type === 'EXPENSE' ? transactionAmount : -transactionAmount;
      
      if (!acc[t.accountId]) acc[t.accountId] = 0;
      acc[t.accountId] += amount;
      return acc;
    }, {});

    // Perform the deletion and balance updates in a transaction
    await db.$transaction(async (tx) => {
      // Delete the transactions
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds }
        }
      });

      // Update account balances
      for (const [accountId, balanceChange] of Object.entries(balanceChanges)) {
        await tx.account.update({
          where: { id: accountId },
          data: { 
            balance: {
              increment: Number(balanceChange.toFixed(2)) // Ensure we have a clean number with 2 decimal places
            }
          }
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[accountId]");

    return {
      success: true,
      message: `Successfully deleted ${transactionIds.length} transaction(s)`
    };
  } catch (error) {
    console.error('Error in bulkDeleteTransactions:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete transactions'
    };
  }
}

/**
 * Update account details
 */
export async function updateAccount(accountId, data) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({ where: { clerkUserId: userId } });
    if (!user) throw new Error("User not found");

    const account = await db.account.update({
      where: { id: accountId, userId: user.id },
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/account/${accountId}`);
    return { success: true, data: serializeDecimal(account) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}