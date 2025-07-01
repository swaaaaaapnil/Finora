import React, { Suspense } from 'react';
import DashboardPage from './page';
import { BarLoader } from 'react-spinners';
import { CreateAccountDrawer } from '@/components/CreateAccountDrawer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const DashboardLayout = () => {
  return (
    <div className="px-8 pt-24 pb-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <CreateAccountDrawer>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2"
              aria-label="Add New Account"
            >
              <Plus className="h-5 w-5 " />
              <span className="cursor-pointer hidden sm:inline">Create Account</span>
            </Button>
          </CreateAccountDrawer>
        </div>
        <div className="h-1 w-40 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mt-4" />
      </div>
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <BarLoader color="#3B82F6" width={"100%"} />
        </div>
      }>
        <DashboardPage />
      </Suspense>
    </div>
  );
};

export default DashboardLayout;