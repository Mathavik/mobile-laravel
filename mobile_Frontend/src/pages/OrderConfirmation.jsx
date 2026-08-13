import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Home, Package, Calendar, Mail } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import SuccessAnimation from "../components/SuccessAnimation";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

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

  const orderRef = orderNumber || orderId;

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="max-w-2xl w-full rounded-3xl bg-white p-8 md:p-12 text-center ring-1 ring-slate-100 shadow-[0_2px_30px_rgba(15,23,42,0.08)] overflow-hidden relative"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 blur-2xl pointer-events-none"
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="relative"
        >
          <motion.div variants={item} className="flex justify-center mb-6">
            <SuccessAnimation size={104} />
          </motion.div>

          <motion.h1
            variants={item}
            className="text-3xl font-extrabold tracking-tight text-[#0f172a] mb-2"
          >
            Order Confirmed!
          </motion.h1>

          <motion.p variants={item} className="text-gray-600 mb-7">
            Thank you for your order. Your order has been placed successfully.
          </motion.p>

          <motion.div
            variants={item}
            className="bg-[#f8fafc] rounded-2xl p-5 mb-6 ring-1 ring-slate-100"
          >
            <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
              <Package size={14} className="text-[#2563eb]" />
              Order Number
            </p>
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 14, stiffness: 220, delay: 0.7 }}
              className="text-2xl font-extrabold text-[#2563eb] mt-1"
            >
              #{orderRef || "N/A"}
            </motion.p>
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1 mt-2">
              <Calendar size={12} />
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>

          <motion.p variants={item} className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-1.5">
            <Mail size={14} />
            We will send you an email confirmation shortly with your order details.
          </motion.p>

          <motion.div variants={item} className="space-y-3">
            {user ? (
              <Link
                to="/orders"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30 active:scale-[0.98]"
              >
                <ShoppingBag size={20} />
                View My Orders
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30 active:scale-[0.98]"
              >
                Login to Track Your Order
              </Link>
            )}

            <Link
              to="/"
              className="flex items-center justify-center gap-2 w-full border border-[#2563eb] text-[#2563eb] px-6 py-3 rounded-2xl font-semibold hover:bg-[#2563eb]/5 transition active:scale-[0.98]"
            >
              <Home size={20} />
              Continue Shopping
            </Link>
          </motion.div>

          <motion.div
            variants={item}
            className="mt-8 pt-8 border-t border-slate-100 text-sm text-gray-500"
          >
            <p>You will receive an order confirmation email with details.</p>
            <p className="mt-1">For any queries, contact our support team.</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
