import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ForgotPassword() {
  const { forgotPassword, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const result = await forgotPassword(email);
    if (result.status) {
      setMessage(result.message || "If this email exists, a reset link has been sent.");
      setEmail(""); // clear field
    } else {
      setError(result.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4  pt-[116px] lg:pt-[156px] pb-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]">
        <div>
          <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight text-[#0f172a]">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-2xl bg-green-50 p-3 text-sm text-green-700 border border-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#0f172a]">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 rounded-2xl shadow-lg shadow-[#2563eb]/30 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-[#2563eb] font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}