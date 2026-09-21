import { jsPDF } from "jspdf";

export interface InvoicePdfData {
  invoiceId: string;
  receiptDate: string;
  customerName: string;
  customerEmail?: string;
  paymentGateway: "upi" | "paypal" | "sandbox" | string;
  upiUtr?: string;
  upiSenderId?: string;
  paypalOrderId?: string;
  item: {
    id: string;
    name: string;
    type: "plan" | "credits";
    description?: string;
    price: number;
    interval?: "monthly" | "annual";
    creditsAmount: number;
  };
  usdToInrRate: number;
  supportEmail?: string;
}

/**
 * Generates and downloads an executive, mathematically aligned A4 Tax Invoice PDF.
 * Enforces unified vertical baselines, non-overlapping columns, dynamic word wrapping,
 * and standard ASCII typography to guarantee zero rendering defects.
 */
export async function downloadInvoicePdf(data: InvoicePdfData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 16;
  const contentWidth = pageWidth - 2 * margin; // 178 mm
  const rightEdge = pageWidth - margin; // 194 mm

  const inrTotal = Math.round(data.item.price * data.usdToInrRate);
  const formattedUsd = `$${data.item.price.toFixed(2)} USD`;
  const formattedInr = `INR ${inrTotal.toLocaleString("en-IN")}`;

  // 1. Top Decorative Brand Accent Bar
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 0, pageWidth, 4, "F");

  // 2. Executive Header (Brand + Document Identity)
  let y = 14;

  // Left: Voxify Emblem & Company Brand
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.roundedRect(margin, y, 11, 11, 2.5, 2.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("VX", margin + 5.5, y + 7.5, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("VOXIFY AI", margin + 14, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("NEURAL SPEECH TECHNOLOGIES & CLOUD AUDIO", margin + 14, y + 9.5);

  // Right: Document Title, Invoice Number & Date
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("TAX INVOICE & RECEIPT", rightEdge, y + 4.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice No: ${data.invoiceId}`, rightEdge, y + 9.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date of Issue: ${data.receiptDate}`, rightEdge, y + 14, { align: "right" });

  // Paid Status Pill Badge
  const badgeWidth = 28;
  const badgeHeight = 5;
  const badgeX = rightEdge - badgeWidth;
  const badgeY = y + 16.5;
  doc.setFillColor(220, 252, 231); // emerald-100
  doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1.2, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(22, 101, 52); // emerald-800
  doc.text("PAID & VERIFIED", badgeX + badgeWidth / 2, badgeY + 3.6, { align: "center" });

  // Top Divider Line
  y = 39;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, rightEdge, y);

  // 3. Billing Parties (Two Equal Columns)
  y = 43;
  const cardGutter = 6;
  const cardWidth = (contentWidth - cardGutter) / 2; // 86 mm
  const cardHeight = 29;

  // Left Card: Billed To (Customer)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("BILLED TO / CUSTOMER", margin + 4, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const displayCustomerName = data.customerName?.trim() || "Valued Customer";
  doc.text(displayCustomerName.slice(0, 34), margin + 4, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const displayCustomerEmail = data.customerEmail?.trim() || "Account Registered User";
  doc.text(`Email: ${displayCustomerEmail.slice(0, 38)}`, margin + 4, y + 16);
  doc.text("License: Commercial Monetization Rights Granted", margin + 4, y + 20.5);
  doc.text("Account Status: Active Verified Subscriber", margin + 4, y + 25);

  // Right Card: Issued By (Beneficiary / Administrator)
  const rightColX = margin + cardWidth + cardGutter;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX, y, cardWidth, cardHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, y, cardWidth, cardHeight, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("ISSUED BY / BENEFICIARY", rightColX + 4, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Voxify AI Technologies", rightColX + 4, y + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("Administrator: Vikas Verma", rightColX + 4, y + 16);
  doc.text(`Official Contact: ${data.supportEmail || "vikasverm48472@gmail.com"}`, rightColX + 4, y + 20.5);
  doc.text("Settlement UPI VPA: 9711040665@ptsbi", rightColX + 4, y + 25);

  // 4. Payment Settlement Strip
  y = 76;
  const settlementHeight = 17;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(margin, y, contentWidth, settlementHeight, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(22, 101, 52);
  doc.text("PAYMENT SETTLEMENT DETAILS", margin + 4, y + 4.8);

  let gatewayLabel = "Sandbox Test Environment (Simulated Verification)";
  if (data.paymentGateway === "upi") {
    gatewayLabel = "Unified Payments Interface (UPI) - GPay / PhonePe / Paytm";
  } else if (data.paymentGateway === "paypal") {
    gatewayLabel = "PayPal Smart Checkout (International)";
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`Mode: ${gatewayLabel}`, margin + 4, y + 9.5);

  const refLabel = data.upiUtr
    ? `UTR / Transaction Ref: ${data.upiUtr}`
    : data.paypalOrderId
    ? `PayPal Order ID: ${data.paypalOrderId}`
    : `Transaction Reference: AUTH-${data.invoiceId}`;
  doc.text(refLabel, margin + 4, y + 13.8);

  // Right side of settlement strip (Right-aligned to rightEdge - 4)
  doc.text(`FX Rate: 1 USD = INR ${data.usdToInrRate}`, rightEdge - 4, y + 9.5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52);
  doc.text("Status: Electronic Payment Captured & Reconciled", rightEdge - 4, y + 13.8, { align: "right" });

  // 5. Itemized Table
  // Layout columns across 178 mm:
  // Col 1: DESCRIPTION  -> Left: margin + 4 (width ~72mm)
  // Col 2: TYPE         -> Left: margin + 78 (width ~26mm)
  // Col 3: CHARACTERS   -> Left: margin + 106 (width ~26mm)
  // Col 4: USD RATE     -> Right: margin + 148 (width ~16mm)
  // Col 5: INR AMOUNT   -> Right: rightEdge - 4 (width ~26mm)
  y = 97;

  // Header Row
  const headerHeight = 7.5;
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, headerHeight, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM & DESCRIPTION", margin + 4, y + 5.2);
  doc.text("TYPE / CYCLE", margin + 78, y + 5.2);
  doc.text("CHARACTERS", margin + 106, y + 5.2);
  doc.text("USD RATE", margin + 148, y + 5.2, { align: "right" });
  doc.text("INR AMOUNT", rightEdge - 4, y + 5.2, { align: "right" });

  // Body Row
  y = 104.5;
  const rowHeight = 21;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, contentWidth, rowHeight, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, rowHeight, "D");

  // UNIFIED VERTICAL BASELINE: All top column items share EXACTLY baseline y + 6.0
  const baselineTop = y + 6.0;
  const baselineSub = y + 10.5;

  // Col 1: Item Name & Description
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(data.item.name, margin + 4, baselineTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const descText =
    data.item.description ||
    "Ultra-realistic neural voices, full SSML studio control, 48kHz audio, and commercial license.";
  const splitDesc = doc.splitTextToSize(descText, 70);
  doc.text(splitDesc, margin + 4, baselineSub);

  // Col 2: Type / Cycle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const cycleLabel =
    data.item.type === "plan"
      ? data.item.interval === "annual"
        ? "ANNUAL PLAN"
        : "MONTHLY PLAN"
      : "CREDIT PACK";
  doc.text(cycleLabel, margin + 78, baselineTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Digital Cloud Access", margin + 78, baselineSub);

  // Col 3: Characters Quota
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129); // emerald-500
  doc.text(`+${data.item.creditsAmount.toLocaleString()}`, margin + 106, baselineTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Chars Credited", margin + 106, baselineSub);

  // Col 4: Price USD (Aligned right at margin + 148)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`$${data.item.price.toFixed(2)}`, margin + 148, baselineTop, { align: "right" });

  // Col 5: Price INR (Aligned right at rightEdge - 4)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text(`INR ${inrTotal.toLocaleString("en-IN")}`, rightEdge - 4, baselineTop, { align: "right" });

  // 6. Balanced 2-Column Section: Compliance & Order Notes (Left) & Financial Totals (Right)
  y = 129.5;
  const colWidth = (contentWidth - cardGutter) / 2; // Exactly 86 mm (matches Billed To & Issued By)
  const leftX = margin; // 16 mm
  const rightX = margin + colWidth + cardGutter; // 108 mm
  const boxHeight = 31;

  // Left Card: Order Confirmation & License Compliance
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftX, y, colWidth, boxHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(leftX, y, colWidth, boxHeight, 2, 2, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("PAYMENT CONFIRMATION & COMPLIANCE", leftX + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text("Status: Verified & Cleared (100% Paid)", leftX + 4, y + 12.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text("Quota Activation: Instant permanent wallet credit", leftX + 4, y + 18);
  doc.text("Commercial License: Full monetization rights granted", leftX + 4, y + 23.5);

  // Right Card: Financial Totals Breakdown (Aligned to exact right column)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, y, colWidth, boxHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightX, y, colWidth, boxHeight, 2, 2, "D");

  const totalsRightEdge = rightX + colWidth - 4;
  const totalsLeftEdge = rightX + 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Subtotal (USD):", totalsLeftEdge, y + 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text(`$${data.item.price.toFixed(2)}`, totalsRightEdge, y + 6, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Digital Taxes (0% Exempt/Export):", totalsLeftEdge, y + 11.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(51, 65, 85);
  doc.text("$0.00", totalsRightEdge, y + 11.5, { align: "right" });

  doc.setDrawColor(226, 232, 240);
  doc.line(totalsLeftEdge, y + 15, totalsRightEdge, y + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Paid (USD):", totalsLeftEdge, y + 20.5);
  doc.text(formattedUsd, totalsRightEdge, y + 20.5, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text("Total Paid (INR):", totalsLeftEdge, y + 26);
  doc.text(formattedInr, totalsRightEdge, y + 26, { align: "right" });

  // 7. Official Seal & Signatory Block
  y = 164.5;
  const sealCardHeight = 26;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, sealCardHeight, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, sealCardHeight, 2, 2, "D");

  // Col A: Official Seal Graphic (Centered at margin + 16, radius 9mm)
  const sealCenterX = margin + 16;
  const sealCenterY = y + 13;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.6);
  doc.circle(sealCenterX, sealCenterY, 9, "D");
  doc.setLineWidth(0.25);
  doc.circle(sealCenterX, sealCenterY, 7.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(5.5);
  doc.setTextColor(16, 185, 129);
  doc.text("OFFICIAL", sealCenterX, sealCenterY - 3.2, { align: "center" });

  doc.setFontSize(6.8);
  doc.setTextColor(5, 150, 105);
  doc.text("VERIFIED", sealCenterX, sealCenterY + 0.6, { align: "center" });

  doc.setFontSize(5.5);
  doc.setTextColor(16, 185, 129);
  doc.text("SECURITY SEAL", sealCenterX, sealCenterY + 4.2, { align: "center" });

  // Col B: Middle Administration Details (Starts at margin + 33, width ~90mm)
  const midColX = margin + 33;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("Voxify AI Accounts Administration", midColX, y + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("Electronic payment cleared and credited into active subscriber quota.", midColX, y + 11.2);
  doc.text("Beneficiary: Vikas Verma • Settlement UPI: 9711040665@ptsbi", midColX, y + 15.5);
  doc.text(`Support Desk: ${data.supportEmail || "vikasverm48472@gmail.com"}`, midColX, y + 19.8);

  // Col C: Authorized Signatory Block (Right-aligned layout)
  const signX = margin + 128;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("Authorized Signatory:", signX, y + 6.5);

  doc.setFont("times", "italic");
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text("Vikas Verma", signX, y + 14.5);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(signX, y + 16.5, rightEdge - 6, y + 16.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text("Founder & Administrator", signX, y + 20.5);

  // 8. Terms of Service & Commercial License (Safely Wrapped)
  y = 195;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text("TERMS OF SERVICE & COMMERCIAL LICENSE:", margin, y);

  const terms: string[] = [
    "Commercial Rights: Full worldwide monetization rights granted for YouTube, Podcasts, Audiobooks, Games, and Advertising.",
  ];

  let termY = y + 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);

  for (const term of terms) {
    const wrappedTerm = doc.splitTextToSize(term, contentWidth);
    doc.text(wrappedTerm, margin, termY);
    termY += wrappedTerm.length * 3.8;
  }

  // 9. Bottom Footer
  y = 212;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, y, rightEdge, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Voxify AI Technologies • Official Electronic Tax Document • Ref: ${data.invoiceId}`,
    margin,
    y + 4.5
  );
  doc.text("Page 1 of 1", rightEdge, y + 4.5, { align: "right" });

  // Download PDF
  doc.save(`${data.invoiceId}.pdf`);
}
