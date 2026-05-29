import { Globe } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NAV_LINKS, SCHOOL_NAME, LOGO_URL, CONTACT_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="#home" className="flex items-center gap-2 mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 overflow-hidden">
                <Image src={LOGO_URL} alt={SCHOOL_NAME} width={40} height={40} className="object-contain" />
              </div>
              <span className="font-display font-bold text-2xl text-white">
                {SCHOOL_NAME}
              </span>
            </Link>
            <p className="max-w-sm mb-6 leading-relaxed">
              Empowering international students through language and cultural
              immersion since 2026. Join our global community in the heart of
              Bangkok.
            </p>
            <div className="flex gap-4">
              {CONTACT_INFO.socials.map((s) => (
                <Link
                  key={s.platform}
                  href={s.url}
                  className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-brand-600 hover:text-white transition-all"
                >
                  <span className="sr-only">{s.platform}</span>
                  <Globe size={18} />
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {NAV_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className={cn(
                      buttonVariants({ variant: "link" }),
                      "text-slate-400 hover:text-brand-400 p-0 h-auto no-underline hover:no-underline"
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="#"
                  className={cn(
                    buttonVariants({ variant: "link" }),
                    "text-slate-400 hover:text-brand-400 p-0 h-auto no-underline hover:no-underline"
                  )}
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Course Hours</h4>
            <ul className="space-y-4 text-sm">
              <li>
                <span className="text-white">Morning Shift:</span> 09:00 - 12:00
              </li>
              <li>
                <span className="text-white">Afternoon Shift:</span> 13:00 - 16:00
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} {SCHOOL_NAME}. All rights reserved.</p>
          <p>Designed for Excellence in Education</p>
        </div>
      </div>
    </footer>
  );
}
