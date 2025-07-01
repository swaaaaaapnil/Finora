import { Inter } from "next/font/google";
import "./globals.css";
import Head from "../components/Head";
import { ClerkProvider } from "@clerk/nextjs";
import BackgroundAnimation from "../components/BackgroundAnimation";
import {} from "sonner";
import { Toaster } from "sonner";


const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FINORA - Finance Portfolio",
  description: "One stop solution for all your finance needs",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={inter.className}
          style={{
            background:
              "linear-gradient(135deg, #0a0a23 0%, #1a0033 50%, #000428 100%)",
            minHeight: "100vh",
            position: "relative",
          }}
        >
          <BackgroundAnimation />
          <Head />
          <main className="min-h-screen relative z-10">{children}</main>
          <Toaster richColors />
          <footer className="py-12 relative z-10">
            <div className="container mx-auto px-4 text-center">
              
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
