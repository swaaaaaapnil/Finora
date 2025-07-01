"use client";

import React, { useState } from "react";
// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Icons
import { Star, Trash2, Edit3, MoreVertical, Banknote, CreditCard, Landmark, LineChart } from "lucide-react";

// Other Imports
import Link from "next/link";
import { toast } from "sonner";
import { updateDefaultAccount, deleteAccount, editAccount } from "@/actions/dashboard";
import useFetch from "@/hooks/useFetch";

// EditAccountForm component remains unchanged.
const EditAccountForm = ({ accountData, onSubmit, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({ 
        name: accountData.name || '', 
        type: accountData.type || 'SAVINGS', 
        balance: accountData.balance || '0', 
        currency: accountData.currency || 'INR', 
        isDefault: accountData.isDefault || false 
    });
    
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        onSubmit(formData); 
    };
    
    const handleChange = (field, value) => { 
        setFormData(prev => ({ ...prev, [field]: value })); 
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Account Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="type">Account Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="SAVINGS">Savings</SelectItem>
                        <SelectItem value="CURRENT">Current</SelectItem>
                        <SelectItem value="CREDIT">Credit</SelectItem>
                        <SelectItem value="INVESTMENT">Investment</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Input id="balance" type="number" step="0.01" value={formData.balance} onChange={(e) => handleChange('balance', e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleChange('currency', value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2">
                <Switch id="isDefault" checked={formData.isDefault} onCheckedChange={(checked) => handleChange('isDefault', checked)} />
                <Label htmlFor="isDefault">Set as default account</Label>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-6">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Account'}
                </Button>
            </DialogFooter>
        </form>
    );
};

const AccountTypeIcon = ({ type, className = "h-5 w-5 text-slate-600" }) => {
    switch (type) {
        case 'SAVINGS': return <Landmark className={className} />;
        case 'CURRENT': return <Banknote className={className} />;
        case 'CREDIT': return <CreditCard className={className} />;
        case 'INVESTMENT': return <LineChart className={className} />;
        default: return <Banknote className={className} />;
    }
};

const AccountActions = ({ isDefault, onSetDefault, onEdit, onDelete }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100" 
                onClick={e => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                }}
            >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
            {!isDefault && (
                <DropdownMenuItem onSelect={onSetDefault} className="cursor-pointer">
                    <Star className="mr-2 h-4 w-4" />
                    <span>Set as Default</span>
                </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onEdit} className="cursor-pointer">
                <Edit3 className="mr-2 h-4 w-4" />
                <span>Edit Account</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
                onSelect={onDelete} 
                className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
            >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Account</span>
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
);

const AccountCard = ({ account }) => {
    const { name, type, balance, id, isDefault, currency } = account;
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);

    const { 
        loading: updateDefaultLoading, 
        fn: updateDefaultFn 
    } = useFetch(updateDefaultAccount);
    
    const { 
        loading: deleteLoading, 
        fn: deleteFn 
    } = useFetch(deleteAccount);
    
    const { 
        loading: editLoading, 
        fn: editFn 
    } = useFetch(editAccount);

    const handleSetDefault = async () => {
        if (isDefault) {
            toast.warning("Already your default account", {
                description: `${name} is already set as your default account.`,
                duration: 3000
            });
            return;
        }

        // Show loading toast
        const loadingToastId = toast.loading("Setting as default account", {
            description: `Making ${name} your default account`
        });

        try {
            const result = await updateDefaultFn(id);
            toast.dismiss(loadingToastId);
            
            if (result?.success) {
                toast.success("Default account updated", {
                    description: `${name} is now your default account.`,
                    duration: 4000
                });
            } else {
                toast.error("Failed to set default account", {
                    description: "Please try again.",
                    duration: 5000
                });
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            toast.error("Something went wrong", {
                description: "Please try again later.",
                duration: 5000
            });
        }
    };

    const handleDelete = async () => {
        // Show loading toast
        const loadingToastId = toast.loading("Deleting account", {
            description: `Removing ${name} from your accounts`
        });

        try {
            const result = await deleteFn(id);
            toast.dismiss(loadingToastId);
            
            if (result?.success) {
                toast.success("Account deleted successfully", {
                    description: `${name} has been permanently removed.`,
                    duration: 4000
                });
                setShowDeleteDialog(false);
            } else {
                toast.error("Failed to delete account", {
                    description: "Please try again.",
                    duration: 5000
                });
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            toast.error("Something went wrong", {
                description: "Please try again later.",
                duration: 5000
            });
        }
    };

    const handleEdit = async (data) => {
        // Show loading toast
        const loadingToastId = toast.loading("Updating account", {
            description: `Saving changes to ${name}`
        });

        try {
            const result = await editFn(id, data);
            toast.dismiss(loadingToastId);
            
            if (result?.success) {
                toast.success("Account updated successfully", {
                    description: `${name} has been updated with your changes.`,
                    duration: 4000
                });
                setShowEditDialog(false);
            } else {
                toast.error("Failed to update account", {
                    description: "Please try again.",
                    duration: 5000
                });
            }
        } catch (error) {
            toast.dismiss(loadingToastId);
            toast.error("Something went wrong", {
                description: "Please try again later.",
                duration: 5000
            });
        }
    };

    // Simplified dialog handlers
    const handleEditDialogOpen = () => {
        setShowEditDialog(true);
    };

    const handleDeleteDialogOpen = () => {
        setShowDeleteDialog(true);
    };

    const handleEditCancel = () => {
        setShowEditDialog(false);
    };

    const handleDeleteCancel = () => {
        setShowDeleteDialog(false);
    };

    const validCurrencyCode = currency === 'RS' ? 'INR' : currency;
    const formatCurrency = (value) => new Intl.NumberFormat("en-IN", { 
        style: 'currency', 
        currency: validCurrencyCode, 
        minimumFractionDigits: 2 
    }).format(value);

    const formattedBalance = formatCurrency(balance);

    return (
        <>
            <Card className="group relative w-full overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300 h-full">
                <div className={`absolute top-0 left-0 h-full w-1.5 transition-colors duration-300 ${isDefault ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-slate-400'}`} />
                <Link href={`/account/${id}`} className="block h-full">
                    
                    {/* MOBILE LAYOUT: Fixed Height List View */}
                    <div className="flex items-center justify-between gap-3 p-4 pl-6 sm:hidden h-[80px]">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex-shrink-0">
                                <AccountTypeIcon type={type} className="h-5 w-5 text-slate-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="truncate font-semibold text-sm text-slate-800 leading-tight">{name}</h3>
                                    {isDefault && <Star className="h-3 w-3 flex-shrink-0 text-yellow-500 fill-current" />}
                                </div>
                                <p className="text-xs text-slate-500 capitalize leading-tight">{type.toLowerCase()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                                <p className="font-semibold text-sm text-slate-900 leading-tight whitespace-nowrap">{formattedBalance}</p>
                            </div>
                            <AccountActions 
                                isDefault={isDefault} 
                                onSetDefault={handleSetDefault} 
                                onEdit={handleEditDialogOpen} 
                                onDelete={handleDeleteDialogOpen} 
                            />
                        </div>
                    </div>

                    {/* DESKTOP VIEW: Fixed Height Card Layout */}
                    <div className="hidden sm:flex h-[160px] flex-col">
                        {/* Header Section - Fixed Height */}
                        <header className="flex items-center justify-between p-5 pb-0 h-[60px]">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <AccountTypeIcon type={type} className="h-5 w-5 text-slate-600 flex-shrink-0" />
                                <h3 className="truncate text-base font-bold text-slate-800 leading-tight">{name}</h3>
                                {isDefault && <Star className="h-4 w-4 flex-shrink-0 text-yellow-500 fill-current" />}
                            </div>
                            <div className="flex-shrink-0">
                                <AccountActions 
                                    isDefault={isDefault} 
                                    onSetDefault={handleSetDefault} 
                                    onEdit={handleEditDialogOpen} 
                                    onDelete={handleDeleteDialogOpen} 
                                />
                            </div>
                        </header>
                        
                        {/* Content Section - Remaining Height */}
                        <CardContent className="flex-1 flex flex-col justify-between p-5 pt-3">
                            {/* Account Type */}
                            <div className="flex items-center justify-center flex-1">
                                <p className="text-sm font-medium text-slate-500 capitalize leading-tight">
                                    {type.toLowerCase()} Account
                                </p>
                            </div>
                            
                            {/* Balance - Fixed at Bottom */}
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900 leading-tight whitespace-nowrap">
                                    {formattedBalance}
                                </p>
                            </div>
                        </CardContent>
                    </div>
                </Link>
            </Card>
            
            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Account</DialogTitle>
                    </DialogHeader>
                    <EditAccountForm 
                        accountData={{ 
                            name, 
                            type, 
                            balance: balance.toString(), 
                            isDefault, 
                            currency: validCurrencyCode 
                        }} 
                        onSubmit={handleEdit} 
                        isLoading={editLoading} 
                        onCancel={handleEditCancel} 
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader className="text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4">
                            <Trash2 className="h-7 w-7 text-red-600" />
                        </div>
                        <AlertDialogTitle className="text-xl font-semibold text-slate-900">
                            Delete Account?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-600 mt-2">
                            Are you sure you want to delete "{name}"? This action cannot be undone and will permanently remove all associated data including transactions and history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-4">
                        <AlertDialogCancel onClick={handleDeleteCancel}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete} 
                            disabled={deleteLoading}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
                        >
                            {deleteLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Deleting...
                                </div>
                            ) : (
                                'Yes, Delete'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default AccountCard;