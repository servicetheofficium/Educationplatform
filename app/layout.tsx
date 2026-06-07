import type { Metadata } from "next";
import "./globals.css";
import { SCHOOL_NAME } from "@/lib/constants";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: `${SCHOOL_NAME} — Language Education`,
  description:
    "Master English and Thai with expert instructors. Student visa support included.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} data-scroll-behavior="smooth">
      <body><TooltipProvider>{children}</TooltipProvider><Analytics /></body>
    </html>
  );
}
