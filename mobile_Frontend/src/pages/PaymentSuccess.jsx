import { Link, useLocation } from "react-router-dom";
import { CheckCircle, ShoppingBag, Home, FileText } from "lucide-react";
import { formatCurrency } from "../utils/formatters";

export default function PaymentSuccess() {
  const location = useLocation();
  const data = location.state || {};

  return (
    <div className="min-h-screen bg-[#f8f7f2] pt-28 px-4 md:px-8 lg:px-12 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm p-8 md:p-12 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <h1 className="text-3xl font-serif font-bold text-[#181818] mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully.
        </p>

        <div className="bg-[#f8f7f2] rounded-lg p-4 mb-6 text-left">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Invoice Number</p>
              <p className="font-semibold text-[#a97c50]">#{data.invoice_no || "N/A"}</p>
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
            className="flex items-center justify-center gap-2 w-full bg-[#a97c50] text-white px-6 py-3 rounded-md hover:bg-[#8a6540] transition"
          >
            <ShoppingBag size={20} />
            View My Orders
          </Link>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full border border-[#a97c50] text-[#a97c50] px-6 py-3 rounded-md hover:bg-[#a97c50] hover:text-white transition"
          >
            <Home size={20} />
            Continue Shopping
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t text-sm text-gray-500">
          <p>An invoice has been sent to your email.</p>
          <p className="mt-1">For any queries, contact our support team.</p>
        </div>
      </div>
    </div>
  );
}