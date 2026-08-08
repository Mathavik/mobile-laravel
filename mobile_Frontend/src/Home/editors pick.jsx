// EditorsPick.jsx
// "EDITOR'S PICK" luxury homepage section.
// Banners are loaded dynamically from the `home_page_banners` backend module.
// Only ACTIVE banners are fetched, then purely rendered in the server's
// `display_order` (ascending) sequence. Only the first 2 are shown.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { resolveMediaUrl, FALLBACK_IMAGE } from "../services/api";

const SHOW_LIMIT = 2;

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
      navigate(`/bridal-lehenga?category_id=${banner.collection_id}`);
    } else {
      navigate("/bridal-lehenga");
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
    return (
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 py-10">
          <p className="text-lg mb-1">Editor's Picks coming soon</p>
          <p className="text-sm">Add banners from the Home Page Banners section.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {banners.map((banner) => {
            const image = resolveMediaUrl(banner.image_url) || FALLBACK_IMAGE;
            return (
              <div
                key={banner.id}
                className="relative overflow-hidden group cursor-pointer rounded-lg bg-[#f7f3ed]"
                onClick={() => openCollection(banner)}
              >
                {/* Banner image with zoom on hover */}
                <div className="aspect-[4/5] sm:aspect-[16/11] lg:aspect-[3/2] overflow-hidden">
                  <img
                    src={image}
                    alt={banner.banner_name || "Editor's Pick"}
                    className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                {/* Soft dark overlay for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* Title + SHOP NOW (bottom-left) */}
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col items-start">
                  <h2 className="text-white font-serif text-3xl md:text-4xl lg:text-[42px] leading-tight mb-5 tracking-wide drop-shadow-lg">
                    {banner.banner_name || "Editor's Pick"}
                  </h2>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCollection(banner);
                    }}
                    className="bg-white text-[#181818] font-semibold uppercase tracking-[3px] text-xs md:text-sm px-8 py-3 transition-all duration-300 hover:bg-black hover:text-white hover:scale-[1.03] active:scale-[0.98] shadow-md"
                  >
                    SHOP NOW
                  </button>
                </div>
              </div>
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
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] sm:aspect-[16/11] lg:aspect-[3/2] rounded-lg bg-gradient-to-r from-[#f2ede5] via-[#e7ddcd] to-[#f2ede5] animate-pulse"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorsPick;