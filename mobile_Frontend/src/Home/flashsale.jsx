import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Flame, ArrowRight, Truck, ShieldCheck, BadgePercent, Timer } from "lucide-react";
import api from "../services/api";
import ProductMedia from "../components/ProductMedia";
import { formatCurrency, getDiscountPercent } from "../utils/formatters";

/**
 * FlashSale
 * ─────────────────────────────────────────────
 * Animated "FLASH SALE" homepage section:
 *  - live countdown timer (persists across reloads)
 *  - scrolling marquee ticker
 *  - floating particles / bobbing emoji
 *  - pulsing LIVE badge + animated sell-out progress bar
 *  - 3D tilt product cards with staggered entrance
 *
 * Data: GET /shop/products?sort=popular&per_page=4 (4 most-viewed products).
 */
const SALE_DURATION_MS = 24 * 60 * 60 * 1000;

const getSaleEnd = () => {
  const key = "mobilekart_flash_sale_end";
  const stored = Number(localStorage.getItem(key));
  const now = Date.now();
  if (stored && stored > now) return stored;
  const end = now + SALE_DURATION_MS;
  localStorage.setItem(key, String(end));
  return end;
};

function useCountdown() {
  const [endTime] = useState(getSaleEnd);
  const [remaining, setRemaining] = useState(() => endTime - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(0, endTime - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const total = Math.floor(remaining / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (n) => String(n).padStart(2, "0");

const FlashSale = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { days, hours, minutes, seconds } = useCountdown();

  useEffect(() => {
    let cancelled = false;
    api
      .get("/shop/products", {
        params: { sort: "popular", per_page: 4, page: 1 },
      })
      .then((res) => {
        if (cancelled) return;
        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        setProducts((res.data?.success || res.data?.status) ? list : []);
      })
      .catch(() => !cancelled && setProducts([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => products.slice(0, 4), [products]);

  return (
    <section className="py-14 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#7c3aed] px-5 py-10 sm:px-8 md:px-12 md:py-14 shadow-[0_30px_80px_-20px_rgba(37,99,235,0.55)]">
          <FlashStyles />

          {/* ── Decorative animated background ── */}
          <div className="pointer-events-none absolute inset-0">
            {/* glow blobs */}
            <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#7c3aed]/40 blur-3xl animate-[flash-blob_9s_ease-in-out_infinite]" />
            <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-[#38bdf8]/30 blur-3xl animate-[flash-blob_11s_ease-in-out_infinite_reverse]" />
            {/* rising particles */}
            <span className="flash-particle" style={{ left: "8%", animationDelay: "0s" }}>💫</span>
            <span className="flash-particle" style={{ left: "22%", animationDelay: "1.6s" }}>⚡</span>
            <span className="flash-particle" style={{ left: "38%", animationDelay: "0.9s" }}>✨</span>
            <span className="flash-particle" style={{ left: "56%", animationDelay: "2.4s" }}>💥</span>
            <span className="flash-particle" style={{ left: "72%", animationDelay: "0.5s" }}>⚡</span>
            <span className="flash-particle" style={{ left: "88%", animationDelay: "1.9s" }}>✨</span>
            {/* faint grid */}
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:40px_40px]" />
          </div>

          {/* ── Marquee ticker ── */}
          <div className="relative mb-8 md:mb-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden">
            <div className="flash-marquee flex items-center gap-8 whitespace-nowrap w-max py-2.5 text-[12px] sm:text-sm font-semibold text-white">
              {[0, 1].map((rep) => (
                <span key={rep} className="flex items-center gap-8">
                  <span className="flex items-center gap-2"><Zap size={14} className="text-amber-300" /> FLASH SALE</span>
                  <span className="flex items-center gap-2"><BadgePercent size={14} className="text-pink-300" /> UP TO 50% OFF</span>
                  <span className="flex items-center gap-2"><Truck size={14} className="text-emerald-300" /> FREE DELIVERY ABOVE ₹999</span>
                  <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-sky-300" /> 1 YEAR BRAND WARRANTY</span>
                  <span className="flex items-center gap-2"><Zap size={14} className="text-amber-300" /> MEGA 5G SALE</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── Header row ── */}
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur border border-white/25 px-4 py-1.5">
                <span className="relative flex w-2.5 h-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-red-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-widest text-white">Live Now</span>
              </div>

              <h2 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                <span className="inline-flex items-center gap-2">
                  <Flame className="inline text-amber-300 animate-[flash-flicker_1.4s_ease-in-out_infinite]" />
                  Flash Sale
                </span>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-blue-100/90 max-w-md mx-auto lg:mx-0">
                Grab the hottest deals before time runs out — prices drop, stock flies!
              </p>
            </div>

            {/* ── Countdown ── */}
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <span className="hidden sm:flex flex-col items-center justify-center mr-1">
                <Timer size={22} className="text-amber-300 mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-blue-100/80 font-bold">Ends in</span>
              </span>
              <CountdownCell value={days} label="Days" />
              <span className="text-white/70 font-black text-2xl animate-pulse">:</span>
              <CountdownCell value={hours} label="Hrs" />
              <span className="text-white/70 font-black text-2xl animate-pulse">:</span>
              <CountdownCell value={minutes} label="Min" />
              <span className="text-white/70 font-black text-2xl animate-pulse">:</span>
              <CountdownCell value={seconds} label="Sec" pulse />
            </div>
          </div>

          {/* ── Sell-out progress ── */}
          <div className="relative mt-8 max-w-2xl mx-auto lg:mx-0">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-blue-100/90 mb-2">
              <span className="flex items-center gap-1.5">
                <Flame size={12} className="text-amber-300" /> Selling fast — 72% claimed
              </span>
              <span>Hurry up!</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/15 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "72%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 relative"
              >
                <span className="absolute inset-0 animate-pulse bg-white/20" />
              </motion.div>
            </div>
          </div>

          {/* ── Product grid ── */}
          {loading ? (
            <div className="relative mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 rounded-2xl bg-white/15 animate-pulse" />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="relative mt-10 text-center text-blue-100/80 py-10">
              Deals are being restocked — check back soon!
            </div>
          ) : (
            <div className="relative mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {cards.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40, scale: 0.92 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
                  className="h-full"
                >
                  <FlashCard product={product} onOpen={() => navigate(`/product/${product.id}`)} />
                </motion.div>
              ))}
            </div>
          )}

          {/* ── CTA ── */}
          <div className="relative mt-10 text-center">
            <button
              onClick={() => navigate("/mobiles")}
              className="group inline-flex items-center gap-2 rounded-full bg-white text-[#2563eb] font-bold text-sm sm:text-base px-8 py-3.5 shadow-xl shadow-black/20 transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              View All Deals
              <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Countdown cell ─────────────────────────────────── */
const CountdownCell = ({ value, label, pulse = false }) => (
  <div
    className={`flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-inner ${
      pulse ? "animate-[flash-pulse_1s_ease-in-out_infinite]" : ""
    }`}
  >
    <span className="text-2xl sm:text-3xl font-black text-white tabular-nums leading-none">
      {pad(value)}
    </span>
    <span className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-100/80 font-bold">
      {label}
    </span>
  </div>
);

/* ── Tilt product card ──────────────────────────────── */
const FlashCard = ({ product, onOpen }) => {
  const cardRef = useRef(null);
  const offer = Number(product.offer_price || product.price) || 0;
  const original = Number(product.mrp || product.price) || offer;
  const discount = original > offer ? getDiscountPercent(original, offer) : 0;
  const isOut = Number(product.stock) <= 0;

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * 10}deg) rotateX(${py * -10}deg) translateY(-6px)`;
  };

  const handleLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onClick={onOpen}
      className="group relative cursor-pointer rounded-2xl bg-white/95 backdrop-blur-md overflow-hidden ring-1 ring-white/40 shadow-lg shadow-black/10 transition-shadow duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      style={{ transformStyle: "preserve-3d", transition: "transform 0.15s ease-out" }}
    >
      {/* discount ribbon */}
      {discount > 0 && (
        <span className="absolute top-3 left-3 z-20 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] sm:text-xs font-black px-2.5 py-1 shadow-lg animate-[flash-wiggle_3s_ease-in-out_infinite]">
          -{discount}% OFF
        </span>
      )}
      {/* LIVE overlay badge */}
      <span className="absolute top-3 right-3 z-20 flex items-center gap-1 rounded-full bg-[#0f172a]/80 backdrop-blur text-white text-[9px] sm:text-[10px] font-bold px-2 py-1">
        <span className="relative flex w-1.5 h-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-red-500" />
        </span>
        LIVE
      </span>

      {/* image */}
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff]">
        <ProductMedia
          product={product}
          image={product.image}
          video={product.video_url}
          alt={product.product_name || "Product"}
          imageClassName="w-full h-full object-contain p-3 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-2"
          videoClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* body */}
      <div className="p-3 sm:p-4">
        <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] line-clamp-1">
          {product.product_name || "Smartphone"}
        </h3>
        <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1">
          {[product.ram, product.internal_storage].filter(Boolean).join(" · ") || "Best Seller"}
        </p>

        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <span className="text-base sm:text-lg font-black text-[#2563eb]">
            {formatCurrency(offer)}
          </span>
          {original > offer && (
            <span className="text-[10px] sm:text-xs text-gray-400 line-through">
              {formatCurrency(original)}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          disabled={isOut}
          className={`mt-3 w-full rounded-xl py-2 text-[11px] sm:text-xs font-bold text-white transition-all duration-300 active:scale-95 ${
            isOut
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:shadow-lg hover:shadow-[#2563eb]/40 hover:brightness-110"
          }`}
        >
          {isOut ? "Out of Stock" : "Grab Deal"}
        </button>
      </div>
    </div>
  );
};

/* ── Keyframe styles ────────────────────────────────── */
const FlashStyles = () => (
  <style>{`
    .flash-particle {
      position: absolute;
      bottom: -10%;
      font-size: 18px;
      opacity: 0;
      animation: flash-rise 7s linear infinite;
      pointer-events: none;
    }
    @keyframes flash-rise {
      0%   { transform: translateY(0) scale(0.7); opacity: 0; }
      15%  { opacity: 0.9; }
      100% { transform: translateY(-110vh) scale(1.15); opacity: 0; }
    }
    @keyframes flash-blob {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50%      { transform: translate(20px, -24px) scale(1.12); }
    }
    @keyframes flash-flicker {
      0%, 100% { opacity: 1; transform: scale(1) rotate(-3deg); }
      50%      { opacity: 0.7; transform: scale(1.15) rotate(3deg); }
    }
    @keyframes flash-pulse {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.06); box-shadow: 0 0 22px rgba(255,255,255,0.35); }
    }
    @keyframes flash-wiggle {
      0%, 100% { transform: rotate(-3deg); }
      50%      { transform: rotate(3deg) scale(1.06); }
    }
    .flash-marquee {
      animation: flash-scroll 22s linear infinite;
    }
    @keyframes flash-scroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
  `}</style>
);

export default FlashSale;
