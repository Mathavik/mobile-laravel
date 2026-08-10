import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Smartphone } from "lucide-react";
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="bg-[#f8fafc] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
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
          <button
            onClick={() => navigate("/mobiles")}
            className="inline-flex items-center gap-1 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 transition shadow-md shadow-[#2563eb]/20"
          >
            View All
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.slice(0, 8).map((category, index) => (
            <button
              key={category.id}
              onClick={() => navigate(`/mobiles?category_id=${category.id}`)}
              className="group relative rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden text-left"
            >
              <div className="aspect-[16/9] bg-gray-50 overflow-hidden">
                <img
                  src={resolveMediaUrl(category.image_src || category.image) || FALLBACK_IMAGE}
                  alt={category.name || "Category"}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-[#2563eb]/10 text-[#2563eb] group-hover:bg-gradient-to-br group-hover:from-[#2563eb] group-hover:to-[#7c3aed] group-hover:text-white transition">
                    <Smartphone size={13} />
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {category.name}
                  </span>
                </span>
                <ChevronRight size={16} className="text-[#2563eb] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Categories;
