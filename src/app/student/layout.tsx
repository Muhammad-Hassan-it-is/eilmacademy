import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Student Portal | Eilm Academy",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudentLayout({ children }: { children: ReactNode }) {
  return children;
}
