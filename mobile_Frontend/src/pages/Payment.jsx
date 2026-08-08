import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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
  FileText,
  MapPin,
  Phone,
  Mail
} from "lucide-react";


export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useStore();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Prevent duplicate submissions / duplicate payments
  const submittingRef = useRef(false);
  const requestIdRef = useRef(null);

  // Get order data from navigation state
  const orderData = location.state || {};
  const isFromCart = orderData.fromCart || false;
  const isFromProduct = orderData.fromProduct || false;

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
        setInvoiceData(response.data);
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
        }, 1500);
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

  // Payment method options
  const paymentMethods = [
    { value: "cash", label: "Cash", icon: Wallet },
    { value: "online", label: "Online", icon: CreditCard },
    { value: "upi", label: "UPI", icon: QrCode },
    { value: "credit", label: "Credit", icon: Building2 },
  ];

  // If no order data, show error
  if (!orderData || !orderData.items || orderData.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f7f2] pt-28 px-4 md:px-8 lg:px-12 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800">No Order Found</h2>
          <p className="text-gray-600 mt-2">Please add items to your cart first.</p>
          <button 
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-[#a97c50] text-white rounded-md hover:bg-[#8a6540] transition"
          >
            Go Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] pt-28 px-4 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-serif font-bold text-[#181818] mb-8">
          Payment Details
        </h1>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8">
          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-200 flex items-start gap-3">
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md text-sm border border-green-200 flex items-start gap-3">
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                <span>Payment successful! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User size={20} className="text-[#a97c50]" />
                  Customer Details
                </h3>
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                    <div className="text-sm text-gray-500">Order for</div>
                    <div className="mt-1 font-semibold text-lg">{orderData.customer_name || user?.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Mail size={14} />
                      {orderData.email || user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <Phone size={16} className="inline mr-1" />
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      disabled={submitting || success}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#a97c50] focus:border-transparent disabled:bg-gray-100"
                      placeholder="Enter 10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin size={16} className="inline mr-1" />
                      Shipping Address *
                    </label>
                    <textarea
                      name="shipping_address"
                      value={form.shipping_address}
                      onChange={handleChange}
                      disabled={submitting || success}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#a97c50] focus:border-transparent disabled:bg-gray-100 resize-none"
                      placeholder="Enter shipping address"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Wallet size={20} className="text-[#a97c50]" />
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, payment_method: method.value }))}
                      disabled={submitting || success}
                      className={`p-3 border-2 rounded-lg text-center transition ${
                        form.payment_method === method.value
                          ? "border-[#a97c50] bg-[#f8f7f2]"
                          : "border-gray-200 hover:border-gray-300"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <method.icon className="mx-auto h-6 w-6 mb-1" />
                      <span className="text-xs font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>


              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || success}
                className="w-full bg-[#181818] text-white py-3.5 rounded-md hover:bg-[#333] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg font-medium"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <IndianRupee size={20} />
                    Pay {formatCurrency(total)}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 h-fit sticky top-28">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST</span>
                <span className="font-medium">{formatCurrency(gstTotal)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span className="text-[#a97c50]">{formatCurrency(totalWithGst)}</span>
              </div>
            </div>

            <div className="mt-6 border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1 border-b border-gray-50 gap-3">
                    <span className="text-gray-600 min-w-0 break-words">
                      {item.product_name} × {item.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {user && (
              <div className="mt-4 pt-4 border-t text-xs text-gray-500">
                <p className="flex items-center gap-1">✓ Order will be linked to your account</p>
                <p className="mt-1">You can view your orders in your profile</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}