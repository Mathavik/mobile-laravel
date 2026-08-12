import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Cpu, BatteryCharging, Camera, ShieldCheck, Star } from "lucide-react";
import api, { resolveMediaUrl, FALLBACK_IMAGE } from "../services/api";
import { formatCurrency } from "../utils/formatters";
import ProductMedia from "../components/ProductMedia";

/**
 * Spotlight
 * ─────────────────────────────────────────────
 * "IN THE SPOTLIGHT" featured section for the MobileKart homepage.
 *
 * LEFT  : the 2 latest products of that category
 * RIGHT : the single admin-selected spotlight category (image + name)
 *
 * Data comes from ONE API call (GET /category/spotlight) that returns the
 * active category with its 2 latest products already included.
 * The active category is chosen in the admin panel (only ONE can be active).
 */
const Spotlight = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Support optional ?company_id scoping (matches existing storefront behaviour)
        const params = new URLSearchParams(window.location.search);
        const companyId = params.get("company_id");

        const response = await api.get("/category/spotlight", {
          params: companyId ? { company_id: companyId } : {},
        });

        if (!cancelled && response.data?.status) {
          setData(response.data.data || null);
        }
      } catch (err) {
        console.error("Failed to load spotlight:", err);
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const openCategory = () => {
    if (data?.id) navigate(`/mobiles?category_id=${data.id}`);
  };

  const openProduct = (id) => navigate(`/product-details/${id}`);

  if (loading) {
    return <SpotlightSkeleton />;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <SpotlightStyles />

      {/* ── Section Header ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center mb-8 md:mb-10"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#2563eb] mb-2">
          <Sparkles size={13} className="animate-spin-slow" /> Hand-Picked For You
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3 spotlight-shimmer-text">
          Featured Phones
        </h2>
        <p className="text-sm text-gray-500">Hand-picked smartphones you'll love</p>
      </motion.div>

      {!data ? (
        /* ── Empty state ─────────────────────────────── */
        <p className="text-center text-gray-400">
          Select a spotlight category from the admin panel.
        </p>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5 md:gap-6 items-stretch">
          {/* ── LEFT: 2 latest products ───────────────── */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 md:gap-5">
            {data.products?.length ? (
              data.products.slice(0, 2).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.5, delay: index * 0.18, ease: "easeOut" }}
                  className="h-full"
                >
                  <SpotlightProductCard
                    product={product}
                    onOpen={() => openProduct(product.id)}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="sm:col-span-2 flex items-center justify-center border border-dashed border-gray-300 rounded-2xl text-gray-400 text-sm p-8"
              >
                New arrivals coming soon.
              </motion.div>
            )}
          </div>

          {/* ── RIGHT: Category spotlight ─────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            onClick={openCategory}
            className="lg:col-span-3 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#eff6ff] via-white to-[#f5f3ff] ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] cursor-pointer group/cat min-h-[300px] sm:min-h-[360px] md:min-h-[420px]"
          >
            {/* Decorative glow blobs */}
            <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#2563eb]/10 blur-3xl animate-[spot-glow_7s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#7c3aed]/10 blur-3xl animate-[spot-glow_9s_ease-in-out_infinite_reverse]" />

            {/* floating sparkles */}
            <span className="pointer-events-none absolute top-8 left-10 text-amber-400 animate-[spot-bob_4s_ease-in-out_infinite]">✦</span>
            <span className="pointer-events-none absolute bottom-10 right-8 text-[#2563eb]/50 animate-[spot-bob_5s_ease-in-out_infinite_reverse]">✦</span>
            <span className="pointer-events-none absolute top-1/3 right-12 text-[#7c3aed]/40 animate-[spot-bob_6s_ease-in-out_infinite]">✦</span>

            <div className="relative h-full flex flex-col items-center justify-center text-center px-5 py-10 sm:px-8">
              {/* Category pill */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-4 py-1.5 shadow-lg shadow-[#2563eb]/25 mb-5">
                <Sparkles size={12} className="animate-spin-slow" />
                {data.category_name || "Featured Collection"}
              </span>

              {/* Category image */}
              <div className="relative mb-5">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, -1.5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-2xl bg-white ring-1 ring-slate-100 shadow-[0_12px_30px_-8px_rgba(37,99,235,0.25)] p-2 group-hover/cat:scale-105 transition-transform"
                >
                  <img
                    src={resolveMediaUrl(data.image_src || data.image) || FALLBACK_IMAGE}
                    alt={data.category_name || "Category"}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </motion.div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#0f172a] text-white text-[10px] font-bold tracking-wide px-3 py-1 shadow-lg animate-[spot-pulse_2.2s_ease-in-out_infinite]">
                  ✨ New Arrivals
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#0f172a] tracking-tight font-extrabold mb-2">
                Power Meets Performance
              </h2>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                Explore the latest flagship smartphones, hand-picked for their
                performance, design and value.
              </p>

              {/* CTA row */}
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCategory();
                  }}
                  className="spot-shine relative inline-flex items-center gap-2 overflow-hidden bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-sm font-bold px-7 py-3 rounded-full shadow-lg shadow-[#2563eb]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#2563eb]/40 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Shop Now
                    <ArrowRight size={16} className="transition-transform group-hover/cat:translate-x-0.5" />
                  </span>
                </button>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563eb] transition-all duration-300 hover:gap-3 cursor-pointer">
                  Explore Collection
                  <ArrowRight size={14} className="animate-[spot-nudge_1.8s_ease-in-out_infinite]" />
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

/* ── Spotlight Product Card ──────────────────────────────────── */
const SpotlightProductCard = ({ product, onOpen }) => {
  const hasDiscount = Number(product.discount_percentage) > 0;
  const productName = product.product_name || "Smartphone";
  const isOut = Number(product.stock) <= 0;

  // Format price to show without decimals
  const formatPrice = (price) => {
    if (!price) return "";
    const num = Number(price);
    return Math.round(num).toLocaleString('en-IN');
  };

  const specChips = [
    product.ram,
    product.internal_storage,
    product.display_size,
  ].filter(Boolean);

  const highlights = [
    product.processor && { icon: Cpu, text: product.processor },
    product.battery_capacity && { icon: BatteryCharging, text: product.battery_capacity },
    product.rear_camera && { icon: Camera, text: product.rear_camera },
  ].filter(Boolean);

  const warrantyShort = product.warranty
    ? String(product.warranty).replace(/Warranty/i, "").trim()
    : "";

  return (
    <div
      onClick={onOpen}
      className="group flex flex-col bg-white rounded-2xl ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_34px_-10px_rgba(37,99,235,0.3)] hover:ring-[#2563eb]/30"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#eff6ff] to-[#f5f3ff]">
        <ProductMedia
          product={product}
          image={product.image_src || product.image}
          video={product.video_url}
          alt={productName}
          imageClassName="w-full h-full object-contain p-4 transition-transform duration-700 ease-out group-hover:scale-110"
          videoClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {hasDiscount && (
          <span className="absolute top-3 left-3 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white text-[10px] font-black px-2.5 py-1 shadow-md shadow-[#2563eb]/30">
            -{product.discount_percentage}% OFF
          </span>
        )}

        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-bold text-[#0f172a] shadow-sm">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          4.8
        </span>

        {product.condition && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[#0f172a]/80 backdrop-blur text-white text-[9px] font-semibold tracking-wide px-2.5 py-1">
            {product.condition}
          </span>
        )}

        {isOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
            <span className="bg-[#0f172a] text-white text-xs font-bold tracking-[2px] px-4 py-2 rounded-lg shadow-lg">
              OUT OF STOCK
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-col flex-1 p-4">
        <h4 className="text-sm font-semibold text-[#0f172a] line-clamp-1">
          {productName}
        </h4>

        {/* Spec chips */}
        {specChips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {specChips.map((chip) => (
              <span
                key={chip}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {highlights.slice(0, 3).map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[11px] text-gray-600">
                <Icon size={12} className="text-[#2563eb] shrink-0" />
                <span className="truncate">{text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Price row */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-lg font-extrabold text-[#2563eb]">
            ₹{formatPrice(product.offer_price ?? product.price)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-sm text-gray-400 line-through">
                ₹{formatPrice(product.original_price ?? product.price)}
              </span>
              <span className="text-[11px] font-bold text-green-600">
                {product.discount_percentage}% off
              </span>
            </>
          )}
        </div>

        {/* Stock + CTA */}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          {product.stock != null && (
            <span className={`text-[10px] font-semibold ${isOut ? "text-red-500" : "text-green-600"}`}>
              {isOut ? "Out of Stock" : `${product.stock} left`}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-[#2563eb] group-hover:gap-2 transition-all">
            Shop Now
            <ArrowRight size={13} />
          </span>
        </div>

        {warrantyShort && (
          <p className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-gray-500">
            <ShieldCheck size={12} className="text-green-500 shrink-0" />
            {warrantyShort} Warranty
          </p>
        )}
      </div>
    </div>
  );
};

/* ── Spotlight Animations ────────────────────────────────────── */
const SpotlightStyles = () => (
  <style>{`
    @keyframes spot-glow {
      0%, 100% { transform: scale(1) translate(0, 0); opacity: 1; }
      33% { transform: scale(1.25) translate(12px, -10px); opacity: 0.7; }
      66% { transform: scale(0.9) translate(-10px, 8px); opacity: 1; }
    }
    @keyframes spot-bob {
      0%, 100% { transform: translateY(0); opacity: 0.5; }
      50% { transform: translateY(-16px); opacity: 1; }
    }
    @keyframes spot-pulse {
      0%, 100% { transform: translateX(-50%) scale(1); box-shadow: 0 0 0 0 rgba(15,23,42,0.4); }
      50% { transform: translateX(-50%) scale(1.06); box-shadow: 0 0 0 6px rgba(15,23,42,0); }
    }
    @keyframes spot-nudge {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(4px); }
    }
    @keyframes spot-shine-sweep {
      0% { transform: translateX(-120%) skewX(-20deg); }
      100% { transform: translateX(220%) skewX(-20deg); }
    }
    .spot-shine::after {
      content: "";
      position: absolute;
      inset: 0;
      width: 50%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
      transform: translateX(-120%) skewX(-20deg);
    }
    .spot-shine:hover::after {
      animation: spot-shine-sweep 0.9s ease;
    }
    .spotlight-shimmer-text {
      background: linear-gradient(110deg, #0f172a 25%, #2563eb 45%, #7c3aed 55%, #0f172a 75%);
      background-size: 220% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      color: transparent;
      animation: spotlight-shimmer 5s linear infinite;
    }
    @keyframes spotlight-shimmer {
      0% { background-position: 220% 0; }
      100% { background-position: -220% 0; }
    }
    .animate-spin-slow {
      animation: spotlight-spin 6s linear infinite;
    }
    @keyframes spotlight-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `}</style>
);

/* ── Loading Skeleton ────────────────────────────────────────── */
const SpotlightSkeleton = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      <div className="text-center mb-8 md:mb-10">
        <div className="mx-auto h-3 w-32 rounded-full bg-slate-100 animate-pulse" />
        <div className="mx-auto mt-3 h-7 w-44 rounded-lg bg-slate-100 animate-pulse" />
        <div className="mx-auto mt-3 h-3 w-56 rounded-full bg-slate-100 animate-pulse" />
      </div>
      <div className="grid lg:grid-cols-5 gap-5 md:gap-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 md:gap-5">
          <div className="rounded-2xl bg-slate-100 animate-pulse aspect-[4/3]" />
          <div className="rounded-2xl bg-slate-100 animate-pulse aspect-[4/3]" />
        </div>
        <div className="lg:col-span-3 rounded-3xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-pulse" />
      </div>
    </section>
  );
};

export default Spotlight;
