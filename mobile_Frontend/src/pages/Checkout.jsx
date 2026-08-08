
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";
import { formatCurrency } from "../utils/formatters";

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, guestId } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ 
    customer_name: "", 
    email: "", 
    mobile: "", 
    shipping_address: "" 
  });

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
    } catch (error) {
      setError('Unable to proceed to payment');
    } finally {
      setLoading(false);
    }
  };

  // If no items, show loading or redirect
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8f7f2] pt-28 px-4 md:px-8 lg:px-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No items to checkout.</p>
          <button 
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-[#a97c50] text-white rounded-md hover:bg-[#8a6540] transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] pt-28 pb-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">
            {fromProduct ? "Confirm Order" : "Checkout"}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {fromProduct 
              ? "Review your product and proceed to payment." 
              : "Review your cart items and proceed to payment."}
          </p>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="mt-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input 
                required 
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-[#a97c50] focus:border-transparent" 
                placeholder="Full Name" 
                value={form.customer_name} 
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input 
                required 
                type="email"
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-[#a97c50] focus:border-transparent" 
                placeholder="Email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <input 
                required 
                type="tel"
                className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-[#a97c50] focus:border-transparent" 
                placeholder="Mobile Number" 
                value={form.mobile} 
                onChange={(e) => setForm({ ...form, mobile: e.target.value })} 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Address *
              </label>
              <textarea 
                required 
                className="min-h-24 w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-[#a97c50] focus:border-transparent" 
                placeholder="Shipping Address" 
                value={form.shipping_address} 
                onChange={(e) => setForm({ ...form, shipping_address: e.target.value })} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || items.length === 0}
            className="mt-6 w-full rounded-md bg-[#181818] px-4 py-3 text-white hover:bg-[#333] transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              "Proceed to Payment"
            )}
          </button>
        </form>

        <div className="rounded-xl bg-white p-6 shadow-sm h-fit">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between gap-3">
                <span className="min-w-0 break-words">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="whitespace-nowrap shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 border-t pt-4 flex justify-between font-semibold text-black">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {user && (
            <div className="mt-4 pt-4 border-t text-xs text-gray-500">
              <p>✓ Order will be linked to your account</p>
              <p className="mt-1">You can view your orders in your profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}