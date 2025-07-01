"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, AlertTriangle, TrendingUp, Wallet, Target } from "lucide-react";
import useFetch from "@/hooks/useFetch";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/Budget";

export function BudgetProgress({ accountId, initialBudget, currentExpenses, accountName, isDefault }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  useEffect(() => {
    setNewBudget(initialBudget?.amount?.toString() || "");
  }, [initialBudget, isDefault]);

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const budgetAmount = initialBudget?.amount || 0;
  const expenses = currentExpenses || 0;
  const percentUsed = budgetAmount > 0 ? (expenses / budgetAmount) * 100 : 0;
  const remaining = budgetAmount - expenses;

  const formatIndianCurrency = (num) => {
    const absoluteNum = Math.abs(num);
    const formattedNum = absoluteNum.toLocaleString('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    });
    return num < 0 ? `- ₹${formattedNum}` : `₹${formattedNum}`;
  };

  const getProgressGradientClass = () => {
    if (percentUsed >= 100) return "bg-gradient-to-r from-red-500 to-rose-600";
    if (percentUsed >= 90) return "bg-gradient-to-r from-amber-400 to-orange-500";
    if (percentUsed >= 75) return "bg-gradient-to-r from-yellow-400 to-amber-500";
    return "bg-green-500";
  };

  const getStatusColor = () => {
    if (percentUsed >= 100) return "text-red-500";
    if (percentUsed >= 90) return "text-amber-500";
    if (percentUsed >= 75) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusIcon = () => {
    if (percentUsed >= 100) return <AlertTriangle className={`h-3 w-3 ${getStatusColor()}`} />;
    if (percentUsed >= 75) return <AlertTriangle className={`h-3 w-3 ${getStatusColor()}`} />;
    return <TrendingUp className={`h-3 w-3 ${getStatusColor()}`} />;
  };

  const getStatusText = () => {
    if (percentUsed > 100) return "Exceeded";
    if (percentUsed === 100) return "Complete";
    if (percentUsed >= 90) return "Near limit";
    return "On track";
  };

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount greater than 0.");
      return;
    }
    await updateBudgetFn({ amount, accountId });
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleUpdateBudget();
    else if (e.key === "Escape") handleCancel();
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully!");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to update budget.");
  }, [error]);

  if (!isDefault && !initialBudget?.accountId) return null;

  return (
    <Card className="w-full max-w-full mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:shadow-md">
      <CardHeader className="px- py-2 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate">
                Monthly Budget
              </CardTitle>
              <span className="hidden sm:inline-flex text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                {accountName || "Default Account"}
              </span>
            </div>
            <span className="sm:hidden text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-full">
              {accountName || "Default Account"}
            </span>
            {!isEditing && initialBudget && (
              <CardDescription className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
                Track your spending against your monthly limit.
              </CardDescription>
            )}
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 mt-3">
            <Input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-9 text-sm flex-grow dark:bg-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              placeholder="50000"
              autoFocus
              disabled={isLoading}
              min="0"
              step="100"
            />
            <Button
              size="sm"
              onClick={handleUpdateBudget}
              disabled={isLoading}
              className="h-9 px-3 bg-green-500 hover:bg-green-600 text-white shrink-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isLoading}
              className="h-9 px-3 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : initialBudget && (
          <div className="mt-2">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {formatIndianCurrency(expenses)}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                / {formatIndianCurrency(budgetAmount)}
              </span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        {initialBudget ? (
          <div className="space-y-3">
            <div className="w-full">
              <div className="relative h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out ${getProgressGradientClass()}`}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between items-center text-xs font-medium">
                <span className="text-slate-500 dark:text-slate-400">
                  {percentUsed.toFixed(0)}% Used
                </span>
                <div className={`flex items-center gap-1 ${getStatusColor()}`}>
                  {getStatusIcon()}
                  <span className="hidden sm:inline">{getStatusText()}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  <Target className="h-3 w-3" />
                  <span className="hidden sm:inline">Budget</span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                  {formatIndianCurrency(budgetAmount)}
                </div>
              </div>

              <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">Spent</span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100">
                  {formatIndianCurrency(expenses)}
                </div>
              </div>

              <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  <Wallet className="h-3 w-3" />
                  <span className="hidden sm:inline">Left</span>
                </div>
                <div className={`text-sm sm:text-base font-semibold ${remaining < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-500'}`}>
                  {formatIndianCurrency(remaining)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 mb-3">
              <Pencil className="h-5 w-5 text-slate-500 dark:text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              No Budget Set
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 px-2">
              Set a monthly budget for {accountName || "this account"} to track spending
            </p>
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Set Budget
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
