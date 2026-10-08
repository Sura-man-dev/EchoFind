"use client";

import { usePathname } from "next/navigation";

const authPages = new Set(["/login", "/register", "/reset-password"]);

export default function MarketingChrome({ children }) {
  const pathname = usePathname();

  if (authPages.has(pathname)) {
    return null;
  }

  return children;
}
