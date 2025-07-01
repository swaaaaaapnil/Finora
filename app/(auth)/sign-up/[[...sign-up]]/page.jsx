"use client";

import { SignUp } from '@clerk/nextjs'
import React, { useEffect } from 'react'

const page = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      <SignUp />
    </div>
  );
};

export default page
