"use client";

import { useState, useEffect } from "react";
import { Menu, X, LogIn } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NAV_LINKS, SCHOOL_NAME, LOGO_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`glass-nav ${scrolled ? "py-2 shadow-xl" : "py-4"}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <a href="#home" className="flex items-center gap-2 group">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
            <Image src={LOGO_URL} alt={SCHOOL_NAME} width={40} height={40} className="object-contain" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-800">
            {SCHOOL_NAME}
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="font-medium text-slate-600 hover:text-brand-600 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/admin"
            className="flex items-center gap-2 text-slate-600 hover:text-brand-600 font-medium transition-colors"
          >
            <LogIn size={18} />
            <span>Admin</span>
          </a>
          <a
            href="#contact"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-brand-600 hover:bg-brand-700 rounded-full px-6"
            )}
          >
            Apply Now
          </a>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "lg:hidden text-brand-600"
            )}
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <div className="flex flex-col gap-4 pt-8 px-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-slate-700 hover:text-brand-600 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/admin"
                className="text-lg font-medium text-slate-700 flex items-center gap-2 hover:text-brand-600 transition-colors"
                onClick={() => setOpen(false)}
              >
                <LogIn size={18} />
                Admin Login
              </a>
              <a
                href="#contact"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-brand-600 hover:bg-brand-700 mt-2"
                )}
                onClick={() => setOpen(false)}
              >
                Apply Now
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
