"use server";

import { db } from "@/lib/prisma";
import { request } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { Suspense } from "react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import AccountCard from "./_components/account-card/AccountCard";
import { CreateAccountDrawer } from "@/components/CreateAccountDrawer";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getBudget } from "@/actions/Budget";
import { BudgetProgress } from "./_components/BudgetProgress";
import DashboardOverview from "./_components/transaction-overview";

export default async function DashboardPage() {
  const accounts = await getUserAccounts();

  const defaultAccount = accounts.find((acc) => acc.isDefault);
  let budgetData = { budget: null, expenses: 0, remaining: 0 };

  if (defaultAccount) {
    budgetData = await getBudget(defaultAccount.id);
  }

  const transactions = await getDashboardData();

  return (
    <div className="space-y-8">
    

      {/* Budget Progress */}
      {defaultAccount && (
        <BudgetProgress
          accountId={defaultAccount.id}
          initialBudget={budgetData?.budget}
          currentExpenses={budgetData?.expenses || 0}
          accountName={defaultAccount.name}
          isDefault={defaultAccount.isDefault}
        />
      )}
      {/* Overview */}
      <Suspense fallback={"Loading overview..."}>
        <DashboardOverview
          accounts={accounts}
          transactions={transactions || []}
        />
      </Suspense>

      {/* Account Grid */}
      <div className="grid gap-4 grid-cols-1 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {accounts.length > 0 &&
          [...accounts]
            .sort((a, b) => {
              if (a.isDefault && !b.isDefault) return -1;
              if (!a.isDefault && b.isDefault) return 1;
              if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt) - new Date(b.createdAt);
              }
              return a.id - b.id;
            })
            .map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
      </div>
    </div>
  );
}
