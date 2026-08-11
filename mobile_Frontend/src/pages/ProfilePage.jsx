import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  Calendar,
  Heart,
  ShoppingBag,
  Award,
  Lock, // ✅ Added for password icon
} from "lucide-react";
import { API_BASE_URL } from "../services/api";

function ProfilePage() {
  const { user, updateProfile, loading, changePassword } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isEditing, setIsEditing] = useState(false);

  // ✅ State for change password
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const validatePhone = (phone) => {
    const phoneClean = phone.replace(/[^0-9]/g, "");
    return phoneClean.length === 10;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (formData.phone && !validatePhone(formData.phone)) {
      setMessage({
        type: "error",
        text: "Please enter a valid 10-digit phone number",
      });
      return;
    }

    const result = await updateProfile(formData);
    if (result?.status) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setIsEditing(false);
    } else {
      setMessage({
        type: "error",
        text: result?.message || "Failed to update profile",
      });
    }
  };

  // ✅ Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "All fields are required" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 6 characters",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match" });
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await changePassword(currentPassword, newPassword); // ✅ use context method
      if (result?.status) {
        setPasswordMessage({
          type: "success",
          text: "Password changed successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowChangePassword(false);
      } else {
        setPasswordMessage({
          type: "error",
          text: result?.message || "Failed to change password",
        });
      }
    } catch (error) {
      setPasswordMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };
  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative text-center bg-white/90 backdrop-blur-sm p-12 rounded-3xl ring-1 ring-slate-100 shadow-2xl max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-[#2563eb]" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#0f172a]">
            Welcome Back
          </h2>
          <p className="text-gray-600 mt-2">
            Please login to view your profile
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block px-8 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30"
          >
            Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative max-w-5xl mx-auto px-4 pt-[116px] lg:pt-[156px] pb-8">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] rounded-2xl p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/50 flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                {user.name}
              </h1>
              <p className="text-white/80">{user.email}</p>
              <div className="flex flex-wrap gap-4 mt-3 justify-center md:justify-start">
                <span className="flex items-center gap-1 text-white/90 text-sm bg-white/10 px-3 py-1 rounded-full">
                  <Heart size={14} className="text-pink-300" /> Member
                </span>
                <span className="flex items-center gap-1 text-white/90 text-sm bg-white/10 px-3 py-1 rounded-full">
                  <Award size={14} className="text-yellow-300" /> Premium
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/orders"
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition text-sm font-medium"
              >
                My Orders
              </Link>
              <Link
                to="/wishlist"
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition text-sm font-medium"
              >
                Wishlist
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-white/20">
          {message.text && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
                }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold tracking-tight text-[#0f172a]">
              Profile Information
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 text-sm text-[#2563eb] border-2 border-[#2563eb] rounded-xl hover:bg-gradient-to-r hover:from-[#2563eb] hover:to-[#7c3aed] hover:text-white hover:border-transparent transition-all duration-300 font-semibold"
              >
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition ${isEditing
                      ? "border-gray-300 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                    }`}
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={16} className="inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition ${isEditing
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                  }`}
                placeholder="Enter your 10-digit phone number"
              />
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1">
                  Enter 10-digit phone number without spaces
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Shipping Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                disabled={!isEditing}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition ${isEditing
                    ? "border-gray-300 bg-white"
                    : "border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed"
                  }`}
                placeholder="Enter your complete shipping address"
              />
            </div>

            {isEditing && (
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white px-8 py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold shadow-lg shadow-[#2563eb]/30"
                >
                  <Save size={18} />
                  {loading ? "Updating..." : "Update Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name || "",
                      phone: user.phone || "",
                      address: user.address || "",
                    });
                    setMessage({ type: "", text: "" });
                  }}
                  className="px-8 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>

          {/* Profile Info Display when not editing */}
          {!isEditing && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-[#0f172a]">
                    {user.name || "Not set"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-[#0f172a]">
                    {user.phone || "Not set"}
                  </p>
                </div>
                <div className="md:col-span-2 bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="font-medium text-[#0f172a]">
                    {user.address || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Change Password Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                setShowChangePassword(!showChangePassword);
                setPasswordMessage({ type: "", text: "" });
              }}
              className="flex items-center gap-2 text-[#2563eb] hover:text-[#1d4ed8] font-medium transition"
            >
              <Lock size={18} />
              {showChangePassword ? "Cancel" : "Change Password"}
            </button>

            {showChangePassword && (
              <form
                onSubmit={handlePasswordChange}
                className="mt-4 p-6 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
              >
                {passwordMessage.text && (
                  <div
                    className={`p-3 rounded-lg text-sm flex items-center gap-2 ${passwordMessage.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                      }`}
                  >
                    {passwordMessage.type === "success" ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <span>{passwordMessage.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                    placeholder="Enter your current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                    placeholder="Re-enter new password"
                  />
                </div>
                <div className="text-right mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#2563eb] hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold shadow-lg shadow-[#2563eb]/30"
                >
                  {passwordLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Decorative Footer */}
        <div className="mt-8 text-center text-white/60 text-sm">
          <p>📱 MobileKart - Your Smartphone Store</p>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;