import { Link, useLocation } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home, FileText } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

export default function PaymentSuccess() {
  const location = useLocation();
  const data = location.state || {};

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] p-8 md:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-50 rounded-2xl flex items-center justify-center ring-1 ring-green-200">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-[#0f172a] mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully.
        </p>

        <div className="bg-[#f8fafc] rounded-2xl p-4 mb-6 text-left ring-1 ring-slate-100">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Invoice Number</p>
              <p className="font-semibold text-[#2563eb]">#{data.invoice_no || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Customer</p>
              <p className="font-semibold">{data.customer_name || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-semibold">{formatCurrency(data.total_amount || 0)}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              <p className={`font-semibold ${data.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                {data.payment_status === "paid" ? "Paid" : "Partial"}
              </p>
            </div>
            {data.balance_amount > 0 && (
              <div className="col-span-2">
                <p className="text-gray-500">Balance Amount</p>
                <p className="font-semibold text-red-600">
                  {formatCurrency(data.balance_amount)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to="/orders"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white px-6 py-3 rounded-2xl font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30"
          >
            <ShoppingBag size={20} />
            View My Orders
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full border border-[#2563eb] text-[#2563eb] px-6 py-3 rounded-2xl font-semibold hover:bg-[#2563eb]/5 transition"
          >
            <Home size={20} />
            Continue Shopping
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-100 text-sm text-gray-500">
          <p>An invoice has been sent to your email.</p>
          <p className="mt-1">For any queries, contact our support team.</p>
        </div>
      </div>
    </div>
  );
}