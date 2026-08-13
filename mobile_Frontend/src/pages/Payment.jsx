import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { formatCurrency } from "../utils/formatters";
import {
  CreditCard,
  Wallet,
  QrCode,
  IndianRupee,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Loader2,
  ShieldCheck,
} from "lucide-react";

const paymentMethods = [
  { value: "cash", label: "Cash", icon: Wallet, desc: "Pay at delivery" },
  { value: "online", label: "Online", icon: CreditCard, desc: "Card / NetBanking" },
  { value: "upi", label: "UPI", icon: QrCode, desc: "Scan & Pay" },
  { value: "credit", label: "Credit", icon: Building2, desc: "Pay later" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Prevent duplicate submissions / duplicate payments
  const submittingRef = useRef(false);
  const requestIdRef = useRef(null);

  // Get order data from navigation state
  const orderData = location.state || {};
  const isFromCart = orderData.fromCart || false;

  // Payment form state
  const [form, setForm] = useState({
    mobile: orderData.mobile || "",
    shipping_address: orderData.shipping_address || "",
    payment_method: "cash",
    payment_type: "cash",
    gst_type: "without_gst",
    gst_no: "",
    paid_amount: 0,
  });

  useEffect(() => {
    // Redirect if no order data
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      navigate("/cart");
      return;
    }

    // Pre-fill user data if available
    if (user) {
      setForm(prev => ({
        ...prev,
        mobile: prev.mobile || user.phone || "",
        shipping_address: prev.shipping_address || user.address || "",
      }));
    }
  }, [user, orderData, navigate]);

  // Calculate totals
  const subtotal = orderData.subtotal || 0;
  const items = orderData.items || [];
  const gstTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const gstPercent = Number(item.gst_percentage || item.gst || 0);
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      return sum + (price * quantity * gstPercent) / 100;
    }, 0);
  }, [items]);
  const totalWithGst = subtotal + gstTotal;
  const total = orderData.total || totalWithGst;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // Validate mobile number
    const phoneClean = form.mobile.replace(/[^0-9]/g, '');
    if (!form.mobile || phoneClean.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }

    if (!form.shipping_address.trim()) {
      setError("Please enter shipping address");
      return false;
    }

    if (form.gst_type === "with_gst" && !form.gst_no.trim()) {
      setError("Please enter GST number");
      return false;
    }

    if (form.payment_method === "cash") {
      const paidAmount = parseFloat(form.paid_amount) || 0;
      if (paidAmount > 0 && paidAmount > total) {
        setError("Paid amount cannot exceed total amount");
        return false;
      }
      if (paidAmount < 0) {
        setError("Paid amount cannot be negative");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Guard against double-submission (double click / Enter key)
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);

    // Generate a unique request id for idempotency (retries reuse the same id)
    if (!requestIdRef.current) {
      requestIdRef.current =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    if (!validateForm()) {
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    // Calculate paid amount and status
    let paidAmount = 0;
    let paymentStatus = "pending";
    let balanceAmount = totalWithGst;

    if (form.payment_method === "credit") {
      paidAmount = 0;
      paymentStatus = "not_paid";
      balanceAmount = totalWithGst;
    } else {
      paidAmount = parseFloat(form.paid_amount) || totalWithGst;
      if (paidAmount >= totalWithGst) {
        paymentStatus = "paid";
        balanceAmount = 0;
      } else {
        paymentStatus = "partial";
        balanceAmount = totalWithGst - paidAmount;
      }
    }

    // Prepare products for invoice
    const products = items.map(item => ({
      product_id: item.product_id,
      qty: item.quantity,
      price: item.price,
      size: item.size || "",
      gst_percentage: Number(item.gst_percentage || item.gst || 0),
    }));

    const companyId = Number(localStorage.getItem('selected_company_id') || orderData.company_id || 0);

    const payload = {
      user_id: user?.id || 0,
      company_id: companyId || undefined,
      customer_name: orderData.customer_name || user?.name || "Customer",
      mobile: form.mobile.replace(/[^0-9]/g, ''),
      email: orderData.email || user?.email || '',
      shipping_address: form.shipping_address,
      billing_address: form.shipping_address,
      payment_method: form.payment_method,
      paid_amount: paidAmount,
      payment_status: paymentStatus,
      balance_amount: balanceAmount,
      request_id: requestIdRef.current,
      items: products,
      subtotal,
      gst: gstTotal,
      grand_total: totalWithGst,
    };

    console.log("Payment payload:", payload);

    try {
      const response = await api.post('/shop/checkout', payload);
      console.log("Payment response:", response.data);

      if (response.data?.success || response.data?.status) {
        setSuccess(true);
        setSubmitting(false);

        // Clear cart if coming from cart
        if (isFromCart) {
          await clearCart();
        }

        // Navigate to payment success after delay
        setTimeout(() => {
          navigate("/payment-success", {
            state: {
              invoice_no: response.data?.data?.invoice_no || "N/A",
              invoice_id: response.data?.data?.invoice_id,
              payment_id: response.data?.data?.payment_id,
              order_id: response.data?.data?.order_id || 0,
              total_amount: total,
              paid_amount: paidAmount,
              balance_amount: balanceAmount,
              payment_status: paymentStatus,
              customer_name: orderData.customer_name || user?.name,
              customer_phone: form.mobile,
              shipping_address: form.shipping_address,
            }
          });
        }, 1600);
      } else {
        submittingRef.current = false;
        setError(response.data?.message || "Payment failed. Please try again.");
        setSubmitting(false);
      }
    } catch (err) {
      submittingRef.current = false;
      console.error("Payment error:", err);
      if (err.response) {
        setError(err.response.data?.message || "Server error. Please try again.");
      } else if (err.request) {
        setError("No response from server. Please check your connection.");
      } else {
        setError("An error occurred. Please try again.");
      }
      setSubmitting(false);
    }
  };

  // If no order data, show error
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-dashed border-red-200 bg-white p-12 text-center max-w-md"
        >
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-800">No Order Found</h2>
          <p className="text-gray-600 mt-2">Please add items to your cart first.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 px-6 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full font-semibold shadow-lg shadow-[#2563eb]/30 hover:opacity-90 transition"
          >
            Go Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  const selectedMethod = paymentMethods.find((m) => m.value === form.payment_method);

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial="hidden"
          animate="show"
        >
          <motion.div custom={0} variants={fadeUp}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">Payment</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0f172a]">
              Payment Details
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Review your order and choose a payment method.
            </p>
          </motion.div>

          <div className="mt-8 grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
            {/* Payment Form */}
            <motion.div
              custom={1}
              variants={fadeUp}
              className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] p-6 md:p-8"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-200 flex items-start gap-3"
                >
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-4 bg-green-50 text-green-700 rounded-2xl text-sm border border-green-200 flex items-start gap-3"
                >
                  <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>Payment successful! Redirecting...</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Details */}
                <motion.div variants={fadeUp} custom={2}>
                  <h3 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                    <motion.span
                      whileHover={{ rotate: 12 }}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 flex items-center justify-center"
                    >
                      <User size={18} className="text-[#2563eb]" />
                    </motion.span>
                    Customer Details
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
                      <div className="text-sm text-gray-500">Order for</div>
                      <div className="mt-1 font-bold text-lg text-[#0f172a]">{orderData.customer_name || user?.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Mail size={14} />
                        {orderData.email || user?.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0f172a] mb-1.5">
                        <Phone size={16} className="inline mr-1" />
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleChange}
                        disabled={submitting || success}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none disabled:bg-gray-100 transition"
                        placeholder="Enter 10-digit mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#0f172a] mb-1.5">
                        <MapPin size={16} className="inline mr-1" />
                        Shipping Address *
                      </label>
                      <textarea
                        name="shipping_address"
                        value={form.shipping_address}
                        onChange={handleChange}
                        disabled={submitting || success}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none disabled:bg-gray-100 resize-none transition"
                        placeholder="Enter shipping address"
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Payment Method */}
                <motion.div variants={fadeUp} custom={3} className="border-t border-slate-100 pt-6">
                  <h3 className="text-lg font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                    <motion.span
                      whileHover={{ rotate: 12 }}
                      className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 flex items-center justify-center"
                    >
                      <Wallet size={18} className="text-[#2563eb]" />
                    </motion.span>
                    Payment Method
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {paymentMethods.map((method) => {
                      const active = form.payment_method === method.value;
                      return (
                        <motion.button
                          key={method.value}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setForm(prev => ({ ...prev, payment_method: method.value }))}
                          disabled={submitting || success}
                          className={`relative p-3.5 rounded-2xl border-2 text-center transition ${
                            active
                              ? "border-transparent text-white shadow-lg shadow-[#2563eb]/25"
                              : "border-slate-200 bg-white hover:border-[#2563eb]/40"
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {active && (
                            <motion.span
                              layoutId="payment-bg"
                              transition={{ type: "spring", damping: 22, stiffness: 300 }}
                              className="absolute inset-0 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] rounded-2xl -z-0"
                            />
                          )}
                          <motion.div
                            animate={active ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.4 }}
                            className="relative z-10"
                          >
                            <method.icon className={`mx-auto h-6 w-6 mb-1 ${active ? "text-white" : "text-[#2563eb]"}`} />
                            <span className="block text-xs font-semibold">{method.label}</span>
                            <span className={`block text-[10px] mt-0.5 ${active ? "text-white/80" : "text-gray-400"}`}>
                              {method.desc}
                            </span>
                          </motion.div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {form.payment_method === "cash" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4 overflow-hidden"
                    >
                      <label className="block text-sm font-semibold text-[#0f172a] mb-1.5">
                        Paid Amount (optional)
                      </label>
                      <input
                        type="number"
                        name="paid_amount"
                        value={form.paid_amount}
                        onChange={handleChange}
                        disabled={submitting || success}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none disabled:bg-gray-100 transition"
                        placeholder="Amount paid (defaults to full total)"
                      />
                    </motion.div>
                  )}
                </motion.div>

                {/* Submit Button */}
                <motion.button
                  variants={fadeUp}
                  custom={4}
                  type="submit"
                  disabled={submitting || success}
                  className="w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white py-3.5 rounded-2xl hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-bold shadow-lg shadow-[#2563eb]/30 active:scale-95"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-white" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <IndianRupee size={20} />
                      Pay {formatCurrency(total)}
                    </>
                  )}
                </motion.button>

                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                  <ShieldCheck size={14} />
                  Secured with idempotent transaction handling
                </p>
              </form>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              custom={2}
              variants={fadeUp}
              className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] p-6 h-fit sticky top-28"
            >
              <h2 className="text-xl font-extrabold tracking-tight text-[#0f172a] mb-4">Order Summary</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST</span>
                  <span className="font-semibold">{formatCurrency(gstTotal)}</span>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-[#0f172a]"
                >
                  <span>Total</span>
                  <span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">{formatCurrency(totalWithGst)}</span>
                </motion.div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-[#0f172a] mb-2">Items</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.06 }}
                      className="flex justify-between text-sm py-1 border-b border-slate-50 gap-3"
                    >
                      <span className="text-gray-600 min-w-0 break-words">
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-semibold whitespace-nowrap shrink-0 text-[#0f172a]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {user && (
                <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-gray-500">
                  <p className="flex items-center gap-1">✓ Order will be linked to your account</p>
                  <p className="mt-1">You can view your orders in your profile</p>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Processing / Success overlay */}
      <AnimatePresence>
        {(submitting || success) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 260 }}
              className="bg-white rounded-3xl max-w-sm w-full p-10 text-center shadow-2xl relative"
            >
              {success ? (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30"
                  >
                    <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="absolute inset-0 rounded-full border-4 border-emerald-300/40 pointer-events-none"
                  />
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-2xl font-extrabold text-[#0f172a]"
                  >
                    Payment Successful!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="mt-2 text-sm text-gray-500"
                  >
                    Redirecting to confirmation...
                  </motion.p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-[#2563eb]/20 border-t-[#2563eb] mx-auto"
                  />
                  <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-xl font-extrabold text-[#0f172a]"
                  >
                    Processing Payment
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6 }}
                    className="mt-2 text-sm text-gray-500"
                  >
                    {selectedMethod?.label} — please wait...
                  </motion.p>
                  <div className="mt-5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                      className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed]"
                    />
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
