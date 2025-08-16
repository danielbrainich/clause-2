import "./globals.css";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import TopNav from "@/components/TopNav";
import SearchDialog from "@/components/search/SearchDialog";
import SearchProvider from "@/components/search/SearchProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Article One",
  description: "Legislative tracking",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}>
        <ThemeProvider>
          <SearchProvider>
            <TopNav />
            <SearchDialog /> {/* mounted once */}
            {children}
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
