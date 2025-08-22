// components/ThemeProvider.jsx
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      enableSystem={false}
      defaultTheme="light"
      forcedTheme="light"     // <- hard-lock light
      storageKey="cv-theme"   // optional: uses this key, but forcedTheme ignores it anyway
    >
      {children}
    </NextThemesProvider>
  );
}
