"use client";

import { SignIn } from '@clerk/nextjs'
import React, { useEffect } from 'react'

const page = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  return (
    <div>
      <SignIn />
    </div>
  )
}

export default page
