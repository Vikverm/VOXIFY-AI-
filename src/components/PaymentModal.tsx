import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Download,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Clock,
  Zap,
  Check,
  Building,
  ExternalLink,
  Mail,
  Info,
  Wallet,
  QrCode,
  Smartphone,
  Copy,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { downloadInvoicePdf } from "../utils/invoicePdf";

export interface CheckoutItem {
  type: "plan" | "credits";
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  interval?: "monthly" | "annual";
  creditsAmount: number;
  description: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CheckoutItem | null;
  onPaymentSuccess: (item: CheckoutItem) => void;
}

type CheckoutGateway = "upi" | "paypal" | "sandbox";

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  item,
  onPaymentSuccess,
}) => {
  // Default to UPI for instant Indian mobile payment readiness
  const [gateway, setGateway] = useState<CheckoutGateway>("upi");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cardName, setCardName] = useState("Alex Johnson");

  // UPI Specific state
  const [upiUtr, setUpiUtr] = useState("");
  const [upiSenderId, setUpiSenderId] = useState("");
  const [copiedUpiId, setCopiedUpiId] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isVerifyingUpi, setIsVerifyingUpi] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [paymentConfig, setPaymentConfig] = useState<{
    hasPaypal: boolean;
    hasRazorpay: boolean;
    paypalClientId?: string;
    upiVpa: string;
    upiPayeeName: string;
    usdToInrRate: number;
    supportEmail: string;
  }>({
    hasPaypal: false,
    hasRazorpay: false,
    upiVpa: "9711040665@ptsbi",
    upiPayeeName: "Vikas Verma",
    usdToInrRate: 86.5,
    supportEmail: "vikasverm48472@gmail.com",
  });

  const [orderComplete, setOrderComplete] = useState(false);
  const [invoiceId, setInvoiceId] = useState("");
  const [receiptDate, setReceiptDate] = useState("");
  const [completedGateway, setCompletedGateway] = useState<CheckoutGateway>("upi");

  // Calculate INR equivalent
  const amountInr = item ? Math.round(item.price * paymentConfig.usdToInrRate) : 0;
  const upiDeepLink = item
    ? `upi://pay?pa=${paymentConfig.upiVpa}&pn=${encodeURIComponent(
        paymentConfig.upiPayeeName
      )}&am=${amountInr}&cu=INR&tn=${encodeURIComponent(`Voxify ${item.name}`)}`
    : "";

  useEffect(() => {
    if (isOpen) {
      fetch("/api/payment/config")
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setPaymentConfig({
              hasPaypal: Boolean(data.hasPaypal),
              hasRazorpay: Boolean(data.hasRazorpay),
              paypalClientId: data.paypalClientId,
              upiVpa: data.upiVpa || "9711040665@ptsbi",
              upiPayeeName: data.upiPayeeName || "Vikas Verma",
              usdToInrRate: Number(data.usdToInrRate) || 86.5,
              supportEmail: data.supportEmail || "vikasverm48472@gmail.com",
            });
          }
        })
        .catch((err) => {
          console.warn("Could not check payment config:", err);
        });
    }
  }, [isOpen]);

  // Generate UPI QR Code image
  useEffect(() => {
    if (item && upiDeepLink) {
      QRCode.toDataURL(upiDeepLink, {
        width: 240,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error("QR Code generation error:", err));
    }
  }, [item, upiDeepLink]);

  if (!isOpen || !item) return null;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(paymentConfig.upiVpa);
    setCopiedUpiId(true);
    setTimeout(() => setCopiedUpiId(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amountInr.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // 1. UPI Payment Verification
  const handleUpiVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUtr = upiUtr.trim();
    if (!cleanUtr || cleanUtr.length < 6) {
      setErrorMessage("Please enter the 12-digit UPI UTR / Transaction Reference number from your GPay, PhonePe, or Paytm receipt.");
      return;
    }

    setIsVerifyingUpi(true);

    try {
      const response = await fetch("/api/payment/upi/submit-utr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          utr: cleanUtr,
          senderUpiId: upiSenderId.trim(),
          senderEmail: customerEmail.trim(),
          item,
          amountInr,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify UPI payment");
      }

      setIsVerifyingUpi(false);
      setInvoiceId(data.invoiceId || `VM-UPI-${cleanUtr.slice(-6)}`);
      setReceiptDate(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
      setCompletedGateway("upi");
      setOrderComplete(true);

      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#16a34a", "#2563eb", "#9333ea", "#f59e0b"],
        });
      } catch {
        // ignore
      }

      onPaymentSuccess(item);
    } catch (err: any) {
      setIsVerifyingUpi(false);
      setErrorMessage(err?.message || "Verification failed. Please check the UTR number or contact vikasverm48472@gmail.com.");
    }
  };

  // 2. PayPal Smart Button Checkout
  const handlePayPalCheckout = async () => {
    setErrorMessage(null);
    setIsRedirecting(true);

    try {
      const response = await fetch("/api/payment/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: item.type,
          id: item.id,
          name: item.name,
          price: item.price,
          creditsAmount: item.creditsAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "PayPal order creation failed");
      }

      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        throw new Error("PayPal approval link not received from server");
      }
    } catch (err: any) {
      console.error("PayPal Error:", err);
      setErrorMessage(
        err?.message ||
          "PayPal is rarely used in India. Please use the UPI (Google Pay, PhonePe, Paytm) tab above or email vikasverm48472@gmail.com."
      );
      setIsRedirecting(false);
    }
  };

  // 4. Simulated Sandbox Checkout (Zero cost testing)
  const handleSandboxPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const randomId = `VM-INV-${Math.floor(100000 + Math.random() * 900000)}`;
      const now = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      setInvoiceId(randomId);
      setReceiptDate(now);
      setCompletedGateway("sandbox");
      setOrderComplete(true);

      try {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.6 },
          colors: ["#2563eb", "#0070ba", "#10b981", "#ffc439"],
        });
      } catch {
        // ignore
      }

      onPaymentSuccess(item);
    }, 900);
  };

  const handleDownloadInvoice = async () => {
    if (!item) return;
    setIsGeneratingPdf(true);
    try {
      await downloadInvoicePdf({
        invoiceId,
        receiptDate,
        customerName: cardName.trim() || "Customer",
        customerEmail: customerEmail.trim() || undefined,
        paymentGateway: completedGateway,
        upiUtr: upiUtr.trim() || undefined,
        upiSenderId: upiSenderId.trim() || undefined,
        item: {
          id: item.id,
          name: item.name,
          type: item.type,
          description: item.description,
          price: item.price,
          interval: item.interval,
          creditsAmount: item.creditsAmount,
        },
        usdToInrRate: paymentConfig.usdToInrRate,
        supportEmail: paymentConfig.supportEmail,
      });
    } catch (err) {
      console.error("Failed to generate PDF Invoice:", err);
      alert("Invoice PDF generation error. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleFinish = () => {
    setOrderComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-4 sm:my-6"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {orderComplete ? "Order Confirmed & Activated" : "Voxify Checkout"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                UPI &bull; Google Pay &bull; PhonePe &bull; Paytm &bull; PayPal
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={orderComplete ? handleFinish : onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* CONTENT */}
        {!orderComplete ? (
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
            {/* Left: Order Summary (Col 5) */}
            <div className="md:col-span-5 bg-slate-50/80 rounded-xl p-4 border border-slate-200 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  Order Summary
                </span>

                <div className="mt-3 space-y-3">
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                    {item.interval && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold uppercase">
                        Billed {item.interval}
                      </span>
                    )}
                  </div>

                  <div className="rounded-lg bg-white p-3 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Credits Added:</span>
                      <strong className="text-slate-900 font-mono">
                        +{item.creditsAmount.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>USD Price:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    {/* Prominent INR Amount for India */}
                    <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200/80 flex items-center justify-between">
                      <span className="text-emerald-900 font-bold text-xs">
                        India UPI Price:
                      </span>
                      <strong className="text-emerald-800 font-mono text-sm font-black">
                        ₹{amountInr.toLocaleString("en-IN")}
                      </strong>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>Exchange Rate:</span>
                      <span className="font-mono">1 USD &asymp; ₹{paymentConfig.usdToInrRate} INR</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guarantees & Billing Contact */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Instant balance credit activation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>No corporate Stripe setup needed in India</span>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] space-y-0.5">
                  <span className="text-slate-400 block">UPI & Billing Inquiries:</span>
                  <a
                    href="https://wa.me/919711040665"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-600 hover:underline block"
                  >
                    WhatsApp: +91 97110 40665
                  </a>
                  <a
                    href="mailto:vikasverm48472@gmail.com"
                    className="font-medium text-blue-600 hover:underline truncate block"
                  >
                    vikasverm48472@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* Right: Payment Gateway Selection (Col 7) */}
            <div className="md:col-span-7 space-y-4">
              {/* Payment Gateway Tabs */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* UPI Button (India #1) */}
                  <button
                    type="button"
                    onClick={() => {
                      setGateway("upi");
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer relative ${
                      gateway === "upi"
                        ? "border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="absolute -top-1.5 right-2 px-1.5 bg-amber-400 text-slate-950 text-[8px] font-black rounded-full uppercase">
                      India #1
                    </span>
                    <div className="flex items-center gap-1">
                      <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-extrabold text-xs">UPI & QR</span>
                    </div>
                    <span className="text-[9px] text-emerald-700 font-semibold">GPay / PhonePe</span>
                  </button>

                  {/* PayPal Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setGateway("paypal");
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      gateway === "paypal"
                        ? "border-amber-500 bg-amber-50/70 text-amber-950 font-bold ring-2 ring-amber-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-0.5">
                      <span className="font-black italic text-blue-700 text-xs">Pay</span>
                      <span className="font-black italic text-sky-500 text-xs">Pal</span>
                    </div>
                    <span className="text-[9px] text-slate-500">International</span>
                  </button>

                  {/* Sandbox Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setGateway("sandbox");
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      gateway === "sandbox"
                        ? "border-purple-600 bg-purple-50/60 text-purple-950 font-bold ring-2 ring-purple-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      <span className="font-bold text-xs">Sandbox</span>
                    </div>
                    <span className="text-[9px] text-slate-500">Demo Mode</span>
                  </button>
                </div>
              </div>

              {/* 1. UPI INDIA CHECKOUT (Google Pay / PhonePe / Paytm / BHIM) */}
              {gateway === "upi" && (
                <div className="space-y-3.5">
                  {/* Top Indian UPI Brand Badges */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-950">
                          Scan & Pay via any UPI App
                        </span>
                        <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded">
                          0% Transaction Fee
                        </span>
                      </div>
                      <span className="text-xs font-black font-mono text-emerald-700">
                        ₹{amountInr.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {/* App Brand Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-blue-700 shadow-2xs">
                        Google Pay
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-purple-700 shadow-2xs">
                        PhonePe
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-sky-700 shadow-2xs">
                        Paytm
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-emerald-700 shadow-2xs">
                        BHIM UPI
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 font-bold text-slate-700 shadow-2xs">
                        Cred
                      </span>
                    </div>
                  </div>

                  {/* QR Code & Direct Payment Info */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-col sm:flex-row items-center gap-4 shadow-2xs">
                    {/* QR Code Image */}
                    <div className="shrink-0 flex flex-col items-center bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="UPI QR Code (9711040665@ptsbi)"
                          className="h-36 w-36 sm:h-40 sm:w-40 object-contain rounded-lg border border-slate-100"
                        />
                      ) : (
                        <img
                          src="/upi-qr-9711040665.png"
                          alt="UPI QR Code (9711040665@ptsbi)"
                          className="h-36 w-36 sm:h-40 sm:w-40 object-contain rounded-lg border border-slate-100"
                        />
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-bold text-slate-700 text-center">
                          Scan with GPay / PhonePe / Paytm
                        </span>
                      </div>
                      {qrCodeDataUrl && (
                        <a
                          href={qrCodeDataUrl}
                          download={`Voxify-UPI-QR-${amountInr}.png`}
                          className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 mt-1"
                        >
                          <Download className="h-3 w-3" />
                          <span>Save QR to Gallery</span>
                        </a>
                      )}
                    </div>

                    {/* Details & Copy Actions */}
                    <div className="flex-1 space-y-2.5 w-full text-xs">
                      {/* UPI ID Field */}
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Pay to Official UPI ID (VPA):
                        </span>
                        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="font-mono font-bold text-slate-900 text-xs truncate">
                            {paymentConfig.upiVpa}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUpiId}
                            className="px-2 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0 shadow-2xs"
                          >
                            {copiedUpiId ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Payee Name & Amount */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">Recipient Name:</span>
                          <span className="font-semibold text-slate-800 text-[11px] truncate block">
                            {paymentConfig.upiPayeeName}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Amount:</span>
                            <span className="font-bold text-emerald-700 font-mono text-[11px]">
                              ₹{amountInr.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyAmount}
                            className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
                            title="Copy INR Amount"
                          >
                            {copiedAmount ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      </div>

                      {/* Mobile 1-Click Pay Intent Buttons */}
                      <div className="pt-1">
                        <a
                          href={upiDeepLink}
                          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Smartphone className="h-3.5 w-3.5" />
                          <span>Click to Open UPI App on Mobile</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Enter 12-Digit UTR to Activate Immediately */}
                  <form onSubmit={handleUpiVerification} className="space-y-3 rounded-xl border border-blue-200 bg-blue-50/40 p-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950">
                        Step 2: Enter 12-Digit UPI Reference (UTR)
                      </span>
                      <span className="text-[10px] text-slate-500">Found on GPay / PhonePe screen</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          required
                          value={upiUtr}
                          onChange={(e) => setUpiUtr(e.target.value)}
                          placeholder="Enter 12-digit UTR (e.g. 425518294012)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <input
                          type="text"
                          value={upiSenderId}
                          onChange={(e) => setUpiSenderId(e.target.value)}
                          placeholder="Your UPI ID or Mobile (Optional)"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    {errorMessage && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-1.5">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-relaxed">{errorMessage}</span>
                      </div>
                    )}

                    <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        type="submit"
                        disabled={isVerifyingUpi}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isVerifyingUpi ? (
                          <>
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Confirming UPI Payment...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Verify UTR & Activate {item.name} Immediately</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`mailto:${paymentConfig.supportEmail}?subject=${encodeURIComponent(
                          `UPI Payment Confirmation: ${item.name} (₹${amountInr})`
                        )}&body=${encodeURIComponent(
                          `Hi Vikas,\n\nI have paid ₹${amountInr} via UPI for ${item.name}.\n\nUTR: ${upiUtr || "[Enter UTR]"}\nMy Email: ${customerEmail || ""}\n\nPlease confirm and verify.`
                        )}`}
                        title="Send proof to Vikas Verma directly"
                        className="w-full sm:w-auto px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Mail className="h-3.5 w-3.5 text-slate-500" />
                        <span>Email Proof</span>
                      </a>
                    </div>
                  </form>
                </div>
              )}

              {/* 2. PAYPAL SMART BUTTON CHECKOUT */}
              {gateway === "paypal" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-950">PayPal Smart Checkout</span>
                      <span className="text-slate-600">
                        International balance & linked cards
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full">
                      USD ${(item.price).toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={isRedirecting}
                      onClick={handlePayPalCheckout}
                      className="w-full py-3 px-4 rounded-full bg-[#ffc439] hover:bg-[#f4b628] text-[#003087] font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-[#f4b628] disabled:opacity-60 active:scale-[0.99]"
                    >
                      {isRedirecting ? (
                        <div className="h-4 w-4 border-2 border-[#003087] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="font-black italic text-[#003087] text-base">Pay</span>
                          <span className="font-black italic text-[#0079C1] text-base">Pal</span>
                          <span className="text-xs font-semibold text-slate-800 ml-1">
                            Checkout (${item.price.toFixed(2)})
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 text-xs text-amber-950 space-y-2.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Why PayPal Payment Failed</span>
                      </div>
                      
                      {errorMessage.toLowerCase().includes("restricted") ? (
                        <div className="space-y-2 text-[11px] text-amber-900 leading-relaxed">
                          <p className="font-semibold text-amber-950">
                            PayPal Error: <span className="font-mono bg-amber-100/80 px-1 py-0.5 rounded border border-amber-300/80">"The merchant account is restricted."</span>
                          </p>
                          <p>
                            This error comes directly from PayPal. It occurs because the PayPal merchant account associated with your API credentials has pending verification requirements on <a href="https://www.paypal.com" target="_blank" rel="noreferrer" className="text-blue-700 underline font-bold">PayPal.com</a>:
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-amber-950/90">
                            <li><strong>Pending KYC / Identity Verification</strong>: In India, PayPal requires PAN card verification and an Export Purpose Code.</li>
                            <li><strong>Unconfirmed Bank Account</strong>: Bank account verification may be pending approval in your PayPal dashboard.</li>
                            <li><strong>Live vs Sandbox Mode</strong>: If your credentials are for a Sandbox account or unverified personal account, PayPal blocks live checkouts.</li>
                          </ul>
                          <div className="p-2 bg-white/80 rounded-lg border border-amber-200 text-[10px] text-slate-700 space-y-1">
                            <span className="font-bold text-slate-900 block">How to continue right now:</span>
                            <span>• <strong>Use UPI (India #1)</strong>: Scan QR or pay via GPay / PhonePe / Paytm. Activates instantly without PayPal restrictions.</span>
                            <br />
                            <span>• <strong>Use Sandbox (Demo Mode)</strong>: Test character allocation and download the PDF invoice immediately.</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-800 leading-relaxed">{errorMessage}</p>
                      )}

                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setGateway("upi");
                            setErrorMessage(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-emerald-500 cursor-pointer"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          <span>Pay via UPI Instead (GPay / PhonePe / Paytm)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setGateway("sandbox");
                            setErrorMessage(null);
                          }}
                          className="px-3.5 py-2 rounded-xl border border-purple-300 bg-purple-100 text-purple-900 font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-purple-200 cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                          <span>Test in Sandbox & Get PDF Invoice</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 4. SANDBOX TEST MODE */}
              {gateway === "sandbox" && (
                <form onSubmit={handleSandboxPayment} className="space-y-4">
                  <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                      <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                      <span>Sandbox Demo Environment</span>
                    </div>
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      Instant testing mode. Test full character allocation, plan upgrades, and invoice
                      downloads without any real money or gateway API keys.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Test Customer Name
                      </label>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Test Email (For Generated Invoice)
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isProcessing ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Simulating Sandbox Approval...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            Complete Test Activation & Credit Balance
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Order Complete View */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                Payment Confirmed & Verified ({completedGateway === "upi" ? "Indian UPI" : completedGateway === "paypal" ? "PayPal Smart" : "Sandbox Demo"})
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                Your {item.name} is Now Active!
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                We've added <strong className="text-slate-900">+{item.creditsAmount.toLocaleString()} characters</strong> to your
                balance. Commercial license rights are active immediately.
              </p>
            </div>

            {/* Official Receipt Card Preview */}
            <div className="max-w-md mx-auto rounded-2xl bg-slate-50 border border-slate-200/90 p-4 sm:p-5 text-xs space-y-3 text-left shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
                    VX
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Official Tax Invoice</h4>
                    <p className="text-[10px] text-slate-500">Voxify AI Technologies</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-xs text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-2xs">
                  {invoiceId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px]">Date of Issue:</span>
                  <span className="font-medium text-slate-800">{receiptDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Paid:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    ${item.price.toFixed(2)} USD (₹{amountInr.toLocaleString("en-IN")})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Customer:</span>
                  <span className="font-medium text-slate-800 truncate block">
                    {cardName || "Customer"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Payment Mode:</span>
                  <span className="font-semibold text-slate-700 truncate block">
                    {completedGateway === "upi"
                      ? `UPI (${upiUtr ? "UTR: " + upiUtr : "GPay / PhonePe"})`
                      : completedGateway === "paypal"
                      ? "PayPal Smart Checkout"
                      : "Sandbox Test Mode"}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200/80 pt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>Beneficiary: Vikas Verma</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="h-3 w-3" /> Digitally Verified
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={isGeneratingPdf}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-900/20 disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating Professional PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 text-emerald-400" />
                    <span>Download Tax Invoice (PDF)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Return to Studio &rarr;</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              A4 Corporate PDF with itemized breakdown, tax details, digital seal, and verification QR code.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};
