import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Ultra } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Capitol View",
  description: "Capitol View is an app that allows users to explore Federal lawmakers and bills, and track the progress of bills through the legislative process. Developed by Daniel Brainich."
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
        <body className={`${inter.className} bg-slate-50`}>
          <header>
            <Navbar />
          </header>
          <main className="min-h-screen flex flex-col bg-slate-50 overflow-hidden">
            <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-24">
              <div className="flex flex-col justify-center divide-y divide-slate-200 [&>*]:py-16">
                <div className="w-full max-w-3xl mx-auto">
                  <div className="-my-6">
                    {children}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </body>
      </html>
  );
}
