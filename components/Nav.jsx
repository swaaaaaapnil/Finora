'use client';

import { useEffect, useState } from 'react';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import { LayoutDashboard, PenBox } from 'lucide-react';
import { Button } from './ui/button';

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const headerClasses = `fixed left-0 right-0 z-50 transition-all border-black duration-500 ease-in-out ${
    scrolled
      ? 'top-4 bg-black/80 backdrop-blur-md rounded-full shadow-lg border border-black mx-auto max-w-screen-xl px-6 py-2'
      : 'top-0 bg-transparent px-8 py-2 w-full'
  }`;

  if (!mounted) {
    return (
      <header className="fixed left-0 right-0 z-50 transition-all border-black duration-500 ease-in-out top-0 bg-transparent px-8 py-2 w-full">
        <div className="flex items-center justify-between transition-all duration-500 ease-in-out">
          <Link href="/" className="flex items-center">
            <Image
              src="/Logo.png"
              alt="logo"
              height={80}
              width={200}
              className="h-14 w-auto object-contain"
              priority
            />
          </Link>

          <div className="flex items-center gap-3 md:gap-6">
            <SignedIn>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-black border-gray-700 hover:text-blue-400 hover:bg-gray-900 transition"
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>

              <Link href="/transaction/create">
                <Button
                  variant="default"
                  className="flex items-center gap-2 bg-blue-600 text-white hover:text-blue-600 hover:bg-white transition"
                >
                  <PenBox size={18} />
                  <span className="hidden sm:inline text-sm">Add transaction</span>
                </Button>
              </Link>
            </SignedIn>

            <SignedOut>
              <div className="flex items-center gap-2">
                <SignInButton redirecturl="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-white border-gray-700 hover:bg-black hover:text-blue-400 transition"
                  >
                    Login
                  </Button>
                </SignInButton>

                <SignUpButton>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-black text-white transition"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>

            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8 md:h-10 md:w-10 border-2 border-blue-400',
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClasses}>
      <div className="flex items-center justify-between transition-all duration-500 ease-in-out">
        <Link href="/" className="flex items-center">
          <Image
            src="/Logo.png"
            alt="logo"
            height={80}
            width={200}
            className="h-14 w-auto object-contain"
            priority
          />
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          <SignedIn>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="flex items-center gap-2 text-black border-gray-700 hover:text-blue-400 hover:bg-gray-900 transition"
              >
                <LayoutDashboard size={18} />
                <span className="hidden sm:inline cursor-pointer">Dashboard</span>
              </Button>
            </Link>

            <Link href="/transaction/create">
              <Button
                variant="default"
                className="flex items-center gap-2 bg-blue-600 text-white hover:text-blue-600 hover:bg-white transition"
              >
                <PenBox size={18} />
                <span className="hidden sm:inline text-sm cursor-pointer">Add transaction</span>
              </Button>
            </Link>
          </SignedIn>

          <SignedOut>
            <div className="flex items-center gap-2">
              <SignInButton redirecturl="/dashboard">
                <Button
                  variant="ghost"
                  className="text-white border-gray-700 hover:bg-black hover:text-blue-400 transition"
                >
                  Login
                </Button>
              </SignInButton>

              <SignUpButton>
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-black text-white transition"
                >
                  Sign Up
                </Button>
              </SignUpButton>
            </div>
          </SignedOut>

          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8 md:h-10 md:w-10 border-2 border-blue-400',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Nav;
