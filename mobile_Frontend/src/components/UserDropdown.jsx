import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, ShoppingBag, Heart, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useStore } from "../contexts/StoreContext";

function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const { clearStore } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    clearStore();
    setIsOpen(false);
    navigate("/");
  };

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-1.5 group px-2 py-1.5 rounded-xl hover:bg-slate-100 transition"
      >
        <span className="relative">
          <User size={22} className="text-slate-700 group-hover:text-[#2563eb] transition" />
        </span>
        <span className="hidden xl:block text-xs font-medium text-slate-700 group-hover:text-[#2563eb]">
          Login
        </span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group"
      >
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white text-sm font-bold shrink-0">
          {(user.name || "U").charAt(0).toUpperCase()}
        </span>
        <span className="hidden xl:block text-xs font-medium text-slate-700 group-hover:text-[#2563eb] text-left leading-tight">
          Hi, {user.name}
        </span>
        <ChevronDown size={14} className={`hidden xl:block text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(15,23,42,0.18)] border border-slate-100 py-2 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-[#f0f7ff] to-[#f5f3ff]">
            <p className="text-sm font-bold text-[#0f172a]">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#2563eb]/5 hover:text-[#2563eb] transition"
            onClick={() => setIsOpen(false)}
          >
            <User size={18} />
            My Profile
          </Link>

          <Link
            to="/orders"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#2563eb]/5 hover:text-[#2563eb] transition"
            onClick={() => setIsOpen(false)}
          >
            <ShoppingBag size={18} />
            My Orders
          </Link>

          <Link
            to="/wishlist"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#2563eb]/5 hover:text-[#2563eb] transition"
            onClick={() => setIsOpen(false)}
          >
            <Heart size={18} />
            Wishlist
          </Link>

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition w-full"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDropdown;