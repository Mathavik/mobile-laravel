// EditorsPick.jsx
// "EDITOR'S PICK" — premium light "featured spotlight" showcase.
// Banners are loaded dynamically from the `home_page_banners` backend module.
// Only ACTIVE banners are fetched, then purely rendered in the server's
// `display_order` (ascending) sequence. Only the first 2 are shown.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  BadgeCheck,
  ShieldCheck,
  Truck,
  Tag,
  Medal,
} from "lucide-react";
import api, { resolveMediaUrl, FALLBACK_IMAGE } from "../services/api";

const SHOW_LIMIT = 2;

const FEATURES = [
  { icon: ShieldCheck, label: "Genuine Warranty" },
  { icon: Truck, label: "Fast Delivery" },
  { icon: Tag, label: "Best Price" },
];

function EditorsPick() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchBanners = async () => {
      setLoading(true);
      try {
        const companyId = localStorage.getItem("selected_company_id") || "1";
        const res = await api.get(`/home-page-banners/get_active?company_id=${companyId}`);

        if (!cancelled && res.data?.status) {
          // Slice defensively even though the API already caps at 2.
          setBanners((res.data.data || []).slice(0, SHOW_LIMIT));
        }
      } catch (err) {
        console.error("Failed to load editor's pick banners:", err);
        if (!cancelled) setError("Failed to load banners");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBanners();
    return () => {
      cancelled = true;
    };
  }, []);

  const openCollection = (banner) => {
    if (banner?.collection_id) {
      navigate(`/mobiles?category_id=${banner.collection_id}`);
    } else {
      navigate("/mobiles");
    }
  };

  if (loading) {
    return <EditorsSkeleton />;
  }

  if (error) {
    return (
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-red-500 py-10">{error}</div>
      </section>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/80 to-white py-16 sm:py-20">
      {/* Soft background accents */}
      <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-[#2563eb]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-24 h-80 w-80 rounded-full bg-[#7c3aed]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section header */}
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 sm:mb-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#2563eb]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#2563eb]">
              <Sparkles size={13} /> Our Experts Recommend
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Editor's{" "}
              <span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">
                Picks
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Top deals our experts recommend — quality, value &amp; performance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/mobiles")}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-[#2563eb]/50 hover:text-[#2563eb]"
          >
            View All
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Spotlight cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {banners.map((banner, index) => {
            const image = resolveMediaUrl(banner.image_url) || FALLBACK_IMAGE;
            const single = banners.length === 1;
            return (
              <motion.article
                key={banner.id}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: index * 0.12, ease: "easeOut" }}
                onClick={() => openCollection(banner)}
                className={`group relative overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(37,99,235,0.14)] hover:ring-[#2563eb]/40 ${
                  single ? "lg:col-span-2" : ""
                }`}
              >
                <div className={`grid sm:grid-cols-2 ${single ? "lg:grid-cols-2" : ""}`}>
                  {/* Image panel */}
                  <div className="relative overflow-hidden bg-slate-100">
                    <div className="aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-[300px] overflow-hidden">
                      <img
                        src={image}
                        alt={banner.banner_name || "Editor's Pick"}
                        className="h-full w-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    </div>

                    {/* Rank badge */}
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0f172a] shadow-sm backdrop-blur">
                      <Medal size={12} className="text-[#f59e0b]" />
                      Pick No. {index + 1}
                    </span>

                    {/* Handpicked chip */}
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-[#2563eb]/30">
                      <BadgeCheck size={12} /> Handpicked
                    </span>
                  </div>

                  {/* Content panel */}
                  <div className="relative flex flex-col justify-center p-6 sm:p-7 lg:p-8">
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2563eb]">
                      Featured Collection
                    </span>
                    <h3 className="mt-2 text-2xl font-bold leading-tight text-gray-900 sm:text-[26px]">
                      {banner.banner_name || "Editor's Pick"}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-gray-500">
                      Curated just for you — a smartphone that balances power,
                      design and everyday value. Explore the collection and grab
                      the deal before it's gone.
                    </p>

                    {/* Feature chips */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {FEATURES.map((feat) => (
                        <span
                          key={feat.label}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600 ring-1 ring-slate-200"
                        >
                          <feat.icon size={13} className="text-[#2563eb]" />
                          {feat.label}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-6 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCollection(banner);
                        }}
                        className="group/btn inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#2563eb]/30 transition-all duration-300 hover:shadow-xl hover:shadow-[#2563eb]/40 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Shop Now
                        <ArrowRight size={15} className="transition-transform group-hover/btn:translate-x-1" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCollection(banner);
                        }}
                        className="text-sm font-semibold text-[#2563eb] underline-offset-4 transition hover:underline"
                      >
                        Explore Collection
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Loading Skeleton ────────────────────────────────────── */
const EditorsSkeleton = () => {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 space-y-3">
          <div className="h-6 w-44 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-9 w-60 rounded-xl bg-slate-100 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-72 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorsPick;
