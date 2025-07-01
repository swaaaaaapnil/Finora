"use client";

import { bulkDeleteTransactions } from '@/actions/accounts';
import React, { useState } from 'react'
import { Table, TableBody, TableCell, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns';
import { categoryColors } from '@/data/category.js'; 
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from "@/components/ui/button";
import { ArrowUpDown, RotateCcw, Search } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

const TransactionTable = ({transactions, onTransactionsChange}) => {
    // 1. First declare all state variables
    const [sortConfig, setSortConfig] = React.useState({ key: 'date', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const itemsPerPage = 10;

    // 2. Define filteredAndSortedTransactions
    const filteredAndSortedTransactions = React.useMemo(() => {
        // First apply search and type filters
        const filtered = transactions.filter(transaction => {
            // Format the transaction date to match the display format
            const formattedDate = format(new Date(transaction.date), "MMM dd, yyyy").toLowerCase();
            
            const matchesSearch = searchTerm === '' || 
                transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.amount?.toString().includes(searchTerm) ||
                formattedDate.includes(searchTerm.toLowerCase()); // Add date search
                
            const matchesType = typeFilter === 'all' || 
                transaction.type.toLowerCase() === typeFilter.toLowerCase();

            return matchesSearch && matchesType;
        });

        // Then sort the filtered results
        return filtered.sort((a, b) => {
            switch (sortConfig.key) {
                case 'date':
                    return sortConfig.direction === 'asc' 
                        ? new Date(a.date) - new Date(b.date)
                        : new Date(b.date) - new Date(a.date);
                case 'amount':
                    return sortConfig.direction === 'asc' 
                        ? a.amount - b.amount
                        : b.amount - a.amount;
                case 'category':
                    return sortConfig.direction === 'asc'
                        ? a.category.localeCompare(b.category)
                        : b.category.localeCompare(a.category);
                default:
                    return 0;
            }
        });
    }, [transactions, sortConfig, searchTerm, typeFilter]);

    // 3. Calculate pagination values after filteredAndSortedTransactions is defined
    const totalItems = filteredAndSortedTransactions.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredAndSortedTransactions.slice(startIndex, endIndex);

    // Add useEffect to log selectedIds whenever it changes
    React.useEffect(() => {
        console.log('Selected IDs:', selectedIds);
    }, [selectedIds]);

    const handleSort = (key) => {
        setSortConfig(prevConfig => ({
            key,
            direction: prevConfig.key === key 
                ? prevConfig.direction === 'asc' ? 'desc' : 'asc'
                : 'desc'
        }));
    };

    const handleReset = () => {
        setSortConfig({ key: 'date', direction: 'desc' });
        setSelectedIds([]); // Reset selections too
    };

    const handleSelect = (id) => {
        setSelectedIds(current => {
            const newSelection = current.includes(id) 
                ? current.filter(i => i !== id) 
                : [...current, id];
            console.log('Selection updated:', newSelection); // Log on selection change
            return newSelection;
        });
    };

    const handleSelectAll = (checked) => {
        console.log('Select all:', checked);
        if (checked) {
            // Select all transactions
            const allIds = filteredAndSortedTransactions.map(t => t.id);
            setSelectedIds(allIds);
        } else {
            // Deselect all
            setSelectedIds([]);
        }
    };

    const handleRowClick = (id, event) => {
        // Prevent row click if clicking the checkbox or its label
        if (event.target.type === 'checkbox' || event.target.tagName.toLowerCase() === 'label') {
            return;
        }
        
        // If clicking anywhere else in the row, toggle selection
        handleSelect(id);
    };

    const handleDelete = async () => {
        try {
            // Show confirmation dialog
            if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} transaction(s)?`)) {
                return;
            }

            const result = await bulkDeleteTransactions(selectedIds);

            if (!result.success) {
                throw new Error(result.error || 'Failed to delete transactions');
            }

            // Show success message using Sonner
            toast.success(`Successfully deleted ${selectedIds.length} transaction(s)`);

            // Clear selected IDs
            setSelectedIds([]);
            
            // Instead of reloading the page, update the transactions prop
            if (onTransactionsChange) {
                // Filter out deleted transactions
                const updatedTransactions = transactions.filter(
                    transaction => !selectedIds.includes(transaction.id)
                );
                onTransactionsChange(updatedTransactions);
            }

        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.message || "Failed to delete transactions. Please try again.");
        }
    };

    // Verify selectedIds with console log
    React.useEffect(() => {
        console.log('Selected IDs changed:', selectedIds, selectedIds.length);
    }, [selectedIds]);

    // Pagination component
    const Pagination = () => {
        return (
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-t border-gray-200">
                <div className="flex-1 flex items-center justify-between gap-4">
                    {/* Results count - Hidden on mobile */}
                    <div className="hidden sm:block text-sm text-gray-700">
                        <span className="font-medium">{startIndex + 1}</span>
                        {' '}-{' '}
                        <span className="font-medium">
                            {Math.min(endIndex, totalItems)}
                        </span>
                        {' '}of{' '}
                        <span className="font-medium">{totalItems}</span>
                    </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                        >
                            <svg 
                                className="h-3 w-3 sm:h-4 sm:w-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </Button>
                        <span className="text-xs sm:text-sm font-medium min-w-[100px] text-center">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <svg 
                                className="h-3 w-3 sm:h-4 sm:w-4" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    return (



        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Filter Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 sm:p-6 bg-gray-50 border-b border-gray-200">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        className="pl-10 h-10 text-sm bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Search by description, category, amount, or date..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Type Filter */}
                <div className="w-full sm:w-auto">
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="h-10 w-full sm:w-[180px] bg-white border-gray-200">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Transactions</SelectItem>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Selected Items Bar - Modified */}
            {selectedIds.length > 0 ? (
                <div className="px-4 sm:px-6 py-3 border-b border-gray-200 bg-red-50">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">{selectedIds.length}</span> item{selectedIds.length !== 1 ? 's' : ''} selected
                        </p>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={handleDelete}
                            className="flex items-center gap-2 hover:bg-red-600 cursor-pointer"
                        >
                            <svg
                                className="h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            <span className="hidden sm:inline">Delete Selected</span>
                        </Button>
                    </div>
                </div>
            ) : null}

            {/*Transaction Table */}
            <div className="p-4 sm:p-6">
                {/* Table Header Section with Reset Button */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Transactions</h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                Manage and track your financial activities
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleReset}
                            className="flex items-center gap-2 w-auto sm:w-auto cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline truncate">Reset</span>
                        </Button>
                    </div>
                </div>

                {/* Table Container */}
                <div className="w-full overflow-x-auto">
                    <div className="align-middle">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors duration-200">
                                    <TableHead className="w-[40px] sm:w-[50px]">
                                        <Checkbox 
                                            className="ml-2 h-4 w-4 cursor-pointer"
                                            onCheckedChange={handleSelectAll}
                                            checked={
                                                filteredAndSortedTransactions.length > 0 && 
                                                selectedIds.length === filteredAndSortedTransactions.length
                                            }
                                            ref={(input) => {
                                                if (input) {
                                                    input.indeterminate = 
                                                        selectedIds.length > 0 && 
                                                        selectedIds.length < filteredAndSortedTransactions.length;
                                            }
                                        }}
                                    />
                                    </TableHead>
                                    <TableHead 
                                        className="w-[90px] sm:w-auto font-medium text-xs sm:text-sm cursor-pointer"
                                        onClick={() => handleSort('date')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Date</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell font-medium text-xs sm:text-sm min-w-[120px]">
                                        Description
                                    </TableHead>
                                    <TableHead 
                                        className="w-[100px] sm:w-auto font-medium text-xs sm:text-sm cursor-pointer"
                                        onClick={() => handleSort('category')}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>Category</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </div>
                                    </TableHead>
                                    <TableHead 
                                        className="w-[100px] sm:w-auto font-medium text-xs sm:text-sm text-right cursor-pointer"
                                        onClick={() => handleSort('amount')}
                                    >
                                        <div className="flex items-center justify-end space-x-1">
                                            <span>Amount</span>
                                            <ArrowUpDown className="w-4 h-4" />
                                        </div>
                                    </TableHead>
                                    <TableHead className="hidden sm:table-cell font-medium text-xs sm:text-sm">Type</TableHead>
                                    <TableHead className="hidden sm:table-cell font-medium text-xs sm:text-sm">Recurring</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!currentItems.length ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 sm:py-10">
                                            <p className="text-gray-500 text-sm font-medium">No transactions found</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    currentItems.map((transaction) => (
                                        <TableRow 
                                            key={transaction.id} 
                                            className="hover:bg-gray-100/80 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                                            onClick={(e) => handleRowClick(transaction.id, e)}
                                        >
                                            <TableCell 
                                                className="w-[40px] sm:w-[50px]"
                                                onClick={(e) => e.stopPropagation()} // Prevent row click when clicking the cell
                                            >
                                                <Checkbox 
                                                    className="ml-2 h-4 w-4 cursor-pointer" 
                                                    checked={selectedIds.includes(transaction.id)}
                                                    onCheckedChange={() => handleSelect(transaction.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">
                                                {format(new Date(transaction.date), "MMM dd, yyyy")}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell text-xs sm:text-sm max-w-[150px] truncate">
                                                {transaction.description}
                                            </TableCell>
                                            <TableCell>
                                                <span 
                                                    style={{background: categoryColors[transaction.category]}} 
                                                    className="px-2 py-1 sm:px-3 rounded-full text-[10px] sm:text-xs font-medium text-white whitespace-nowrap"
                                                >
                                                    {transaction.category}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">
                                                <span className={`${
                                                    transaction.type === 'EXPENSE' 
                                                        ? 'text-red-600' 
                                                        : 'text-green-600'
                                                }`}>
                                                    {transaction.type === 'EXPENSE' ? '-' : '+'}
                                                    {new Intl.NumberFormat('en-IN', {
                                                        style: 'currency',
                                                        currency: 'INR',
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2
                                                    }).format(transaction.amount)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge 
                                                    variant={transaction.type === 'EXPENSE' ? "destructive" : "success"} 
                                                    className="text-[10px] sm:text-xs whitespace-nowrap"
                                                >
                                                    {transaction.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Badge 
                                                            variant={transaction.isRecurring ? "secondary" : "outline"} 
                                                            className={`text-[10px] sm:text-xs whitespace-nowrap ${
                                                                !transaction.isRecurring && "bg-gray-50"
                                                            }`}
                                                        >
                                                            {transaction.isRecurring ? "Multiple" : "One-time"}
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    {transaction.isRecurring && (
                                                        <TooltipContent className="p-2">
                                                            <div className="text-xs">
                                                                <p className="font-medium mb-1">Transaction Date:</p>
                                                                <p>{format(new Date(transaction.date), "MMM dd, yyyy")}</p>
                                                            </div>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        <Pagination />
                    </div>
                </div>
            </div>

            {/* Pagination Component - Added here */}
            
        </div>
 
    )
}

export default TransactionTable
