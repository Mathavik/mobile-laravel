import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ResetPassword() {
  const { resetPassword, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new link.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token is missing");
      return;
    }
    if (!password || !confirmPassword) {
      setError("Please fill in both password fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const result = await resetPassword(token, password, confirmPassword);
    if (result.status) {
      setSuccess(true);
      // Optionally redirect after a few seconds
      setTimeout(() => navigate("/login"), 3000);
    } else {
      setError(result.message || "Failed to reset password. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-50 ring-1 ring-green-200 flex items-center justify-center text-green-600 text-3xl font-bold mx-auto mb-4">✓</div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0f172a]">Password Reset Successful</h2>
          <p className="mt-2 text-gray-600">You can now log in with your new password.</p>
          <Link
            to="/login"
            className="mt-6 inline-block px-6 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] py-12 px-4 pt-[116px] lg:pt-[156px] pb-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]">
        <div>
          <h2 className="mt-2 text-center text-2xl font-extrabold tracking-tight text-[#0f172a]">
            Reset Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter a new password for your account.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-[#0f172a]">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white"
              placeholder="Min 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#0f172a]">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#2563eb] focus:border-transparent outline-none bg-white"
              placeholder="Re-enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full flex justify-center py-3 px-4 rounded-2xl shadow-lg shadow-[#2563eb]/30 text-sm font-bold text-white bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}