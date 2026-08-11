import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, BadgePercent } from "lucide-react";
import api, { resolveMediaUrl, FALLBACK_IMAGE } from "../services/api";

const SHOW_LIMIT = 2;

function BannerSplit() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/home-page-banners/get_active")
      .then((res) => {
        if (!cancelled && res.data?.status) {
          setBanners((res.data.data || []).slice(0, SHOW_LIMIT));
        }
      })
      .catch((err) => console.error("Failed to load split banners:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openBanner = (banner) => {
    if (banner?.collection_id) {
      navigate(`/mobiles?category_id=${banner.collection_id}`);
    } else {
      navigate("/mobiles");
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="grid lg:grid-cols-2 rounded-3xl bg-slate-100 animate-pulse overflow-hidden"
            >
              <div className="aspect-[16/10] bg-slate-200" />
              <div className="p-8 space-y-3">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-8 w-3/4 rounded bg-slate-200" />
                <div className="h-4 w-1/2 rounded bg-slate-200" />
                <div className="h-10 w-32 rounded-full bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {banners.map((banner, index) => {
          const image = resolveMediaUrl(banner.image_url) || FALLBACK_IMAGE;
          const imageFirst = index % 2 === 1;
          return (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl bg-[#0a1122] shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
            >
              {/* Gradient glows */}
              <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-[#2563eb]/30 blur-3xl" />
              <div className="absolute -bottom-24 -right-20 w-72 h-72 rounded-full bg-[#7c3aed]/25 blur-3xl" />

              <div className="relative grid lg:grid-cols-2 items-center">
                {/* IMAGE side */}
                <div
                  className={`relative aspect-[16/10] overflow-hidden cursor-pointer group ${
                    imageFirst ? "lg:order-2" : ""
                  }`}
                  onClick={() => openBanner(banner)}
                >
                  <img
                    src={image}
                    alt={banner.banner_name || "Banner"}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent lg:bg-none" />
                </div>

                {/* CONTENT side */}
                <motion.div
                  initial={{ opacity: 0, x: imageFirst ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                  className={`p-8 sm:p-10 lg:p-14 text-white ${
                    imageFirst ? "lg:order-1" : ""
                  }`}
                >
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-[#60a5fa] backdrop-blur-sm">
                    <Sparkles size={14} /> Featured
                  </span>
                  <h2 className="mt-5 text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
                    {banner.banner_name || "Exclusive Offer"}
                  </h2>
                  <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-md">
                    Hand-picked deals at unbeatable prices. Grab your favorite
                    smartphone today with genuine warranty and fast delivery.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => openBanner(banner)}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-90 text-white text-sm font-semibold px-7 py-3 shadow-xl shadow-[#2563eb]/30 transition"
                    >
                      Shop Now <ArrowRight size={15} />
                    </button>
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <BadgePercent size={14} className="text-[#38bdf8]" /> Up to 20% Off
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default BannerSplit;
