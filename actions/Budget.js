"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getBudget(accountId) {
  if (!accountId) {
    return { budget: null, expenses: 0, remaining: 0 };
  }

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Account not found or access denied.");

  const budget = await db.budget.findFirst({
    where: { accountId: accountId },
    orderBy: { createdAt: "desc" },
  });

  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const expensesData = await db.transaction.aggregate({
    where: {
      accountId: accountId,
      type: "EXPENSE",
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  const totalExpenses = expensesData._sum.amount ? Number(expensesData._sum.amount) : 0;
  const budgetAmount = budget ? Number(budget.amount) : 0;

  return {
    budget: budget ? { ...budget, amount: budgetAmount, spent: Number(budget.spent || 0) } : null,
    expenses: totalExpenses,
    remaining: budgetAmount - totalExpenses,
  };
}

export async function updateBudget({ amount, accountId }) {
  if (!accountId) {
    throw new Error("Account ID is required to update a budget.");
  }

  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({ where: { clerkUserId: userId } });
  if (!user) throw new Error("User not found");

  const account = await db.account.findFirst({
    where: { id: accountId, userId: user.id },
  });
  if (!account) throw new Error("Account not found or access denied.");

  const budgetAmount = parseFloat(amount);
  if (isNaN(budgetAmount) || budgetAmount < 0) {
    throw new Error("Invalid budget amount.");
  }

  const existingBudget = await db.budget.findFirst({
    where: { accountId: accountId },
  });

  let budget;
  if (existingBudget) {
    budget = await db.budget.update({
      where: { id: existingBudget.id },
      data: { amount: budgetAmount },
    });
  } else {
    budget = await db.budget.create({
      data: {
        name: `${account.name} Budget`,
        amount: budgetAmount,
        category: "General",
        spent: 0,
        accountId: accountId, // The relation is through the account
      },
    });
  }

  revalidatePath("/dashboard");

  return {
    success: true,
    budget: {
      ...budget,
      amount: Number(budget.amount),
      spent: Number(budget.spent),
    },
  };
}