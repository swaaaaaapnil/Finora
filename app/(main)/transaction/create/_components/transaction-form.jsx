"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarIcon,
  Loader2,
  IndianRupee,
  CreditCard,
  ReceiptText, // Changed for a better header icon
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import useFetch from "@/hooks/useFetch";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // <-- Import Label
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CreateAccountDrawer } from "@/components/CreateAccountDrawer";
import { cn } from "@/lib/utils";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import ReceiptScanner from "./receipt-scanner";

// Utility for INR formatting
const formatINR = (amount) =>
  Number(amount).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

export function AddTransactionForm({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id || "",
            date: new Date(),
            isRecurring: false,
            recurringInterval: undefined,
            category: undefined,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const [loadingToastId, setLoadingToastId] = useState(null);

  const onSubmit = (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };

    const toastId = toast.loading(
      editMode ? "Updating transaction..." : "Creating transaction...",
      {
        description: editMode
          ? "Saving your changes."
          : "Adding transaction to your account.",
      }
    );
    setLoadingToastId(toastId);

    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  const handleScanComplete = (scannedData) => {
    if (scannedData) {
      toast.success("Receipt Scanned!", {
        description: "Form has been populated with scanned data.",
        duration: 3000,
      });
      setValue("amount", scannedData.amount.toString(), { shouldValidate: true });
      setValue("date", new Date(scannedData.date), { shouldValidate: true });
      if (scannedData.description) {
        setValue("description", scannedData.description);
      }
      if (scannedData.category) {
        setValue("category", scannedData.category);
      }
    }
  };
  

  useEffect(() => {
    if (loadingToastId && (transactionResult || !transactionLoading)) {
      toast.dismiss(loadingToastId);
      setLoadingToastId(null);

      if (transactionResult?.success) {
        toast.success(
          editMode ? "Transaction Updated" : "Transaction Created",
          {
            description: editMode
              ? "Your changes have been saved."
              : "The new transaction is recorded.",
            duration: 2000,
          }
        );
        reset();
        setTimeout(() => {
          router.push(`/account/${transactionResult.data.accountId}`);
        }, 1000); 
      } else if (transactionResult && !transactionResult.success) {
        toast.error("Operation Failed", {
          description: transactionResult.error || "Please check your inputs and try again.",
          duration: 4000,
        });
      }
    }
  }, [transactionResult, transactionLoading, loadingToastId, editMode, reset, router]);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");

  const filteredCategories = categories.filter(
    (category) => category.type === type
  );

  return (
    <div className="w-full max-w-2xl mx-auto pt-8 sm:pt-12 pb-8 px-4 sm:px-6 md:px-8 bg-card text-card-foreground rounded-lg shadow-lg border">
      {/* --- Header --- */}
      <div className="mb-6 sm:mb-8 text-center flex flex-col items-center">
        <div className="p-3 mb-2 bg-primary/10 rounded-full border border-primary/20">
            <ReceiptText className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          {editMode ? "Edit Transaction" : "New Transaction"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {editMode
            ? "Update the details of your transaction."
            : "Fill in the details to record a new transaction."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* --- Scan Section (Not in Edit Mode) --- */}
        {!editMode && (
          <div className="space-y-2 rounded-lg border-2 border-dashed border-border bg-muted/50 p-4">
              <h3 className="font-semibold text-center text-sm sm:text-base text-foreground">
                Start with a Scan
              </h3>
              <p className="text-xs text-muted-foreground text-center mb-4">
                Automatically fill details by scanning a receipt.
              </p>
            <ReceiptScanner onScanComplete={handleScanComplete} />
          </div>
        )}
        
        {/* --- Core Details Grid --- */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Field Group: Transaction Type */}
          <div className="space-y-1.5">
            <Label htmlFor="type" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> Type
            </Label>
            <Select
              onValueChange={(value) => {
                setValue("type", value);
                setValue("category", undefined); // Reset category when type changes
              }}
              defaultValue={type}
              name="type"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EXPENSE" className="text-red-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" /> Expense
                  </div>
                </SelectItem>
                <SelectItem value="INCOME" className="text-green-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" /> Income
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type.message}</p>}
          </div>

          {/* Field Group: Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4" /> Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className={cn("pl-7", errors.amount && "border-red-500")}
                {...register("amount")}
              />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
          </div>
        </div>

        {/* --- Account & Category Grid --- */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Field Group: Account */}
          <div className="space-y-1.5">
            <Label htmlFor="accountId" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Account
            </Label>
            <Select
              onValueChange={(value) => setValue("accountId", value)}
              defaultValue={getValues("accountId")}
              name="accountId"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{account.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatINR(account.balance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                 <CreateAccountDrawer>
                  <Button variant="ghost" className="w-full justify-start font-normal text-sm pl-2 mt-1 border-t rounded-none h-auto py-2">
                    + Add New Account
                  </Button>
                </CreateAccountDrawer>
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-xs text-red-500 mt-1">{errors.accountId.message}</p>}
          </div>

          {/* Field Group: Category */}
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select
              onValueChange={(value) => setValue("category", value)}
              key={type} // Re-mount component on type change to clear visual state
              defaultValue={getValues("category")}
              name="category"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
                 <Button variant="ghost" className="w-full justify-start font-normal text-sm pl-2 mt-1 border-t rounded-none h-auto py-2" disabled>
                    + Manage Categories
                  </Button>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category.message}</p>}
          </div>
        </div>

        {/* --- Date & Description Grid --- */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Field Group: Date */}
          <div className="space-y-1.5">
            <Label htmlFor="date" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" /> Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.date && "border-red-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => setValue("date", d, { shouldValidate: true })}
                  disabled={(d) => d > new Date() || d < new Date("1900-01-01")}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>}
          </div>

          {/* Field Group: Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="e.g., Coffee with friends"
              className={cn(errors.description && "border-red-500")}
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>
        </div>

        {/* --- Recurring Section --- */}
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <Label htmlFor="isRecurring" className="flex items-center gap-2 font-semibold">
                      <RefreshCw className="h-4 w-4" />
                      Recurring Transaction
                    </Label>
                    <p className="text-xs text-muted-foreground">Set this transaction to repeat automatically.</p>
                </div>
                <Switch
                  id="isRecurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => {
                    setValue("isRecurring", checked);
                    if (!checked) setValue("recurringInterval", undefined);
                  }}
                />
            </div>
            
            {isRecurring && (
              <div className="space-y-1.5 pt-4 border-t">
                  <Label htmlFor="recurringInterval" className="text-sm font-medium">Frequency</Label>
                  <Select
                      onValueChange={(value) => setValue("recurringInterval", value)}
                      defaultValue={getValues("recurringInterval")}
                  >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency"/>
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                  </Select>
                  {errors.recurringInterval && <p className="text-xs text-red-500 mt-1">{errors.recurringInterval.message}</p>}
              </div>
            )}
        </div>


        {/* --- Action Buttons --- */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
            disabled={transactionLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto sm:flex-1"
            disabled={transactionLoading}
          >
            {transactionLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {editMode ? "Saving..." : "Creating..."}</>
            ) : (
                editMode ? "Save Changes" : "Create Transaction"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}