"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import type { Receipt } from "@/lib/types";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function receiptDateStr(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mn}`;
}

export default function ReceiptPrintPage() {
  const params = useParams();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("receipts")
      .select("*")
      .eq("id", params.id as string)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setReceipt(data as Receipt);
      });
  }, [params.id]);

  if (notFound) {
    return (
      <div style={{ textAlign: "center", padding: 40, fontFamily: "Arial, sans-serif" }}>
        <p>Receipt not found.</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div style={{ textAlign: "center", padding: 40, fontFamily: "Arial, sans-serif" }}>
        <p>Loading…</p>
      </div>
    );
  }

  const change = Math.max(0, receipt.change_amount);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f5f5; }

        .receipt-page {
          width: 80mm;
          margin: 0 auto;
          background: white;
          color: black;
          font-family: Arial, sans-serif;
        }

        .receipt {
          width: 80mm;
          padding: 6mm 4mm;
          box-sizing: border-box;
          font-size: 12px;
        }

        .center { text-align: center; }

        h1 { font-size: 24px; margin: 0 0 4px; }
        h3 { margin: 8px 0 6px; font-size: 14px; }
        p  { margin: 3px 0; }

        .line {
          border-top: 1px dashed black;
          margin: 10px 0;
        }

        .info-row, .item-row, .table-head, .total-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin: 5px 0;
        }

        .info-row span:first-child { width: 34mm; }
        .info-row span:last-child  { flex: 1; text-align: left; }

        .item-row span:last-child,
        .table-head strong:last-child,
        .total-row strong:last-child { text-align: right; }

        .total-row { font-size: 15px; }

        .print-button {
          display: block;
          margin: 12px auto 0;
          width: 80mm;
          padding: 12px;
          background: black;
          color: white;
          font-size: 14px;
          font-weight: bold;
          border: none;
          cursor: pointer;
        }

        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { width: 80mm; margin: 0; padding: 0; background: white; }
          .receipt-page { width: 80mm; margin: 0; }
          .print-button { display: none; }
          img { -webkit-print-color-adjust: exact; print-color-adjust: exact; image-rendering: high-quality; }
        }
      `}</style>

      <button
        className="print-button"
        style={{ position: "fixed", top: 16, left: 16, width: "auto", padding: "8px 16px", background: "#444", fontSize: 13 }}
        onClick={() => window.location.href = "/admin/receipts"}
      >
        ← Back
      </button>

      <main className="receipt-page">
        <section className="receipt">
          <div className="center">
            <img src="/school_logo.png" alt="KNC School" style={{ width: 110, height: 110, margin: "0 auto 6px", display: "block", objectFit: "contain" }} />
            <h1>KNC School</h1>
            <p>Language &amp; Education Center</p>
            <p>Bangkok, Thailand</p>
            <p>Tel: 020339299</p>
          </div>

          <div className="line" />

          <div className="info-row"><span>Receipt No</span><span>{receipt.receipt_no}</span></div>
          <div className="info-row"><span>Date</span><span>{receiptDateStr(receipt.created_at)}</span></div>
          {receipt.staff_name && (
            <div className="info-row"><span>Staff</span><span>{receipt.staff_name}</span></div>
          )}

          <div className="line" />

          <h3>Student Information</h3>
          <div className="info-row"><span>Name</span><span>{receipt.student_name}</span></div>
          {receipt.phone && (
            <div className="info-row"><span>Phone</span><span>{receipt.phone}</span></div>
          )}
          {receipt.email && (
            <div className="info-row"><span>Email</span><span>{receipt.email}</span></div>
          )}
          <div className="info-row"><span>Course</span><span>{receipt.course_name}</span></div>

          <div className="line" />

          <div className="table-head">
            <strong>Item</strong>
            <strong>Amount</strong>
          </div>

          {receipt.items && receipt.items.length > 0 ? (
            receipt.items.map((item, i) => (
              <div key={i} className="item-row">
                <span>{item.name}</span>
                <span>{fmt(item.amount)}</span>
              </div>
            ))
          ) : (
            <>
              <div className="item-row">
                <span>{receipt.course_name}</span>
                <span>{fmt(receipt.course_fee)}</span>
              </div>
              {receipt.visa_fee > 0 && (
                <div className="item-row">
                  <span>Visa Fee</span>
                  <span>{fmt(receipt.visa_fee)}</span>
                </div>
              )}
            </>
          )}

          <div className="line" />

          <div className="total-row">
            <strong>TOTAL</strong>
            <strong>{fmt(receipt.total_amount)} THB</strong>
          </div>

          <div className="line" />

          <div className="info-row"><span>Payment Method</span><span>{receipt.payment_method}</span></div>
          <div className="info-row"><span>Paid Amount</span><span>{fmt(receipt.paid_amount)}</span></div>
          <div className="info-row"><span>Change</span><span>{fmt(change)}</span></div>
          {receipt.remaining_amount > 0 && (
            <div className="info-row"><span>Remaining Amount</span><span>{fmt(receipt.remaining_amount)}</span></div>
          )}
          {receipt.next_payment_date && (
            <div className="info-row"><span>Next Payment Date</span><span>{new Date(receipt.next_payment_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
          )}

          <div className="line" />

          <div className="center">
            <h3>Thank you!</h3>
            <p>Please keep this receipt.</p>
            <p>UNTIL <b>YOU COMPLETE</b> YOUR COURSE.</p>
            <p>Email: knclanguageschool@gmail.com</p>

          </div>

          <div className="line" />

          <p style={{ fontSize: 9, lineHeight: 1.45, color: "#000", marginBottom: 6 }}>
            All payments are non-refundable under any circumstances. Visa and Immigration fees are not included. Visa approval, visa extension, and change of visa status are solely at the discretion of the Thai Immigration Bureau. The School does not guarantee any visa approval or extension. Payment confirms that the student has read and accepted the School&apos;s Terms and Conditions. The student consents to the School collecting, using, storing, and disclosing personal data as necessary for enrollment, educational services, visa processing, communication, legal compliance, and other purposes in accordance with the School&apos;s Privacy Policy and applicable data protection laws.
          </p>
          <p style={{ fontSize: 9, lineHeight: 1.45, color: "#000" }}>
            The student acknowledges and consents to the collection, use, storage, and disclosure of personal data by the School solely for educational administration, visa and immigration procedures, legal compliance, and communication with relevant government authorities, in accordance with the School&apos;s Privacy Policy and the Personal Data Protection Act (PDPA) of Thailand.
          </p>

          <div className="line" />

          <div className="center">
            <p>--- We wish you a great day! ---</p>
          </div>
        </section>

        <button className="print-button" onClick={() => window.print()}>
          Print Receipt
        </button>
      </main>
    </>
  );
}
