import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Home,
  FileText,
  MapPin,
  User,
  IndianRupee,
  BadgeCheck,
} from "lucide-react";
import SuccessAnimation from "../components/SuccessAnimation";
import CountUp from "../components/CountUp";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function PaymentSuccess() {
  const location = useLocation();
  const data = location.state || {};
  const status = data.payment_status || "paid";

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="max-w-2xl w-full bg-white rounded-3xl ring-1 ring-slate-100 shadow-[0_2px_30px_rgba(15,23,42,0.08)] p-8 md:p-12 text-center overflow-hidden relative"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 blur-2xl pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.6 }}
          className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-br from-emerald-200/30 to-emerald-100/10 blur-2xl pointer-events-none"
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
            Payment Successful!
          </motion.h1>

          <motion.div
            variants={item}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-5"
          >
            <BadgeCheck size={16} />
            {status === "paid" ? "Fully Paid" : "Order Placed"}
          </motion.div>

          <motion.p variants={item} className="text-gray-600 mb-7">
            Thank you! Your payment has been processed and your order is confirmed.
          </motion.p>

          <motion.div
            variants={item}
            className="bg-[#f8fafc] rounded-2xl p-5 mb-6 text-left ring-1 ring-slate-100"
          >
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Invoice Number</p>
                <p className="font-bold text-[#2563eb] mt-0.5">#{data.invoice_no || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-semibold mt-0.5 flex items-center gap-1 truncate">
                  <User size={13} className="text-gray-400 shrink-0" />
                  {data.customer_name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Total Amount</p>
                <p className="font-bold mt-0.5 flex items-center gap-1 text-[#0f172a]">
                  <IndianRupee size={13} className="text-gray-400" />
                  <CountUp value={data.total_amount || 0} />
                </p>
              </div>
              <div>
                <p className="text-gray-500">Payment Status</p>
                <p className={`font-bold mt-0.5 ${status === "paid" ? "text-green-600" : "text-amber-600"}`}>
                  {status === "paid" ? "Paid" : "Pending"}
                </p>
              </div>
              {data.shipping_address && (
                <div className="col-span-2">
                  <p className="text-gray-500">Shipping Address</p>
                  <p className="font-medium mt-0.5 flex items-start gap-1.5 text-gray-700">
                    <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
                    {data.shipping_address}
                  </p>
                </div>
              )}
              {data.balance_amount > 0 && (
                <div className="col-span-2">
                  <p className="text-gray-500">Balance Amount</p>
                  <p className="font-bold mt-0.5 text-red-600">
                    <CountUp value={data.balance_amount} />
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={item} className="space-y-3">
            <Link
              to="/orders"
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30 active:scale-[0.98]"
            >
              <ShoppingBag size={20} />
              View My Orders
            </Link>

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
            <p className="flex items-center justify-center gap-1.5">
              <FileText size={15} />
              An invoice has been generated for this order.
            </p>
            <p className="mt-1">For any queries, contact our support team.</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
