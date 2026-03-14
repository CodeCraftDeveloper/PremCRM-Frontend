import QRCode from "react-qr-code";
import { renderToStaticMarkup } from "react-dom/server";

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const printEventBadge = ({
  attendeeName,
  attendeeEmail,
  eventName,
  tenantName,
  ticketName,
  registrationNumber,
  qrValue,
  quantity,
  accentColor = "#2563eb",
}) => {
  const qrMarkup = renderToStaticMarkup(
    <QRCode value={String(qrValue || registrationNumber || "")} size={144} />,
  );

  const badgeHtml = `
    <html>
      <head>
        <title>Event Badge</title>
        <style>
          :root { color-scheme: light; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #e5eefb;
          }
          .badge {
            width: 380px;
            max-width: 100%;
            margin: 0 auto;
            border-radius: 24px;
            overflow: hidden;
            background: #ffffff;
            border: 1px solid #dbe4f0;
            box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
          }
          .hero {
            padding: 18px 20px 14px;
            color: white;
            background: linear-gradient(135deg, ${escapeHtml(accentColor)} 0%, #0f172a 92%);
          }
          .eyebrow {
            font-size: 11px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            opacity: 0.82;
          }
          .event {
            margin-top: 8px;
            font-size: 22px;
            font-weight: 700;
            line-height: 1.2;
          }
          .body {
            display: grid;
            grid-template-columns: 1fr 156px;
            gap: 16px;
            padding: 18px 20px 20px;
            align-items: start;
          }
          .name {
            font-size: 28px;
            font-weight: 800;
            line-height: 1.05;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .line {
            font-size: 13px;
            color: #334155;
            margin-bottom: 6px;
          }
          .meta {
            margin-top: 12px;
            display: grid;
            gap: 8px;
          }
          .metaRow {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
          }
          .label {
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .value {
            color: #0f172a;
            font-weight: 700;
            text-align: right;
          }
          .qrWrap {
            border: 1px solid #dbe4f0;
            border-radius: 18px;
            padding: 10px;
            background: #f8fafc;
            text-align: center;
          }
          .qrWrap svg {
            display: block;
            width: 100%;
            height: auto;
          }
          .code {
            margin-top: 8px;
            font-size: 10px;
            line-height: 1.4;
            color: #475569;
            word-break: break-all;
            font-family: Consolas, monospace;
          }
          @media print {
            body { background: white; padding: 0; }
            .badge { box-shadow: none; border-radius: 0; border: 0; }
          }
        </style>
      </head>
      <body>
        <div class="badge">
          <div class="hero">
            <div class="eyebrow">${escapeHtml(tenantName || "Event Check-In")}</div>
            <div class="event">${escapeHtml(eventName || "Event Badge")}</div>
          </div>
          <div class="body">
            <div>
              <div class="name">${escapeHtml(attendeeName || "Attendee")}</div>
              <div class="line">${escapeHtml(attendeeEmail || "")}</div>
              <div class="line">Ticket: ${escapeHtml(ticketName || "General Admission")}</div>
              <div class="meta">
                <div class="metaRow">
                  <span class="label">Reg #</span>
                  <span class="value">${escapeHtml(registrationNumber || "-")}</span>
                </div>
                <div class="metaRow">
                  <span class="label">Qty</span>
                  <span class="value">${escapeHtml(quantity || 1)}</span>
                </div>
              </div>
            </div>
            <div class="qrWrap">
              ${qrMarkup}
              <div class="code">${escapeHtml(qrValue || registrationNumber || "-")}</div>
            </div>
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank", "width=520,height=760");
  if (!printWindow) {
    return false;
  }

  printWindow.document.open();
  printWindow.document.write(badgeHtml);
  printWindow.document.close();
  return true;
};
