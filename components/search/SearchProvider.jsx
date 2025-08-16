"use client";

import { createContext, useCallback, useContext, useState } from "react";

const SearchCtx = createContext(null);

function SearchProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openDialog = useCallback(() => setOpen(true), []);
  const closeDialog = useCallback(() => setOpen(false), []);
  return (
    <SearchCtx.Provider value={{ open, openDialog, closeDialog }}>
      {children}
    </SearchCtx.Provider>
  );
}

function useSearch() {
  const ctx = useContext(SearchCtx);
  if (!ctx) throw new Error("useSearch must be used within <SearchProvider>");
  return ctx;
}

export default SearchProvider;
export { SearchProvider, useSearch };
