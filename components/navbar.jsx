import Link from "next/link";
import { Search, Info } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function Navbar() {
  return (
    <nav className="bg-[#DA391A]">
      <div className="mx-auto w-full max-w-4xl flex items-center justify-between px-4 py-4">
        {/* Logo + App Name */}
        <div className="flex items-center space-x-3">

          <Link
            href="/"
            className={`${inter.className} text-lg text-blue-700 tracking-tight hover:text-blue-800 transition translate-y-[1px]`}
            >
          <img
            src="/article-one-logo.png"
            alt="Article one app logo"
            className="w-[150px]"
          />          </Link>
        </div>

        {/* Icons */}
        <div className={`flex items-center space-x-6 ${inter.className}`}>
          <Link href="/search" aria-label="Search">
            <Search className="w-5 h-5 text-slate-700 hover:text-blue-700 transition" />
          </Link>

          <Link href="/about" aria-label="About or Info">
            <Info className="w-5 h-5 text-slate-700 hover:text-blue-700 transition" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
