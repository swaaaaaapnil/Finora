"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useFetch from "@/hooks/useFetch";
import { createAccount } from "@/actions/dashboard";
import { accountSchema } from "@/app/lib/schema";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateAccountDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "CURRENT",
      balance: 0,
      isDefault: false,
      currency: "RS",
    },
  });

  const { loading, fn: createAccountFn, error, data: newAccount } = useFetch(createAccount);

  const onSubmit = async (data) => {
    console.log("onSubmit called", data);
    data.balance = Number(data.balance);
    await createAccountFn(data);
  };

  useEffect(() => {
    if (newAccount && newAccount.success) {
      toast.success("Account created successfully");
      reset();
      setOpen(false);
    }
  }, [newAccount, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to create account");
    }
  }, [error]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="bg-white rounded-t-xl w-full max-w-2xl mx-auto">
        {/* Wider but compact height container */}
        <div className="max-h-[65vh] flex flex-col">
          {/* Compact header */}
          <DrawerHeader className="px-4 py-2 border-b">
            <DrawerTitle className="text-base font-semibold text-gray-900">
              Create New Account
            </DrawerTitle>
            <DrawerDescription className="text-[10px] text-gray-500">
              Set up a new account to manage your finances
            </DrawerDescription>
          </DrawerHeader>

          {/* Compact form */}
          <div className="p-4 overflow-y-auto flex-1">
            <form id="account-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              {/* Account Name */}
              <div>
                <label htmlFor="name" className="text-xs font-medium text-gray-700 block mb-1">
                  Account Name
                </label>
                <Input 
                  id="name" 
                  placeholder="Enter account name"
                  className="h-8 text-xs"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-red-500 text-[10px] mt-0.5">{errors.name.message}</p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label htmlFor="type" className="text-xs font-medium text-gray-700 block mb-1">
                  Account Type
                </label>
                <Select 
                  onValueChange={(value) => setValue('type', value)}
                  defaultValue={watch('type')}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CURRENT" className="text-xs">Current</SelectItem>
                    <SelectItem value="SAVINGS" className="text-xs">Savings</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-red-500 text-[10px] mt-0.5">{errors.type.message}</p>
                )}
              </div>

              {/* Initial Balance */}
              <div>
                <label htmlFor="balance" className="text-xs font-medium text-gray-700 block mb-1">
                  Initial Balance
                </label>
                <Input 
                  id="balance" 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  className="h-8 text-xs"
                  {...register('balance', { valueAsNumber: true })}
                />
                {errors.balance && (
                  <p className="text-red-500 text-[10px] mt-0.5">{errors.balance.message}</p>
                )}
              </div>

              {/* Default Account Toggle */}
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div>
                  <label htmlFor="isDefault" className="text-xs font-medium text-gray-800">
                    Set as Default Account
                  </label>
                  <p className="text-[10px] text-gray-500">
                    Selected by default for transactions
                  </p>
                </div>
                <Switch 
                  id="isDefault"
                  onCheckedChange={(checked) => setValue('isDefault', checked)}
                  checked={watch('isDefault')}
                  className="scale-90 origin-right"
                />
              </div>

              {/* Error message */}
              {error && (
                <p className="text-red-500 text-[10px] mt-1">
                  {error.message || String(error)}
                </p>
              )}
            </form>
          </div>

          {/* Compact footer */}
          <DrawerFooter className="px-4 py-2 border-t mt-0">
            <div className="flex gap-3">
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-8 text-xs"
                >
                  Cancel
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                form="account-form"
                className="flex-1 h-8 text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Creating...</>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export { CreateAccountDrawer };