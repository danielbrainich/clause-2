import { Inter } from "next/font/google";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar";

const inter = Inter({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: "400" });

export const metadata = {
  title: "Capitol View",
  description:
    "Capitol View is an app that allows users to explore Federal lawmakers and bills, and track the progress of bills through the legislative process. Developed by Daniel Brainich.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.className} bg-slate-50 text-gray-900 dark:bg-slate-900 dark:text-white`}
      >
        <header className="border-b border-slate-200 dark:border-slate-700">
          <Navbar />
        </header>

        <main className="min-h-screen flex flex-col">
          <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-16 sm:py-24">
            <div className="flex flex-col justify-center space-y-16">
              <div className="w-full max-w-3xl mx-auto">
                <div className={playfair.className}>{children}</div>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
