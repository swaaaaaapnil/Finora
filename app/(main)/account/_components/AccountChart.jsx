"use client"

import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Rectangle } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TrendingUp, TrendingDown, IndianRupee, BarChart2 } from 'lucide-react';

// --- Constants & Date Helpers ---
const DATE_RANGES = {
    "7D": { label: "Last 7 Days", days: 7 },
    "1M": { label: "Last Month", days: 30 },
    "3M": { label: "Last 3 Months", days: 90 },
    "ALL": { label: "All Time", days: null }
};

const startOfDay = (date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); return d; };
const endOfDay = (date) => { const d = new Date(date); d.setHours(23, 59, 59, 999); return d; };
const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const subDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() - days); return d; };

// Format date with custom options
const format = (date, formatStr) => {
    const d = new Date(date);
    if (formatStr === "yyyy-MM-dd") return d.toISOString().split('T')[0];
    if (formatStr === "dd MMM") {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    }
    if (formatStr === "MMM yyyy") {
        return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }
    return d.toString();
};

const getDateArray = (start, end) => {
    const arr = [];
    let dt = startOfDay(start);
    while (dt <= end) {
        arr.push(new Date(dt));
        dt = addDays(dt, 1);
    }
    return arr;
};

// Helper functions for date grouping - MOVED OUTSIDE COMPONENT
const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

// Get month key (for grouping by month)
const getMonthKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
};

// Format month for display
const formatMonth = (date) => {
    return format(date, "MMM yyyy");
};

