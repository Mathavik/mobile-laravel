import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import api, { resolveMediaUrl, FALLBACK_IMAGE } from "../services/api";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="bg-[#f8fafc] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-40 sm:w-44 shrink-0 flex flex-col items-center gap-3"
              >
                <div className="w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-4 w-20 rounded bg-gray-200 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  const loopItems = [...categories, ...categories];

  return (
    <section className="bg-[#f8fafc] py-12 overflow-hidden">
      <style>{`
        .cat-marquee-track {
          display: flex;
          width: max-content;
          animation: cat-marquee 30s linear infinite;
        }
        .cat-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes cat-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
              Brands We Sell
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Shop by Brand
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Explore our exclusive mobile brand collections
            </p>
          </div>
          {/* <button
            onClick={() => navigate("/mobiles")}
            className="inline-flex items-center gap-1 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 transition shadow-md shadow-[#2563eb]/20"
          >
            View All
            <ChevronRight size={16} />
          </button> */}
        </div>

        <div className="relative">
          {/* Edge fade masks */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-14 md:w-24 bg-gradient-to-r from-[#f8fafc] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-14 md:w-24 bg-gradient-to-l from-[#f8fafc] to-transparent z-10" />

          {/* Auto-scroll row */}
          <div className="cat-marquee-track gap-6 md:gap-10 py-2">
            {loopItems.map((category, index) => (
              <button
                key={`${category.id}-${index}`}
                onClick={() => navigate(`/mobiles?category_id=${category.id}`)}
                className="group flex flex-col items-center gap-3 text-center shrink-0 w-40 sm:w-44"
              >
                <span className="relative w-40 h-40 sm:w-44 sm:h-44 rounded-full overflow-hidden bg-white ring-4 ring-white shadow-lg shadow-[#2563eb]/10 group-hover:shadow-xl group-hover:shadow-[#2563eb]/20 group-hover:-translate-y-1 transition-all duration-300">
                  <img
                    src={resolveMediaUrl(category.image_src || category.image) || FALLBACK_IMAGE}
                    alt={category.name || "Category"}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 group-hover:text-[#2563eb] transition">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Categories;
