import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DuesPayment, DuesSummary, User } from "@/lib/models";
import { DUES_PLAN_LABELS } from "@/lib/dues";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
// Built-in PDF fonts use WinAnsi. Transliterate accented names consistently.
const printable = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7e]/g, "?");
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const char of printable(text)) {
    if (font.widthOfTextAtSize(line + char, size) > width && line) { lines.push(line.trimEnd()); line = ""; }
    line += char;
  }
  if (line) lines.push(line.trimEnd());
  return lines.length ? lines : [""];
}

export async function buildDuesHistoryPdf(user: Pick<User, "displayName" | "membershipId" | "email">, records: DuesPayment[], summary: DuesSummary) {
  const pdf = await PDFDocument.create();
  pdf.setTitle("Eko Club Philadelphia - Dues Payment History");
  pdf.setAuthor("Eko Club Philadelphia");
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const green = rgb(0.03, 0.42, 0.28), ink = rgb(0.12, 0.15, 0.18), muted = rgb(0.38, 0.42, 0.45);
  let page!: PDFPage;
  let y = 0;
  const columns = [40, 194, 255, 355, 425];
  const widths = [142, 49, 88, 58, 122];
  function text(value: string, x: number, top: number, size = 9, heavy = false) {
    page.drawText(printable(value), { x, y: top, size, font: heavy ? bold : regular, color: ink });
  }
  function newPage(first = false) {
    page = pdf.addPage([595.28, 841.89]);
    page.drawRectangle({ x: 0, y: 821.89, width: 595.28, height: 20, color: green });
    text("EKO CLUB PHILADELPHIA", 40, 788, 11, true);
    text("Dues payment history", 40, 757, 22, true);
    y = 731;
    if (first) {
      for (const line of wrap(user.displayName, bold, 11, 515)) { text(line, 40, y, 11, true); y -= 16; }
      for (const line of wrap(`${user.membershipId ?? "Membership number not assigned"} | ${user.email}`, regular, 9, 515)) { text(line, 40, y); y -= 14; }
      y -= 7;
      text(`As of ${summary.asOf} (Philadelphia) | Schedule: ${DUES_PLAN_LABELS[summary.frequency]}`, 40, y); y -= 18;
      text(`Confirmed paid: ${money(summary.totalPaidCents)}   Outstanding: ${money(summary.outstandingCents)}`, 40, y, 10, true); y -= 17;
      text(`Paid through: ${summary.paidThrough ?? "No confirmed coverage"} | Next unpaid due: ${summary.nextPaymentDue}`, 40, y); y -= 17;
      text(`Standing: ${summary.status === "at-risk" ? "At risk of suspension" : summary.status === "owing" ? "Payment due" : "Up to date"}`, 40, y); y -= 17;
      if (summary.overdueMonths.length) {
        const months = summary.overdueMonths.slice(0, 12).join(", ") + (summary.overdueMonths.length > 12 ? ` (+${summary.overdueMonths.length - 12} more; see member portal)` : "");
        for (const line of wrap(`Unpaid months: ${months}`, regular, 9, 515)) {
          text(line, 40, y); y -= 13;
        }
      }
      y -= 10;
    }
    page.drawRectangle({ x: 40, y: y - 7, width: 515, height: 25, color: rgb(0.93, 0.96, 0.94) });
    ["Coverage", "USD", "Status", "Paid on", "Method / reference"].forEach((label, i) => text(label, columns[i], y + 2, 9, true));
    y -= 29;
  }
  newPage(true);
  if (!records.length) { text("No payments have been recorded.", 40, y); y -= 25; }
  for (const payment of records) {
    const cells = [
      payment.coverageStart && payment.coverageEnd ? `${payment.coverageStart} to ${payment.coverageEnd}` : `${payment.year} annual dues`,
      payment.amount.toFixed(2),
      payment.status === "pending" ? payment.submittedAt ? "Awaiting confirmation" : "Not paid" : payment.status,
      payment.paidDate?.slice(0, 10) ?? "Unpaid",
      `${payment.paymentMethod ?? "Not selected"} / ${payment.reference ?? payment.id}`,
    ].map((value, i) => wrap(value, regular, 9, widths[i]));
    const height = Math.max(...cells.map(lines => lines.length)) * 13 + 18;
    if (y - height < 95) newPage();
    cells.forEach((lines, col) => lines.forEach((line, row) => text(line, columns[col], y - row * 13)));
    y -= height;
    page.drawLine({ start: { x: 40, y: y + 8 }, end: { x: 555, y: y + 8 }, thickness: 0.5, color: rgb(0.86, 0.88, 0.87) });
  }
  if (y < 130) newPage();
  for (const line of wrap("Only paid records count toward the confirmed total. Waivers cover their stated periods without a cash payment. Pending transfers do not clear arrears. This statement is not a receipt for pending payments.", regular, 9, 515)) {
    text(line, 40, y - 10); y -= 13;
  }
  pdf.getPages().forEach((p, i, pages) => {
    p.drawText(`Private member statement | ${summary.asOf} | Page ${i + 1} of ${pages.length}`, { x: 40, y: 42, font: regular, size: 8, color: muted });
  });
  return pdf.save();
}