const AccountChart = ({ transactions = [] }) => {
    const [dateRange, setDateRange] = useState("1M");
    const [hiddenKeys, setHiddenKeys] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const formatToRupees = useCallback((amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount);
    }, []);

    const processedTransactions = useMemo(() => transactions.map(t => ({
        ...t, type: t.type.toLowerCase(), date: startOfDay(new Date(t.date)), amount: parseFloat(t.amount)
    })), [transactions]);

    const dateBoundaries = useMemo(() => {
        if (processedTransactions.length === 0) {
            const now = new Date();
            return { earliest: now, latest: now };
        }
        const dates = processedTransactions.map(t => t.date);
        return { earliest: new Date(Math.min(...dates)), latest: new Date(Math.max(...dates)) };
    }, [processedTransactions]);

    const { filteredData, totals, net } = useMemo(() => {
        if (processedTransactions.length === 0) {
            return { filteredData: [], totals: { income: 0, expense: 0 }, net: 0 };
        }
        
        const range = DATE_RANGES[dateRange];
        const now = endOfDay(new Date());
        let startDate, endDate;
        
        // FIX: Correctly set date range based on selected option
        if (range.days === null) {
            // For "ALL" option, use the earliest transaction date
            startDate = dateBoundaries.earliest;
            endDate = now;
        } else {
            // For time-limited options (including 6M), calculate based on days from now
            startDate = startOfDay(subDays(now, range.days - 1));
            endDate = now;
        }
        
        // Filter and group transactions
        const grouped = {};
        let totalIncome = 0;
        let totalExpense = 0;
        
        processedTransactions.forEach((transaction) => {
            if (transaction.date >= startDate && transaction.date <= endDate) {
                const key = format(transaction.date, "yyyy-MM-dd");
                
                if (!grouped[key]) {
                    grouped[key] = { date: transaction.date, income: 0, expense: 0 };
                }
                
                if (transaction.type === 'income') {
                    grouped[key].income += transaction.amount;
                    totalIncome += transaction.amount;
                } else if (transaction.type === 'expense') {
                    grouped[key].expense += transaction.amount;
                    totalExpense += transaction.amount;
                }
            }
        });
        
        let result;
        
        // Determine how to group the data based on range and device
        if (range.days && range.days > 90) {
            // For 3M+ ranges, group by month for better visibility
            const monthlyData = {};
            
            Object.entries(grouped).forEach(([dateKey, values]) => {
                const date = new Date(dateKey);
                const monthKey = getMonthKey(date);
                const displayMonth = formatMonth(date);
                
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { 
                        date: displayMonth, 
                        fullDate: date, 
                        income: 0, 
                        expense: 0 
                    };
                }
                
                monthlyData[monthKey].income += values.income;
                monthlyData[monthKey].expense += values.expense;
            });
            
            // Convert to array and sort by date
            result = Object.values(monthlyData).sort((a, b) => 
                new Date(a.fullDate) - new Date(b.fullDate)
            );
            
        } else if (isMobile && range.days && range.days > 30) {
            // For 1M+ on mobile, group by week
            const weeklyData = {};
            
            Object.entries(grouped).forEach(([dateKey, values]) => {
                const date = new Date(dateKey);
                const weekStart = getStartOfWeek(date);
                const weekKey = format(weekStart, "yyyy-MM-dd");
                const displayWeek = format(weekStart, "dd MMM");
                
                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = { 
                        date: displayWeek, 
                        fullDate: weekStart, 
                        income: 0, 
                        expense: 0 
                    };
                }
                
                weeklyData[weekKey].income += values.income;
                weeklyData[weekKey].expense += values.expense;
            });
            
            // Convert to array and sort by date
            result = Object.values(weeklyData).sort((a, b) => 
                new Date(a.fullDate) - new Date(b.fullDate)
            );
            
        } else if (range.days && range.days <= 90) {
            // For shorter ranges (up to 3M), show daily data
            const dateArr = getDateArray(startDate, endDate);
            
            result = dateArr.map(dateObj => {
                const key = format(dateObj, "yyyy-MM-dd");
                const entry = grouped[key] || { date: dateObj, income: 0, expense: 0 };
                return { 
                    date: format(dateObj, "dd MMM"), 
                    fullDate: dateObj, 
                    income: entry.income, 
                    expense: entry.expense 
                };
            });
        } else {
            // For any other case, use daily data
            result = Object.values(grouped).sort((a, b) => a.date - b.date).map(entry => ({
                date: format(entry.date, "dd MMM"), 
                fullDate: entry.date, 
                income: entry.income, 
                expense: entry.expense
            }));
        }
        
        return { 
            filteredData: result, 
            totals: { income: totalIncome, expense: totalExpense }, 
            net: totalIncome - totalExpense 
        };
    }, [processedTransactions, dateRange, dateBoundaries, isMobile]);

    const toggleKeyVisibility = (key) => {
        setHiddenKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/80 backdrop-blur-sm p-3 sm:p-4 border border-slate-200 rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95">
                    <p className="font-bold text-slate-800 mb-1 sm:mb-2">{label}</p>
                    {payload.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2 my-1">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                            <span className="text-xs sm:text-sm font-medium text-slate-600 capitalize">
                                {entry.name}:
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-800 ml-auto">
                                {formatToRupees(entry.value)}
                            </span>
                        </div>
                    ))}
                    {/* Show net balance in tooltip */}
                    {payload.length > 1 && (
                        <div className="mt-2 pt-1 border-t border-slate-200">
                            <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-medium">Net:</span>
                                <span className={`text-xs sm:text-sm font-bold ${
                                    (payload[0]?.value - payload[1]?.value) >= 0 
                                        ? "text-emerald-600" 
                                        : "text-rose-600"
                                }`}>
                                    {formatToRupees(payload[0]?.value - payload[1]?.value)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const getXAxisInterval = () => {
        const len = filteredData.length;
        if (isMobile) {
            if (len <= 7) return 0;
            if (len <= 14) return 1;
            if (len <= 30) return Math.floor(len / 4);
            return Math.floor(len / 3);
        } else {
            if (len <= 10) return 0;
            if (len <= 31) return Math.floor(len / 8);
            return Math.floor(len / 12);
        }
    };

    const hasData = useMemo(() => {
        return filteredData.length > 0 && filteredData.some(d => d.income > 0 || d.expense > 0)
    }, [filteredData]);

    // --- Color Palette Definition ---
    const COLORS = {
        income: { light: '#34d399', dark: '#059669', gradient: 'url(#incomeGradient)' },
        expense: { light: '#f87171', dark: '#dc2626', gradient: 'url(#expenseGradient)' },
        netPositive: { text: 'text-sky-600', border: 'border-sky-200', bg: 'bg-sky-50' },
        netNegative: { text: 'text-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
    };

    return (
        <Card className="w-full shadow-xl shadow-slate-200/60 border border-slate-100 bg-white rounded-xl">
            <CardHeader className="p-4 sm:p-6">
                {/* --- Main Title --- */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Transaction Overview
                    </CardTitle>
                    <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-full sm:w-[160px] bg-white border-slate-300 hover:border-slate-400 transition-all text-sm">
                            <SelectValue placeholder="Select Range" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                                <SelectItem key={key} value={key} className="hover:bg-slate-50 focus:bg-slate-100">
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* --- Stats Grid --- */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                    <StatCard icon={TrendingUp} title="Income" value={formatToRupees(totals.income)} colorClass="text-emerald-600" isMobile={isMobile} />
                    <StatCard icon={TrendingDown} title="Expenses" value={formatToRupees(totals.expense)} colorClass="text-rose-600" isMobile={isMobile} />
                    <StatCard 
                        icon={IndianRupee} 
                        title="Net" 
                        value={formatToRupees(net)} 
                        colorClass={net >= 0 ? "text-sky-600" : "text-amber-600"}
                        isMobile={isMobile}
                    />
                </div>
            </CardHeader>

            <CardContent className="px-1 sm:px-6 pb-4 sm:pb-6">
                <div className="w-full h-[300px] sm:h-[400px] bg-slate-50/70 rounded-xl p-2 sm:p-4 border border-slate-100 relative">
                    {/* --- Custom Interactive Legend --- */}
                    <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex items-center gap-2 sm:gap-4">
                        <LegendItem label="Income" color={COLORS.income.light} onClick={() => toggleKeyVisibility('income')} active={!hiddenKeys.includes('income')} isMobile={isMobile} />
                        <LegendItem label="Expense" color={COLORS.expense.light} onClick={() => toggleKeyVisibility('expense')} active={!hiddenKeys.includes('expense')} isMobile={isMobile} />
                    </div>

                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <BarChart2 className="h-12 sm:h-16 w-12 sm:w-16 text-slate-300 mb-2 sm:mb-4" />
                            <p className="text-lg sm:text-xl font-semibold text-slate-600">No Transaction Data</p>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1 text-center px-4">
                                There are no income or expense records for the selected time range.
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={filteredData}
                                margin={{
                                    top: 30, 
                                    right: isMobile ? 5 : 10, 
                                    left: isMobile ? -15 : 0, 
                                    bottom: isMobile ? 0 : 5
                                }}
                                barGap={isMobile ? 2 : 6}
                                barCategoryGap={isMobile ? "30%" : "20%"} 
                                maxBarSize={isMobile ? 24 : 30}
                            >
                                <defs>
                                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.income.light} stopOpacity={0.9} />
                                        <stop offset="95%" stopColor={COLORS.income.dark} stopOpacity={0.9} />
                                    </linearGradient>
                                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={COLORS.expense.light} stopOpacity={0.9} />
                                        <stop offset="95%" stopColor={COLORS.expense.dark} stopOpacity={0.9} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: isMobile ? 9 : 12, fill: '#64748b' }}
                                    interval={getXAxisInterval()}
                                    axisLine={false}
                                    tickLine={false}
                                    height={isMobile ? 35 : 30}
                                    tickMargin={isMobile ? 8 : 5}
                                    angle={isMobile ? -45 : 0}
                                    textAnchor={isMobile ? "end" : "middle"}
                                />
                                <YAxis
                                    tickFormatter={(value) => isMobile ? 
                                        `₹${Number(value) >= 1000 ? (Number(value) / 1000) + 'k' : value}` : 
                                        `₹${Number(value) / 1000}k`}
                                    tick={{ fontSize: isMobile ? 9 : 12, fill: '#64748b' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={isMobile ? 35 : 40}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
                                {!hiddenKeys.includes('income') && <Bar dataKey="income" name="Income" fill={COLORS.income.gradient} radius={[4, 4, 0, 0]} activeBar={<Rectangle fill={COLORS.income.dark} />} />}
                                {!hiddenKeys.includes('expense') && <Bar dataKey="expense" name="Expense" fill={COLORS.expense.gradient} radius={[4, 4, 0, 0]} activeBar={<Rectangle fill={COLORS.expense.dark} />} />}
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// --- Sub-components for cleaner structure ---

const StatCard = ({ icon: Icon, title, value, colorClass, isMobile }) => (
    <div className="p-2.5 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all duration-300">
        <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-full bg-slate-100 ${colorClass}`}>
                <Icon className="h-3 w-3 sm:h-5 sm:w-5" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500">{title}</p>
        </div>
        <p className={`text-sm sm:text-xl md:text-2xl font-bold text-slate-800 mt-1.5 sm:mt-3 truncate ${colorClass}`}>
            {isMobile ? value.replace('.00', '') : value}
        </p>
    </div>
);

const LegendItem = ({ label, color, onClick, active, isMobile }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium rounded-md px-2 sm:px-3 py-1 sm:py-1.5 transition-all ${
            active ? 'text-slate-700 bg-slate-100' : 'text-slate-400 bg-transparent'
        }`}
    >
        <div
            className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all`}
            style={{ backgroundColor: active ? color : '#94a3b8' }}
        />
        {label}
    </button>
);

export default AccountChart;