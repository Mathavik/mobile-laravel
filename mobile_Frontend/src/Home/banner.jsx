import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Smartphone, ShieldCheck, Zap, BadgeCheck, ArrowRight, Star, Cpu } from "lucide-react";
import api from "../services/api";

function Banner() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api
      .get("/category/get_active_category")
      .then((res) => {
        if (!cancelled && res.data?.status) {
          setCategories(res.data.data || []);
        }
      })
      .catch((err) => console.error("Failed to load categories:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="pt-[116px] lg:pt-[156px]">
      <div className="relative overflow-hidden bg-[#0a1122]">
        {/* Animated gradient blobs */}
        <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-[#2563eb]/40 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full bg-[#7c3aed]/25 blur-3xl" />
        <div className="absolute top-1/4 right-1/3 w-72 h-72 rounded-full bg-[#06b6d4]/20 blur-3xl" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* LEFT — copy + search */}
            <div className="text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm">
                <BadgeCheck size={14} className="text-[#38bdf8]" />
                Authorized Mobile Store · 100% Genuine
              </span>

              <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.05] tracking-tight">
                Upgrade to
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#60a5fa] via-[#818cf8] to-[#38bdf8]">
                  Next-Gen Phones
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-md leading-relaxed">
                Latest 5G smartphones at the best prices — genuine warranty,
                fast delivery and unbeatable offers.
              </p>

              {/* Search bar */}
              <form
                onSubmit={submitSearch}
                className="mt-7 flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-2xl shadow-[#2563eb]/20 max-w-md"
              >
                <div className="flex items-center gap-2 pl-3 flex-1">
                  <Search size={18} className="text-slate-400 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Galaxy S24, iPhone 15..."
                    className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-90 text-white text-sm font-semibold px-6 py-2.5 transition"
                >
                  Search
                </button>
              </form>

              {/* Quick category chips */}
              {categories.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 mr-1">Popular:</span>
                  {categories.slice(0, 4).map((category) => (
                    <Link
                      key={category.id}
                      to={`/mobiles?category_id=${category.id}`}
                      className="rounded-full border border-white/20 bg-white/5 hover:bg-white/15 hover:border-[#60a5fa]/50 text-xs px-3 py-1.5 text-slate-200 transition"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Trust stats */}
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                {[
                  { icon: Zap, label: "5G Ready" },
                  { icon: ShieldCheck, label: "1 Year Warranty" },
                  { icon: Smartphone, label: "100% Genuine" },
                ].map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-3"
                  >
                    <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-[#2563eb]/40 to-[#7c3aed]/40 text-[#60a5fa]">
                      <Icon size={18} />
                    </span>
                    <span className="text-xs font-medium text-slate-200 leading-tight">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — floating phone + stat cards */}
            <div className="relative hidden lg:flex items-center justify-center py-6">
              {/* Glow behind phone */}
              <div className="absolute w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-[#2563eb]/40 to-[#7c3aed]/40 blur-3xl" />

              <div className="relative w-[280px] h-[540px] rounded-[44px] border border-white/20 bg-gradient-to-b from-[#0f1b33] to-[#1e1b4b] shadow-2xl overflow-hidden">
                {/* notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-[#0a1122] rounded-b-2xl z-20" />
                {/* screen content */}
                <div className="absolute inset-0 pt-10 px-4 pb-4 flex flex-col gap-3">
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                      Now Available
                    </p>
                    <p className="text-sm font-semibold text-white mt-1">
                      Galaxy S24 Ultra
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#38bdf8]">₹1,29,999</span>
                      <span className="text-[10px] text-emerald-400 line-through">₹1,44,999</span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed]" />
                    </div>
                    <p className="mt-1.5 text-[10px] text-slate-400">Sold: 2.4k</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#2563eb]/30 text-[#60a5fa]">
                      <Cpu size={16} />
                    </span>
                    <div>
                      <p className="text-[10px] text-slate-400">Processor</p>
                      <p className="text-xs font-semibold text-white">Snapdragon 8 Gen 3</p>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/10 border border-white/10 p-4 flex items-center gap-3">
                    <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#06b6d4]/30 text-[#38bdf8]">
                      <Star size={16} />
                    </span>
                    <div>
                      <p className="text-[10px] text-slate-400">Battery</p>
                      <p className="text-xs font-semibold text-white">5000 mAh · 45W Fast</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating stat cards */}
              <div className="absolute -left-8 top-20 rounded-2xl bg-white shadow-2xl px-4 py-3 border border-slate-100 animate-bounce-slow">
                <p className="text-[10px] text-slate-500">Starting from</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹9,999<span className="text-xs font-medium text-slate-400">/mo</span>
                </p>
              </div>
              <div className="absolute -right-6 bottom-16 rounded-2xl bg-white shadow-2xl px-4 py-3 border border-slate-100">
                <p className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <ShieldCheck size={12} className="text-green-600" /> Free Delivery
                </p>
                <p className="text-sm font-bold text-slate-900">No Cost EMI</p>
              </div>
              <Link
                to="/mobiles"
                className="absolute -left-4 bottom-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-sm font-semibold px-5 py-2.5 shadow-xl shadow-[#2563eb]/30 hover:opacity-90 transition"
              >
                Shop Now <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Banner;
