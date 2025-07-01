import { getAccountWithTransactions } from '@/actions/accounts';
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react'
import TransactionTable from '../_components/TransactionTable';
import { BarLoader } from 'react-spinners';
import AccountChart from '../_components/AccountChart';

const AccountPage = async ({ params }) => {
  // Get the account ID from the route params
  const {id} =  await params;
  if (!id) {
    notFound();
  }

  const accountData = await getAccountWithTransactions(id);
  if (!accountData) {
    notFound();
  }

  const {transactions, ...account} = accountData;
  
  // Format amount in Indian rupee format
  const formatIndianCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  };

  // Capitalize account name
  const capitalizeWords = (str) => {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="w-full min-h-screen pt-24 px-4 sm:px-6 lg:px-8 pb-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Main Account Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
          {/* Account Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full mb-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {capitalizeWords(account.name)}
            </h1>
            <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 rounded-full">
              <span className="text-xs font-semibold text-blue-700 uppercase">
                {account.type.charAt(0).toUpperCase() + account.type.slice(1).toLowerCase()} Account
              </span>
            </div>
          </div>

          {/* Balance Section */}
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-xs font-medium text-gray-600 uppercase mb-1">Current Balance</p>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {formatIndianCurrency(account.balance)}
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium">{account._count.transactions} Transaction{account._count.transactions !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <BarLoader color="#3b82f6" width="50%" height={4} speedMultiplier={0.5} />
              </div>
            }>
            <AccountChart transactions={transactions}/>
          </Suspense>  
        </div>

        {/* Transactions Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-12">
                <BarLoader color="#3b82f6" width="50%" height={4} speedMultiplier={0.5} />
              </div>
            }>
            <TransactionTable transactions={transactions}/>
          </Suspense>   
        </div>
      </div>
    </div>
  )
}

export default AccountPage