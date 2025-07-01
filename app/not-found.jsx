import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black via-blue-900 to-purple-900 text-white overflow-hidden">
      <h1 className="text-8xl font-bold mb-4">404</h1>
      <p className=" text-2xl mb-10">BYE BYE</p>
      <Link href="/" passHref>
        <Button className="bg-blue-600 hover:bg-black text-white px-6 py-2 rounded-lg">
          Go to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
