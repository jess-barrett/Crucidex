"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProfileNavBarProps {
  username: string;
}

const TABS = [
  { label: "Profile", path: "" },
  { label: "Library", path: "/library" },
  { label: "Activity", path: "/activity" },
  { label: "Friends", path: "/friends" },
  { label: "Reviews", path: "/reviews" },
  { label: "Wishlist", path: "/wishlist" },
];

export default function ProfileNavBar({ username }: ProfileNavBarProps) {
  const pathname = usePathname();
  const base = `/u/${username}`;

  function isActive(tabPath: string) {
    if (tabPath === "") {
      // "Profile" tab is active for /u/username/profile
      return pathname === `${base}/profile`;
    }
    return pathname === `${base}${tabPath}`;
  }

  function getHref(tabPath: string) {
    if (tabPath === "") return `${base}/profile`;
    return `${base}${tabPath}`;
  }

  return (
    <nav className="border border-gray-700 rounded-lg">
      <div className="flex">
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          return (
            <Link
              key={tab.label}
              href={getHref(tab.path)}
              className={`flex-1 text-center py-3 text-sm font-medium transition-colors relative ${
                active
                  ? "text-[#b8253d]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-[12.5%] right-[12.5%] h-[2px] bg-[#b8253d]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
