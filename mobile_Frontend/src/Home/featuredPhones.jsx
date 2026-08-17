import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Cpu, Battery, Camera, Monitor, HardDrive, Smartphone, ChevronRight } from "lucide-react";
import api from "../services/api";
import { resolveMediaUrl } from "../services/api";
import { formatCurrency } from "../utils/formatters";

function SpecFlipCard({ product, index, delay }) {
  const [flipped, setFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const discount =
    product.mrp &&
    product.price &&
    Number(product.mrp) > Number(product.price)
      ? Math.round(
          ((Number(product.mrp) - Number(product.price)) /
            Number(product.mrp)) *
            100
        )
      : 0;

  const specs = [
    { icon: Monitor, label: "Display", value: product.display_size || "—" },
    { icon: Cpu, label: "Processor", value: product.processor || "—" },
    { icon: HardDrive, label: "Storage", value: product.internal_storage || "—" },
    { icon: Smartphone, label: "RAM", value: product.ram || "—" },
    { icon: Camera, label: "Camera", value: product.rear_camera || "—" },
    { icon: Battery, label: "Battery", value: product.battery_capacity || "—" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative w-[260px] sm:w-[280px] h-[380px] sm:h-[400px] flex-shrink-0 cursor-pointer"
      style={{ perspective: 1000 }}
      onMouseEnter={() => !isMobile && setFlipped(true)}
      onMouseLeave={() => !isMobile && setFlipped(false)}
      onClick={() => {
        if (isMobile) {
          setFlipped((f) => !f);
        } else {
          navigate(`/product/${product.id}`);
        }
      }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* ===== FRONT ===== */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md">
              −{discount}%
            </div>
          )}

          {/* Swipe hint */}
          <div className="absolute bottom-4 right-4 z-10 bg-gray-900/70 backdrop-blur-sm text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="inline-block animate-pulse">👆</span> {isMobile ? "Tap" : "Hover"} for specs
          </div>

          {/* Image area */}
          <div className="h-[240px] sm:h-[260px] flex items-center justify-center p-5 bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <img
              src={resolveMediaUrl(product.image)}
              alt={product.product_name}
              className="w-full h-full object-contain drop-shadow-lg"
              onError={(e) => {
                e.target.src =
                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500";
              }}
            />
          </div>

          {/* Info */}
          <div className="px-5 pb-5 pt-3">
            <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
              {product.product_name}
            </h3>
            <p className="text-lg font-extrabold text-gray-900 mt-1.5">
              {formatCurrency(product.price)}
              {product.mrp &&
                Number(product.mrp) > Number(product.price) && (
                  <span className="text-xs text-gray-400 line-through font-normal ml-2">
                    {formatCurrency(product.mrp)}
                  </span>
                )}
            </p>
          </div>
        </div>

        {/* ===== BACK (SPECS) ===== */}
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#7c3aed] text-white shadow-[0_4px_24px_rgba(37,99,235,0.2)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Decorative grid pattern */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative h-full flex flex-col p-5">
            {/* Header */}
            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-widest font-semibold text-blue-200 mb-1">
                Full Specifications
              </div>
              <h3 className="text-sm font-bold text-white line-clamp-1">
                {product.product_name}
              </h3>
            </div>

            {/* Specs grid */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3">
              {specs.map((spec, i) => (
                <div key={i}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <spec.icon size={11} className="text-blue-300" />
                    <span className="text-[10px] text-blue-300 font-medium uppercase tracking-wider">
                      {spec.label}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Bottom */}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-base font-extrabold text-white">
                {formatCurrency(product.price)}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/product/${product.id}`);
                }}
                className="flex items-center gap-1 text-xs font-semibold text-blue-200 hover:text-white transition-colors"
              >
                View Details <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FeaturedPhones() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const res = await api.get("/shop/products", {
          params: { sort: "popular", per_page: 6, page: 1 },
        });
        if (cancelled) return;
        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        setProducts(list.filter((p) => p.image));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-7 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex gap-5 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[280px] h-[400px] bg-gray-100 rounded-3xl animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="bg-white py-14 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-end justify-between flex-wrap gap-3"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
              Discover & Compare
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Featured Phones
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Tap or hover to reveal full specifications
            </p>
          </div>
          <button
            onClick={() => navigate("/mobiles")}
            className="inline-flex items-center gap-1 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 transition shadow-md shadow-[#2563eb]/20"
          >
            View All <ChevronRight size={16} />
          </button>
        </motion.div>
      </div>

      {/* Scrollable card strip */}
      <div className="flex gap-5 overflow-x-auto pb-4 px-4 sm:px-6 scrollbar-hide snap-x snap-mandatory"
        style={{
          paddingLeft: "max(1rem, calc((100vw - 80rem) / 2 + 1rem))",
          paddingRight: "2rem",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {products.map((product, i) => (
          <div key={product.id} className="snap-start">
            <SpecFlipCard
              product={product}
              index={i}
              delay={i * 0.08}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default FeaturedPhones;
