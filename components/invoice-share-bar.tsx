"use client";

import { useState } from "react";
import { btnPrimaryCls, btnSecondaryCls } from "@/components/ui";

/**
 * Download + Share controls for a completed invoice (§7.4).
 *
 * - Download exports the invoice as a PDF via the browser's own print-to-PDF
 *   ("Save as PDF"), the same pipeline used everywhere else — crisp vector
 *   output that shapes the Urdu Nastaleeq tagline correctly (§8.1).
 * - Share uses the Web Share API when present (mobile opens the native share
 *   sheet; WhatsApp is one target) and falls back to a wa.me deep link on
 *   desktop. Either way the message text is pre-filled and the owner attaches
 *   the just-downloaded PDF manually before sending — no message ever leaves
 *   without the owner tapping send inside WhatsApp (no Meta API, no automation).
 *
 * WhatsApp is only offered when a phone number is known: Customer.phone for
 * wholesale, or a number entered on the sale screen for retail walk-ins.
 */
export function InvoiceShareBar({
  invoiceNumber,
  phone,
  shareText,
}: {
  invoiceNumber: string;
  phone: string | null; // already normalised to international digits, or null
  shareText: string;
}) {
  const [note, setNote] = useState<string | null>(null);

  const text = `${shareText} (${invoiceNumber})`;

  function download() {
    setNote("Save the PDF from the print dialog, then attach it in WhatsApp.");
    window.print();
  }

  async function share() {
    // Feature-detect the Web Share API rather than guessing by device type.
    const nav = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (typeof nav.share === "function") {
      try {
        await nav.share({ title: `Invoice ${invoiceNumber}`, text });
        setNote("Attach the downloaded PDF in the chat, then send.");
        return;
      } catch {
        // user cancelled or share failed — fall through to wa.me
      }
    }
    // Desktop fallback: open WhatsApp with the text pre-filled; the owner drags
    // in the downloaded PDF manually (wa.me links cannot attach a file).
    const base = phone ? `https://wa.me/${phone}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    setNote("WhatsApp opened with the message. Attach the downloaded PDF, then send.");
  }

  return (
    <div className="flex flex-col items-end gap-2 print:hidden">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={download} className={btnSecondaryCls}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
          Download PDF
        </button>
        <button
          type="button"
          onClick={share}
          className={btnPrimaryCls}
          title={phone ? "Share this invoice on WhatsApp" : "No phone on file — opens the share sheet / WhatsApp without a preset contact"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.02h-.003a8.23 8.23 0 0 1-4.19-1.15l-.3-.18-3.11.82.83-3.03-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.97-.14.16-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43l-.48-.01c-.16 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.57.12.16 1.75 2.67 4.25 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
          </svg>
          Share on WhatsApp
        </button>
      </div>
      {note && <p className="max-w-xs text-right text-xs text-slate-500 dark:text-slate-400">{note}</p>}
    </div>
  );
}
