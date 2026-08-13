// Celebration.jsx
// "DEALS OF THE DAY" homepage section.
// The banner is loaded dynamically from the `celebration_banners` backend
// module. Only ACTIVE banners are fetched, ordered by `display_order`
// (ascending), and the first one is rendered.
import { useEffect, useState } from "react";
import api, { resolveMediaUrl, FALLBACK_IMAGE } from "../services/api";

function Celebration() {
  const [banner, setBanner] = useState(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadBanner = async () => {
      try {
        const res = await api.get("celebration-banners/get_active");
        if (!cancelled && res.data.status && Array.isArray(res.data.data)) {
          setBanner(res.data.data[0] || null);
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadBanner();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner) return null;

  const image = imgFailed || !banner.image_url ? FALLBACK_IMAGE : resolveMediaUrl(banner.image_url);

  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
              Limited Time
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              Deals of the Day
            </h2>
          </div>
        </div>
        <div
          className="relative h-[220px] xs:h-[260px] sm:h-[320px] md:h-[380px] bg-cover bg-center overflow-hidden rounded-3xl"
          style={{
            backgroundImage: `url("${image}")`,
          }}
        >
          <img
            src={resolveMediaUrl(banner.image_url) || FALLBACK_IMAGE}
            alt={banner.banner_name || "Deals of the Day"}
            style={{ display: "none" }}
            onError={() => setImgFailed(true)}
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent"></div>

          <div className="relative z-10 flex flex-col items-start justify-center h-full px-6 sm:px-12 max-w-xl">
            <h2 className="text-white text-xl min-[400px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-left mb-6 md:mb-8 drop-shadow-lg leading-tight">
              {banner.banner_name || "Deals of the Day"}
            </h2>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Celebration;
