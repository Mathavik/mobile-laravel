import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  ChevronRight,
  Check,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { formatCurrency } from "../utils/formatters";
import {
  getAddresses,
  saveAddress,
  deleteAddress,
  formatFullAddress,
} from "../utils/addressBook";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" },
  }),
};

const labelMeta = {
  Home: { icon: Home, color: "text-blue-600 bg-blue-50" },
  Work: { icon: Briefcase, color: "text-violet-600 bg-violet-50" },
  Other: { icon: MapPin, color: "text-emerald-600 bg-emerald-50" },
};

const emptyAddressForm = {
  label: "Home",
  full_name: "",
  mobile: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    email: "",
    mobile: "",
    shipping_address: "",
  });

  const [savedAddresses, setSavedAddresses] = useState(getAddresses);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressError, setAddressError] = useState("");

  // Check if coming from product details (single product)
  const fromProduct = location.state?.fromProduct || false;
  const productData = location.state?.product || null;

  // Check if coming from cart
  const fromCart = location.state?.fromCart || false;

  // Determine items and total
  const { items, subtotal, gstTotal, total } = useMemo(() => {
    if (fromProduct && productData) {
      const items = [{
        product_id: productData.product_id,
        product_name: productData.product_name,
        price: productData.price,
        quantity: productData.quantity || 1,
        gst_percentage: productData.gst_percentage || 0,
        size: productData.size || ""
      }];
      const subtotal = productData.price * (productData.quantity || 1);
      const gstTotal = items.reduce((sum, item) => sum + (item.price * item.quantity * Number(item.gst_percentage || 0)) / 100, 0);
      return { items, subtotal, gstTotal, total: subtotal + gstTotal };
    } else if (fromCart && cartItems.length > 0) {
      const items = cartItems.map(item => ({
        product_id: item.product_id || item.id,
        product_name: item.product_name || item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        size: item.size || "",
        gst_percentage: Number(item.gst_percentage || item.gst || 0)
      }));
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const gstTotal = items.reduce((sum, item) => sum + (item.price * item.quantity * Number(item.gst_percentage || 0)) / 100, 0);
      return { items, subtotal, gstTotal, total: subtotal + gstTotal };
    }
    return { items: [], subtotal: 0, gstTotal: 0, total: 0 };
  }, [fromProduct, productData, fromCart, cartItems]);

  // Pre-fill form data
  useEffect(() => {
    // If coming from product details, use the data passed
    if (fromProduct && location.state) {
      setForm(prev => ({
        ...prev,
        customer_name: location.state.customer_name || prev.customer_name || user?.name || "",
        email: location.state.email || prev.email || user?.email || "",
        mobile: location.state.mobile || prev.mobile || user?.phone || "",
        shipping_address: location.state.shipping_address || prev.shipping_address || user?.address || "",
      }));
      return;
    }

    // If user is logged in, fill with user data
    if (user) {
      setForm(prev => ({
        ...prev,
        customer_name: prev.customer_name || user.name || "",
        email: prev.email || user.email || "",
        mobile: prev.mobile || user.phone || "",
        shipping_address: prev.shipping_address || user.address || "",
      }));
    }
  }, [user, fromProduct, location.state]);

  // Redirect if no items
  useEffect(() => {
    if (!fromProduct && !fromCart) {
      navigate("/cart");
      return;
    }
    if (!fromProduct && fromCart && cartItems.length === 0) {
      navigate("/cart");
    }
    if (fromProduct && !productData) {
      navigate("/");
    }
  }, [fromProduct, fromCart, cartItems, productData, navigate]);

  const selectAddress = (address) => {
    setSelectedAddressId(address.id);
    setForm((prev) => ({
      ...prev,
      customer_name: address.full_name || prev.customer_name,
      mobile: address.mobile || prev.mobile,
      shipping_address: formatFullAddress(address) || prev.shipping_address,
    }));
  };

  const openAddAddressModal = () => {
    setAddressForm({
      ...emptyAddressForm,
      full_name: form.customer_name || user?.name || "",
      mobile: form.mobile || user?.phone || "",
      address: form.shipping_address || user?.address || "",
    });
    setAddressError("");
    setShowAddressModal(true);
  };

  const closeAddressModal = () => {
    setShowAddressModal(false);
    setAddressForm(emptyAddressForm);
    setAddressError("");
  };

  const handleAddressField = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (
      !addressForm.full_name.trim() ||
      !addressForm.mobile.trim() ||
      addressForm.mobile.replace(/[^0-9]/g, "").length !== 10 ||
      !addressForm.address.trim() ||
      !addressForm.city.trim() ||
      !addressForm.state.trim() ||
      !addressForm.pincode.trim()
    ) {
      setAddressError("Please fill all fields with a valid 10-digit mobile number");
      return;
    }

    const saved = saveAddress(addressForm);
    setSavedAddresses(getAddresses());
    selectAddress(saved);
    closeAddressModal();
  };

  const handleDeleteAddress = (id) => {
    deleteAddress(id);
    const remaining = getAddresses();
    setSavedAddresses(remaining);
    if (selectedAddressId === id) {
      setSelectedAddressId(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (!form.customer_name || !form.email || !form.mobile || !form.shipping_address) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const companyId = Number(localStorage.getItem('selected_company_id') || 0);

      navigate('/payment', {
        state: {
          fromCart: fromCart,
          fromProduct: fromProduct,
          items: items,
          subtotal: subtotal,
          gst_total: gstTotal,
          total: total,
          customer_name: form.customer_name,
          email: form.email,
          mobile: form.mobile,
          shipping_address: form.shipping_address,
          user_id: user ? user.id : 0,
          company_id: companyId || undefined,
          order_id: null,
        }
      });
    } catch {
      setError('Unable to proceed to payment');
    } finally {
      setLoading(false);
    }
  };

  // If no items, show loading or redirect
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-md"
        >
          <p className="text-gray-600 font-semibold">No items to checkout.</p>
          <button
            onClick={() => navigate("/")}
            className="mt-5 px-6 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full font-semibold shadow-lg shadow-[#2563eb]/30 hover:opacity-90 transition"
          >
            Continue Shopping
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] pb-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
        {/* Left column */}
        <motion.div
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Address book card */}
          <motion.div
            custom={0}
            variants={fadeUp}
            className="rounded-2xl bg-white p-6 md:p-8 ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">
                  Address Book
                </p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#0f172a]">
                  Delivery Address
                </h2>
              </div>
              <button
                type="button"
                onClick={openAddAddressModal}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-sm font-semibold shadow-lg shadow-[#2563eb]/25 hover:opacity-90 active:scale-95 transition"
              >
                <Plus size={16} />
                Add Address
              </button>
            </div>

            {savedAddresses.length === 0 ? (
              <button
                type="button"
                onClick={openAddAddressModal}
                className="mt-5 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center group hover:border-[#2563eb]/40 hover:bg-[#2563eb]/5 transition"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 flex items-center justify-center mx-auto"
                >
                  <MapPin className="text-[#2563eb] group-hover:scale-110 transition" size={24} />
                </motion.div>
                <p className="mt-3 text-gray-700 font-semibold">No saved address yet</p>
                <p className="mt-1 text-sm text-gray-500">Add a delivery address to speed up checkout</p>
                <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold text-[#2563eb]">
                  Add New Address <ChevronRight size={16} />
                </span>
              </button>
            ) : (
              <div className="mt-5 grid sm:grid-cols-2 gap-3">
                {savedAddresses.map((address) => {
                  const meta = labelMeta[address.label] || labelMeta.Other;
                  const Icon = meta.icon;
                  const isSelected = selectedAddressId === address.id;
                  return (
                    <motion.button
                      key={address.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectAddress(address)}
                      className={`relative rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-[#2563eb] bg-[#2563eb]/5 shadow-lg shadow-[#2563eb]/10"
                          : "border-slate-200 bg-white hover:border-[#2563eb]/40 hover:shadow-md"
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] flex items-center justify-center text-white"
                        >
                          <Check size={14} strokeWidth={3} />
                        </motion.span>
                      )}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
                        <Icon size={13} />
                        {address.label}
                      </span>
                      <p className="mt-2 font-bold text-sm text-[#0f172a]">{address.full_name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{address.mobile}</p>
                      <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                        {formatFullAddress(address)}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(address.id);
                        }}
                        className="absolute bottom-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition"
                        aria-label="Delete address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.button>
                  );
                })}
                <button
                  type="button"
                  onClick={openAddAddressModal}
                  className="min-h-[140px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/40 text-gray-400 hover:text-[#2563eb] hover:border-[#2563eb]/40 hover:bg-[#2563eb]/5 transition flex flex-col items-center justify-center gap-2"
                >
                  <motion.span
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Plus size={22} />
                  </motion.span>
                  <span className="text-sm font-semibold">Add New Address</span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Customer details form */}
          <motion.form
            custom={1}
            variants={fadeUp}
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 md:p-8 ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">
              {fromProduct ? "Confirm Order" : "Checkout"}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[#0f172a]">
              {fromProduct ? "Confirm Order" : "Customer Details"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {fromProduct
                ? "Review your product and proceed to payment."
                : "Review your cart items and proceed to payment."}
            </p>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-200"
              >
                <strong>Error:</strong> {error}
              </motion.div>
            )}

            <div className="mt-5 space-y-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] mb-1.5">
                  <User size={15} className="text-[#2563eb]" />
                  Full Name *
                </label>
                <input
                  required
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                  placeholder="Full Name"
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] mb-1.5">
                  <Mail size={15} className="text-[#2563eb]" />
                  Email *
                </label>
                <input
                  required
                  type="email"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] mb-1.5">
                  <Phone size={15} className="text-[#2563eb]" />
                  Mobile Number *
                </label>
                <input
                  required
                  type="tel"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                  placeholder="Mobile Number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-[#0f172a] mb-1.5">
                  <MapPin size={15} className="text-[#2563eb]" />
                  Shipping Address *
                </label>
                <textarea
                  required
                  className="min-h-24 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                  placeholder="Shipping Address"
                  value={form.shipping_address}
                  onChange={(e) => setForm({ ...form, shipping_address: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-3.5 text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#2563eb]/30 active:scale-95"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Proceed to Payment <ChevronRight size={18} />
                </span>
              )}
            </button>
          </motion.form>
        </motion.div>

        {/* Order summary */}
        <motion.div
          custom={2}
          variants={fadeUp}
          className="rounded-2xl bg-white p-6 ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] h-fit sticky top-28"
        >
          <h2 className="text-xl font-extrabold tracking-tight text-[#0f172a]">Order Summary</h2>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="flex justify-between gap-3"
              >
                <span className="min-w-0 break-words">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="whitespace-nowrap shrink-0 font-medium text-[#0f172a]">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 flex justify-between font-bold text-[#0f172a]">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {gstTotal > 0 && (
            <div className="mt-2 flex justify-between text-sm text-gray-600">
              <span>GST</span>
              <span className="font-medium">{formatCurrency(gstTotal)}</span>
            </div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2 flex justify-between font-bold text-lg text-[#0f172a]"
          >
            <span>Total</span>
            <span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">{formatCurrency(total)}</span>
          </motion.div>

          {user && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-gray-500">
              <p>✓ Order will be linked to your account</p>
              <p className="mt-1">You can view your orders in your profile</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Address Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={closeAddressModal}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-[#0f172a] flex items-center gap-2">
                    <MapPin size={20} className="text-[#2563eb]" />
                    Add New Address
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">Save it for faster checkout next time</p>
                </div>
                <button
                  onClick={closeAddressModal}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAddress} className="px-6 py-5 overflow-y-auto max-h-[calc(92vh-120px)] space-y-4">
                {addressError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-200"
                  >
                    {addressError}
                  </motion.div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Save As</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Home", "Work", "Other"].map((label) => {
                      const meta = labelMeta[label];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setAddressForm((prev) => ({ ...prev, label }))}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition ${
                            addressForm.label === label
                              ? "border-transparent bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white shadow-lg shadow-[#2563eb]/20"
                              : "border-slate-200 text-gray-600 hover:border-[#2563eb]/40"
                          }`}
                        >
                          <Icon size={15} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <input
                    name="full_name"
                    value={addressForm.full_name}
                    onChange={handleAddressField}
                    placeholder="Enter full name"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mobile Number *</label>
                  <input
                    name="mobile"
                    value={addressForm.mobile}
                    onChange={(e) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        mobile: e.target.value.replace(/[^0-9]/g, "").slice(0, 10),
                      }))
                    }
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Address (House No, Street) *</label>
                  <textarea
                    name="address"
                    value={addressForm.address}
                    onChange={handleAddressField}
                    rows={2}
                    placeholder="House no, street, area"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">City *</label>
                    <input
                      name="city"
                      value={addressForm.city}
                      onChange={handleAddressField}
                      placeholder="City"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Pincode *</label>
                    <input
                      name="pincode"
                      value={addressForm.pincode}
                      onChange={(e) =>
                        setAddressForm((prev) => ({
                          ...prev,
                          pincode: e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                        }))
                      }
                      placeholder="Pincode"
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">State *</label>
                  <input
                    name="state"
                    value={addressForm.state}
                    onChange={handleAddressField}
                    placeholder="State"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-3.5 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30 active:scale-95"
                >
                  Save Address
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
