import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { CheckCircle, ShoppingBag, Home } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orderId, orderNumber } = location.state || {};

  useEffect(() => {
    // If no order data, redirect to home
    if (!orderId && !orderNumber) {
      navigate("/");
    }
  }, [orderId, orderNumber, navigate]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12 flex items-center justify-center">
      <div className="max-w-2xl w-full rounded-3xl bg-white p-8 md:p-12 text-center ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl flex items-center justify-center ring-1 ring-green-200">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#0f172a] mb-2">
          Order Confirmed!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your order. Your order has been placed successfully.
        </p>

        <div className="bg-[#f8fafc] rounded-2xl p-4 mb-6 ring-1 ring-slate-100">
          <p className="text-sm text-gray-600">Order Number</p>
          <p className="text-lg font-bold text-[#2563eb]">
            #{orderNumber || orderId || "N/A"}
          </p>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          We will send you an email confirmation shortly with your order details.
        </p>

        <div className="space-y-3">
          {user ? (
            <Link
              to="/orders"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30"
            >
              <ShoppingBag size={20} />
              View My Orders
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30"
            >
              Login to Track Your Order
            </Link>
          )}

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full border border-[#2563eb] text-[#2563eb] px-6 py-3 rounded-2xl font-semibold hover:bg-[#2563eb]/5 transition"
          >
            <Home size={20} />
            Continue Shopping
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 text-sm text-gray-500">
          <p>You will receive an order confirmation email with details.</p>
          <p className="mt-1">For any queries, contact our support team.</p>
        </div>
      </div>
    </div>
  );
}