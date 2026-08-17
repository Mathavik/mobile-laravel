import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../services/api";

const GRADIENTS = [
  "from-[#2563eb] to-[#3b82f6]",
  "from-[#7c3aed] to-[#a855f7]",
  "from-[#06b6d4] to-[#22d3ee]",
  "from-[#f59e0b] to-[#f97316]",
  "from-[#ef4444] to-[#f97316]",
  "from-[#10b981] to-[#34d399]",
  "from-[#ec4899] to-[#f472b6]",
  "from-[#8b5cf6] to-[#c084fc]",
  "from-[#14b8a6] to-[#2dd4bf]",
  "from-[#f43f5e] to-[#fb7185]",
  "from-[#0ea5e9] to-[#38bdf8]",
  "from-[#84cc16] to-[#a3e635]",
];

function TopBrands() {
  const [brands, setBrands] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const companyId = localStorage.getItem("selected_company_id") || "1";

        const [brandsRes, productsRes] = await Promise.all([
          api.get("/brand/get_active_brand", { params: { company_id: companyId } }),
          api.get("/shop/products", { params: { per_page: 200, page: 1 } }),
        ]);

        if (cancelled) return;

        const brandList = brandsRes.data?.data || [];
        const productPayload = productsRes.data?.data || productsRes.data;
        const productList = Array.isArray(productPayload)
          ? productPayload
          : productPayload?.data || [];

        const counts = {};
        productList.forEach((p) => {
          if (p.brand_id) {
            counts[p.brand_id] = (counts[p.brand_id] || 0) + 1;
          }
        });

        const merged = brandList.map((b) => ({
          ...b,
          productCount: counts[b.id] || 0,
        }));

        setBrands(merged);
        setProductCounts(counts);
      } catch (err) {
        console.error("Error fetching brands:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const displayBrands = useMemo(() => brands.slice(0, 12), [brands]);

  if (loading) {
    return (
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
            <div className="h-7 w-52 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 rounded-full bg-gray-100 animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                <div className="h-2.5 w-10 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (displayBrands.length === 0) return null;

  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex items-end justify-between mb-8 flex-wrap gap-3"
        >
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
              Trending Brands
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Top Mobile Brands
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Explore by your favourite brand
            </p>
          </div>
          <button
            onClick={() => navigate("/mobiles")}
            className="inline-flex items-center gap-1 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 transition shadow-md shadow-[#2563eb]/20"
          >
            View All →
          </button>
        </motion.div>

        {/* Brand Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-5 sm:gap-6">
          {displayBrands.map((brand, i) => (
            <motion.button
              key={brand.id}
              type="button"
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.45,
                delay: i * 0.06,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              whileHover={{ y: -8, scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/mobiles?brand_id=${brand.id}`)}
              className="group flex flex-col items-center gap-2.5 cursor-pointer"
            >
              {/* Brand Circle */}
              <div
                className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br ${
                  GRADIENTS[i % GRADIENTS.length]
                } flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(37,99,235,0.35)] group-hover:scale-105`}
              >
                {/* Shine sweep on hover */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                </div>
                <span className="relative text-white text-2xl sm:text-3xl font-bold tracking-tight select-none">
                  {brand.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>

              {/* Brand Name */}
              <span className="text-xs sm:text-sm font-semibold text-gray-800 group-hover:text-[#2563eb] transition-colors duration-200 text-center truncate w-full">
                {brand.name}
              </span>

              {/* Product Count */}
              <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                {brand.productCount} {brand.productCount === 1 ? "product" : "products"}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopBrands;
