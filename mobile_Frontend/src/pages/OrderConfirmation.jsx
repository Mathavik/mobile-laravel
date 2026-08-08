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
    <div className="min-h-screen bg-[#f8f7f2] pt-28 px-4 md:px-8 lg:px-12 flex items-center justify-center">
      <div className="max-w-2xl w-full rounded-xl bg-white p-8 md:p-12 text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-[#181818] mb-2">
          Order Confirmed!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Thank you for your order. Your order has been placed successfully.
        </p>

        <div className="bg-[#f8f7f2] rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Order Number</p>
          <p className="text-lg font-semibold text-[#a97c50]">
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
              className="flex items-center justify-center gap-2 w-full bg-[#a97c50] text-white px-6 py-3 rounded-md hover:bg-[#8a6540] transition"
            >
              <ShoppingBag size={20} />
              View My Orders
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full bg-[#a97c50] text-white px-6 py-3 rounded-md hover:bg-[#8a6540] transition"
            >
              Login to Track Your Order
            </Link>
          )}

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full border border-[#a97c50] text-[#a97c50] px-6 py-3 rounded-md hover:bg-[#a97c50] hover:text-white transition"
          >
            <Home size={20} />
            Continue Shopping
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t text-sm text-gray-500">
          <p>You will receive an order confirmation email with details.</p>
          <p className="mt-1">For any queries, contact our support team.</p>
        </div>
      </div>
    </div>
  );
}