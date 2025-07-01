"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };
  if (typeof obj.balance !== "undefined" && obj.balance !== null)
    serialized.balance = obj.balance.toNumber();
  if (typeof obj.amount !== "undefined" && obj.amount !== null)
    serialized.amount = obj.amount.toNumber();
  if (obj.createdAt) serialized.createdAt = obj.createdAt.toISOString();
  if (obj.updatedAt) serialized.updatedAt = obj.updatedAt.toISOString();
  return serialized;
};

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
  return { success: true, data: serializeTransaction(account) };
}

export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const accounts = await db.account.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return accounts.map(serializeTransaction);
}

export async function updateDefaultAccount(accountId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  await db.account.updateMany({
    where: { userId: user.id, isDefault: true },
    data: { isDefault: false },
  });

  const updated = await db.account.update({
    where: { id: accountId, userId: user.id },
    data: { isDefault: true },
  });

  revalidatePath("/dashboard");
  return { success: true, data: serializeTransaction(updated) };
}

export async function editAccount(accountId, data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // Check if account exists and belongs to user
  const existingAccount = await db.account.findUnique({
    where: { id: accountId, userId: user.id }
  });

  if (!existingAccount) {
    throw new Error("Account not found");
  }

  const balanceFloat = parseFloat(data.balance);
  if (isNaN(balanceFloat)) throw new Error("Invalid balance amount");

  // If setting this account as default, remove default from others
  if (data.isDefault && !existingAccount.isDefault) {
    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await db.account.update({
    where: { id: accountId, userId: user.id },
    data: {
      name: data.name,
      type: data.type,
      balance: balanceFloat,
      isDefault: data.isDefault,
      currency: data.currency,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, data: serializeTransaction(updated) };
}

export async function deleteAccount(accountId) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  // Check if this is the only account
  const accountCount = await db.account.count({ where: { userId: user.id } });
  if (accountCount <= 1) {
    throw new Error("Cannot delete the last account. You must have at least one account.");
  }

  // Check if this is the default account
  const accountToDelete = await db.account.findUnique({
    where: { id: accountId, userId: user.id }
  });

  if (!accountToDelete) {
    throw new Error("Account not found");
  }

  // If deleting the default account, make another account default
  if (accountToDelete.isDefault) {
    const otherAccount = await db.account.findFirst({
      where: { 
        userId: user.id, 
        id: { not: accountId } 
      }
    });

    if (otherAccount) {
      await db.account.update({
        where: { id: otherAccount.id },
        data: { isDefault: true }
      });
    }
  }

  // Delete the account (this will cascade delete related transactions, budgets, etc.)
  await db.account.delete({
    where: { id: accountId, userId: user.id }
  });

  revalidatePath("/dashboard");
  return { success: true, message: "Account deleted successfully" };
}

export async function getDashboardData() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get all user transactions
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  return transactions.map(serializeTransaction);
}