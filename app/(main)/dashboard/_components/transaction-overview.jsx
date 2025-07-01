"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Modern color palette (Material Design + pastel)
const MODERN_COLORS = [
  "#6366F1", // Indigo
  "#06B6D4", // Cyan
  "#22D3EE", // Sky
  "#10B981", // Emerald
  "#F59E42", // Orange
  "#F43F5E", // Rose
  "#A78BFA", // Purple
  "#FBBF24", // Amber
  "#34D399", // Green
  "#60A5FA", // Blue
  "#F472B6", // Pink
  "#F87171", // Red
];

function formatINR(amount) {
  return Number(amount).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const getMonthOptions = () => {
  const now = new Date();
  // Show last 12 months including current
  return Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: format(d, "MMMM yyyy"),
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });
};

const DashboardOverview = ({ accounts, transactions }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
  );

  // Month selection state
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);

  // Parse selected month/year
  const [selectedYear, selectedMonthNum] = selectedMonth
    .split("-")
    .map(Number);

  // Filter transactions for selected account
  const accountTransactions = transactions.filter(
    (t) => t.accountId === selectedAccountId
  );

  // Recent transactions (latest 5)
  const recentTransactions = [...accountTransactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Filter only EXPENSE transactions for selected month
  const monthExpenses = accountTransactions.filter((t) => {
    if (t.type !== "EXPENSE") return false;
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() + 1 === selectedMonthNum &&
      transactionDate.getFullYear() === selectedYear
    );
  });

  // Group expenses by category and sum
  const expensesByCategory = monthExpenses.reduce((acc, transaction) => {
    const category = transaction.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + Number(transaction.amount);
    return acc;
  }, {});

  // Prepare data for PieChart
  const pieChartData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({
      name: category,
      value: amount,
    })
  );

  return (
    <div className="flex flex-col gap-6 w-full lg:flex-row lg:gap-6">
      {/* Recent Transactions Card */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <Card className="shadow-sm border h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Recent Transactions
            </CardTitle>
            <Select
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            >
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-0">
            <div className="space-y-3 sm:space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 sm:py-8">
                  No recent transactions
                </p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted transition"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {transaction.description
                          ? transaction.description
                          : transaction.category
                          ? transaction.category
                          : "Untitled Transaction"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), "PP")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center font-semibold text-base",
                          transaction.type === "EXPENSE"
                            ? "text-red-500"
                            : "text-green-600"
                        )}
                      >
                        {transaction.type === "EXPENSE" ? (
                          <ArrowDownRight className="mr-1 h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="mr-1 h-4 w-4" />
                        )}
                        {formatINR(transaction.amount)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Expense Breakdown Card */}
      <div className="w-full lg:w-1/2 flex flex-col mt-2 lg:mt-0">
        <Card className="shadow-sm border h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Monthly Expense Breakdown
            </CardTitle>
            <Select
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            >
              <SelectTrigger className="w-[140px] sm:w-[170px]">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center p-4 sm:p-6">
            {pieChartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 sm:py-8">
                No expenses this month
              </p>
            ) : (
              <div className="h-[220px] sm:h-[320px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      // smaller radius for mobile
                      fill="#6366F1"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={MODERN_COLORS[index % MODERN_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatINR(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        fontSize: "12px",
                        paddingTop: "6px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
