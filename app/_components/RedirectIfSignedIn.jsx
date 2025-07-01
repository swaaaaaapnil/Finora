"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function RedirectIfSignedIn() {
  return (
    <>
      <SignInButton redirecturl="/dashboard">
        <Button variant="ghost" className="...">
          Login
        </Button>
      </SignInButton>
      <SignUpButton />
    </>
  );
}

