import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductMedia from "../components/ProductMedia";
import { formatCurrency } from "../utils/formatters";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../utils/toast";

// ─── Helper Component: Loading Spinner ──────────────────────────────────────
const LoadingSpinner = () => (
  <div className="min-h-screen bg-[#f8f7f2] pt-28 pb-12 px-4 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#a97c50]/20 border-t-[#a97c50]" />
  </div>
);

// ─── Helper Component: Empty Cart ──────────────────────────────────────────
const EmptyCart = () => (
  <div className="rounded-xl bg-white p-6 shadow text-center">
    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </div>
    <p className="text-gray-500 text-lg">Your cart is empty.</p>
    <p className="text-gray-400 text-sm mt-1">Start shopping to add items to your cart</p>
    <Link to="/" className="mt-6 inline-block px-6 py-2 bg-[#a97c50] text-white rounded-full hover:bg-[#8a6540] transition">
      Continue Shopping →
    </Link>
  </div>
);

// ─── Helper Component: Single Cart Item ────────────────────────────────────
const CartItem = ({ item, onUpdate, onRemove }) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition">
      {/* Left: Image + Details */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className="h-20 w-20 md:h-24 md:w-24 rounded-lg overflow-hidden bg-[#f8f7f2] flex items-center justify-center flex-shrink-0">
          <ProductMedia
            product={item}
            image={item.image}
            video={item.video_url}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{item.product_name}</h3>
          <p className="text-sm font-medium text-[#a97c50]">
            {formatCurrency(Number(item.price))}
            {Number(item.gst_percentage) > 0 && (
              <span className="text-xs text-gray-400 ml-1">
                (GST: {item.gst_percentage}%)
              </span>
            )}
          </p>
          {item.size && (
            <span className="inline-flex items-center rounded-full bg-[#f0f0f0] px-3 py-1 text-xs font-medium text-gray-700 mt-1">
              Size: {item.size}
            </span>
          )}
        </div>
      </div>

      {/* Right: Quantity + Remove */}
      <div className="flex items-center gap-3 mt-4 md:mt-0 w-full md:w-auto justify-end">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdate(item.id, Number(item.quantity) - 1)}
            className="h-8 w-8 rounded-full border hover:bg-gray-50 transition flex items-center justify-center disabled:opacity-40"
            disabled={Number(item.quantity) <= 1}
          >
            −
          </button>
          <span className="w-6 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => onUpdate(item.id, Number(item.quantity) + 1)}
            className="h-8 w-8 rounded-full border hover:bg-gray-50 transition flex items-center justify-center"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 text-sm hover:text-red-700 transition ml-2"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

// ─── Helper Component: Order Summary ───────────────────────────────────────
const OrderSummary = ({ subtotal, gst, total, onCheckout, itemCount }) => {
  const avgGst = itemCount > 0 && gst > 0 
    ? Math.round((gst / subtotal) * 100) 
    : 0;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm h-fit sticky top-28">
      <h2 className="text-xl font-semibold">Order Summary</h2>

      <div className="mt-5 space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
        </div>

        {gst > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">GST ({avgGst}%)</span>
            <span className="font-medium">{formatCurrency(gst)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="text-green-600">Free</span>
        </div>

        <hr className="my-2" />

        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        {gst > 0 && (
          <div className="text-xs text-gray-400 text-right mt-1">
            Inclusive of all taxes
          </div>
        )}
      </div>

      <Link to="/" className="block text-center mt-5 text-[#a97c50] hover:underline">
        Continue Shopping
      </Link>

      <button
        onClick={onCheckout}
        className="w-full mt-4 bg-[#181818] text-white py-3 rounded-md hover:bg-[#333] transition"
      >
        Proceed to Checkout
      </button>
    </div>
  );
};

// ─── MAIN COMPONENT: Cart ──────────────────────────────────────────────────
export default function Cart() {
  const { cartItems, refreshCounts } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  // ─── Load cart on mount ──────────────────────────────────────────────────
  useEffect(() => {
    refreshCounts()
      .catch((err) => console.error("Failed to load cart:", err))
      .finally(() => setLoading(false));
  }, []);

  // ─── API: Update quantity ──────────────────────────────────────────────
  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) return;

    try {
      await api.post(`/shop/cart/${id}`, { user_id: user?.id || 0, quantity });
      await refreshCounts();
      showToast("Quantity updated", "success");
    } catch (err) {
      console.error(err);
      showToast("Unable to update quantity", "error");
    }
  };

  // ─── API: Remove item ──────────────────────────────────────────────────
  const removeItem = async (id) => {
    try {
      await api.delete(`/shop/cart/${id}`, { params: { user_id: user?.id || 0 } });
      await refreshCounts();
      showToast("Item removed successfully", "success");
    } catch (err) {
      console.error(err);
      showToast("Unable to remove item", "error");
    }
  };

  // ─── Calculations ──────────────────────────────────────────────────────
  const subtotal = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    );
  }, [cartItems]);

  const gstTotal = useMemo(() => {
    if (!cartItems || cartItems.length === 0) return 0;
    return cartItems.reduce((sum, item) => {
      const gst = Number(item.gst_percentage || 0);
      return sum + (Number(item.price) * Number(item.quantity) * gst / 100);
    }, 0);
  }, [cartItems]);

  const grandTotal = subtotal + gstTotal;

  // ─── Checkout handler ──────────────────────────────────────────────────
  const handleCheckout = () => {
    if (!user) {
      showToast("Please login first", "error");
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    if (!cartItems || cartItems.length === 0) {
      showToast("Your cart is empty", "error");
      return;
    }

    navigate("/checkout", {
      state: {
        fromCart: true,
        cartItems,
        subtotal,
        gstAmount: gstTotal,
        total: grandTotal,
        customer_name: user.name || "",
        email: user.email || "",
        mobile: user.phone || "",
        shipping_address: user.address || "",
      },
    });
  };

  // ─── Render ────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-[#f8f7f2] pt-28 pb-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-[2fr_1fr] gap-8">
        {/* ─── Left Column: Cart Items ────────────────────────────────── */}
        <div>
          <h1 className="text-3xl font-semibold uppercase tracking-wider lg:tracking-[4px]">
            Cart ({cartItems?.length || 0})
          </h1>

          <div className="mt-6 space-y-4">
            {!cartItems || cartItems.length === 0 ? (
              <EmptyCart />
            ) : (
              cartItems.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdate={updateQuantity}
                  onRemove={removeItem}
                />
              ))
            )}
          </div>
        </div>

        {/* ─── Right Column: Order Summary ───────────────────────────── */}
        {cartItems && cartItems.length > 0 && (
          <OrderSummary
            subtotal={subtotal}
            gst={gstTotal}
            total={grandTotal}
            itemCount={cartItems.length}
            onCheckout={handleCheckout}
          />
        )}
      </div>
    </div>
  );
}