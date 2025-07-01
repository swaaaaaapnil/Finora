"use client";

import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowRight } from 'lucide-react';
import ChartAnimation from './ChartAnimation';
import { TypeAnimation } from 'react-type-animation';
import { useState, useEffect, useRef } from "react";

const Herosection = () => {
  const [wiggle, setWiggle] = useState(false);
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  // Function to start the wiggle interval
  const startWiggleInterval = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setWiggle(true);
      timeoutRef.current = setTimeout(() => setWiggle(false), 700); // match animation duration
    }, 4400); // <-- 4.4 seconds
  };

  // Function to stop the wiggle interval
  const stopWiggleInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setWiggle(false);
  };

  useEffect(() => {
    startWiggleInterval();
    return () => stopWiggleInterval();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="h-screen px-2 sm:px-4 flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 xl:gap-16 text-center md:text-left">
      {/* Left: Text content */}
      <div className="flex-1 flex flex-col items-center md:items-start justify-center z-10 w-full max-w-lg sm:max-w-xl xl:max-w-2xl mx-auto md:ml-12 xl:ml-24 2xl:ml-40">
        <h1 className="font-extrabold text-white mb-2 min-h-[32px] drop-shadow-lg text-xl sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-6xl md:text-left">
          <TypeAnimation
            sequence={[
              'Boost Your Finances',
              1500,
              'Track Instantly',
              1500,
              'Automate Your Savings',
              1500,
              'Optimize Your Budget',
              1500,
            ]}
            wrapper="span"
            speed={30}
            repeat={Infinity}
          />
        </h1>
        <h2 className="font-semibold mb-4 min-h-[24px] drop-shadow bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent text-sm sm:text-base md:text-xl lg:text-xl xl:text-2xl 2xl:text-3xl md:text-left">
          <TypeAnimation
            sequence={[
              'The Smartest Way to Manage Money',
              1500,
              'AI-Powered & User-Friendly',
              1500,
              'Personalized Financial Guidance',
              1500,
            ]}
            wrapper="span"
            speed={40}
            repeat={Infinity}
          />
        </h2>
        <p className="max-w-xl text-gray-300 mb-6 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-xl md:text-left">
          Experience the future of personal finance with our AI-powered platform. Get intelligent insights,
          automated tracking, and personalized recommendations to help you reach your financial goals faster and smarter.
        </p>
        <div className="flex justify-center md:justify-start mt-4 sm:mt-6 w-full">
          <Link href="/dashboard">
            <Button
              size="lg"
              className={`px-6 sm:px-8 py-3 sm:py-4 bg-yellow-400 text-black font-bold rounded-full flex items-center gap-2 shadow-lg border-2 border-yellow-400 transition-all duration-500 hover:bg-black hover:text-yellow-400 hover:border-yellow-400 ${wiggle ? "wiggle" : ""}`}
              onMouseEnter={stopWiggleInterval}
              onMouseLeave={startWiggleInterval}
            >
              Try for Free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
      {/* Right: Chart animation */}
      <div className="flex-1 flex justify-center items-center z-10">
        <div className="
          w-20 h-20
          sm:w-32 sm:h-32
          md:w-64 md:h-64
          lg:w-96 lg:h-96
          xl:w-[500px] xl:h-[500px]
          2xl:w-[700px] 2xl:h-[700px]
          flex items-center justify-center
        ">
          <ChartAnimation />
        </div>
      </div>
    </div>
  );
};

export default Herosection;
