import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoginBanner from "../assets/LoginBanner.png";
import api from "../services/api";

export default function Login() {
  const { login, loading, user } = useAuth();
const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirect = searchParams.get("redirect") || "/";
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    if (user) {
      navigate(redirect, { replace: true });
    }
  }, [user, navigate, redirect]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    
   if (!email || !password) {
  setError("Please fill in all fields");
  return;
}

    

const response = await login(email, password);
    if (response.status) {
      setIsModalOpen(false);
      navigate(redirect, { replace: true });
    } else {
      setError(response.message || "Login failed");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    navigate("/");
  };

  if (!isModalOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-y-auto max-h-screen animate-slideUp">
          
          {/* Close Button */}
          <button 
            onClick={closeModal}
            className="absolute top-3 right-3 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex flex-col md:flex-row min-h-[420px]">
            <div className="w-full md:w-2/5 overflow-hidden">
              <img
                src={LoginBanner}
                alt="Login banner"
                className="h-full w-full object-cover object-center"
              />
            </div>

            {/* Right Section - Form */}
            <div className="w-full md:w-3/5 p-6 md:p-8 bg-white">
              <div className="max-w-sm mx-auto">
                <h2 className="text-xl font-semibold text-[#181818]">Welcome Back</h2>
                <p className="mt-0.5 text-xs text-gray-500">Login to your account</p>
                
                {error && (
                  <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700 border border-red-200">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                 <div>
  <label className="block text-[11px] font-medium text-gray-700 mb-1">
    Email Address *
  </label>

  <input
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    required
    type="email"
    placeholder="Enter your email"
    className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#a97c50] focus:border-transparent transition outline-none bg-gray-50 hover:bg-white"
  />
</div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      type="password" 
                      placeholder="Enter your password" 
                      className="w-full rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-[#a97c50] focus:border-transparent transition outline-none bg-gray-50 hover:bg-white" 
                    />
                  </div>
                  <div className="text-right mt-1">
  <Link
    to={`/forgot-password?redirect=${encodeURIComponent(redirect)}`}
    className="text-xs text-[#a97c50] hover:underline"
  >
    Forgot password?
  </Link>
</div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full rounded-lg bg-[#a97c50] px-4 py-2.5 text-white text-sm font-medium hover:bg-[#8a6b40] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 shadow-md hover:shadow-lg"
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>
                
                {/* Terms */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                    By continuing, you agree to our{" "}
                    <a href="#" className="text-[#a97c50] hover:underline font-medium">Privacy Policy</a> &{" "}
                    <a href="#" className="text-[#a97c50] hover:underline font-medium">T&C's</a>
                  </p>
                </div>
                
                <p className="mt-3 text-sm text-gray-600 text-center">
                  New customer?{" "}
                  <Link 
                    className="text-[#a97c50] font-semibold hover:underline" 
                    to={`/register?redirect=${encodeURIComponent(redirect)}`}
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
}