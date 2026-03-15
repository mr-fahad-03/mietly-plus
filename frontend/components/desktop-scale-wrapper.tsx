"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function DesktopScaleWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return <div className={isAdminRoute ? "" : "desktop-scale-80"}>{children}</div>;
}
