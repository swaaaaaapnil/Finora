import { Inter } from "next/font/google";
import "./globals.css";
import Head from "../components/Head";
import { ClerkProvider } from "@clerk/nextjs";
import BackgroundAnimation from "../components/BackgroundAnimation";
import { Toaster } from "sonner";
import { FaGithub } from "react-icons/fa";

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
          <footer className="py-8 bg-gray-900 text-white relative z-10">
            <div className="container mx-auto px-4 text-center">
              <p className="text-sm sm:text-base font-light flex justify-center items-center gap-2">
                Developed by{" "}
                <a
                  href="https://github.com/swaaaaaapnil"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors duration-200 underline-offset-4 hover:underline"
                >
                  <FaGithub className="text-white" />
                  <span>Swapnil Shukla</span>
                </a>
              </p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
