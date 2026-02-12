"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function ConditionalHeader() {
  const pathname = usePathname();

  // Don't show header on homepage
  if (pathname === "/") {
    return null;
  }

  return <Header />;
}
