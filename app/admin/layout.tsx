import type { ReactNode } from "react";
import { siteConfig } from "@/lib/siteData";

export const metadata = {
  title: `Admin — ${siteConfig.brandName}`,
  description: "Protected admin console for AI logs and backend review."
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
