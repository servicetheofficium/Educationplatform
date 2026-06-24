import { MapPin, Phone, Clock } from "lucide-react";
import Image from "next/image";
import { CONTACT_INFO } from "@/lib/constants";
import { ApplicationForm } from "@/components/application-form";

export function ContactSection() {
  return (
    <section id="contact" className="py-24 px-6 bg-slate-900 text-white">
<div className="container mx-auto max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-20">
          <div className="lg:w-5/12">
            <span className="text-brand-400 font-bold uppercase text-sm tracking-widest block mb-4">
              Contact Us
            </span>
            <h2 className="text-4xl font-display font-bold mb-8 leading-tight">
              Start your journey today
            </h2>
            <p className="text-slate-400 mb-12 text-lg">
              Have questions about our curriculum or visa processing? Our
              friendly admissions team is here to help you get started.
            </p>

            <div className="space-y-8">
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-brand-400 shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg mb-1">Our Location</p>
                  <p className="text-slate-400">{CONTACT_INFO.address}</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-brand-400 shrink-0">
                  <Phone size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg mb-1">Phone Number</p>
                  <p className="text-slate-400">{CONTACT_INFO.phone}</p>
                </div>
              </div>
              <div className="flex gap-5">
                <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-brand-400 shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <p className="font-bold text-lg mb-1">Opening Hours</p>
                  <p className="text-slate-400">{CONTACT_INFO.hours}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-bold text-lg">LINE Official</p>
                <Image
                  src="/school-qr.png"
                  alt="LINE QR Code"
                  width={160}
                  height={160}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="lg:w-7/12">
            <ApplicationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
