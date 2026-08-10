import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      {/* ── Section Header ─────────────────────────────── */}
      <div className="text-center mb-8 md:mb-10">
        <span className="inline-block text-xs font-semibold uppercase tracking-widest text-[#2563eb] mb-2">
          Hand-Picked For You
        </span>
        <h2 className="text-center text-2xl xs:text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-3">
          Featured Phones
        </h2>
        <p className="text-sm text-gray-500">Hand-picked smartphones you'll love</p>
      </div>

      {!data ? (
        /* ── Empty state ─────────────────────────────── */
        <p className="text-center text-gray-400">
          Select a spotlight category from the admin panel.
        </p>
      ) : (
        <div className="grid lg:grid-cols-5 gap-5 md:gap-6 items-stretch">
          {/* ── LEFT: 2 latest products ───────────────── */}
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3 md:gap-4">
            {data.products?.length ? (
              data.products.slice(0, 2).map((product) => (
                <SpotlightProductCard
                  key={product.id}
                  product={product}
                  onOpen={() => openProduct(product.id)}
                />
              ))
            ) : (
              <div className="sm:col-span-2 flex items-center justify-center border border-dashed border-gray-300 text-gray-400 text-sm p-8">
                New arrivals coming soon.
              </div>
            )}
          </div>

          {/* ── RIGHT: Category ───────────────────────── */}
          <div
            onClick={openCategory}
            className="lg:col-span-3 relative overflow-hidden bg-[#0f172a] cursor-pointer group/cat min-h-[280px] sm:min-h-[360px] md:min-h-[420px] rounded-3xl"
          >
            <img
              src={resolveMediaUrl(data.image_src || data.image) || FALLBACK_IMAGE}
              alt={data.category_name || "Category"}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover/cat:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />

            <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 md:pb-16">
              {/* Title */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl text-white tracking-wide text-center mb-6 md:mb-8 font-bold">
                Power Meets Performance
              </h2>

              {/* SHOP NOW button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openCategory();
                }}
                className="inline-block bg-white text-[#0f172a] text-xs md:text-sm font-semibold uppercase tracking-[4px] px-8 py-3 transition-all duration-300 hover:bg-gradient-to-r hover:from-[#2563eb] hover:to-[#7c3aed] hover:text-white active:scale-[0.98] rounded-full shadow-lg"
              >
                SHOP NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* ── Spotlight Product Card ──────────────────────────────────── */
const SpotlightProductCard = ({ product, onOpen }) => {
  const hasDiscount = Number(product.discount_percentage) > 0;
  const productName = product.product_name || "Smartphone";
  
  // Format price to show without decimals (like in image: 3499690)
  const formatPrice = (price) => {
    if (!price) return "";
    const num = Number(price);
    return Math.round(num).toLocaleString('en-IN');
  };

  return (
    <div
      onClick={onOpen}
      className="group bg-white border border-[#efe7dc] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_12px_30px_-8px_rgba(24,24,24,0.15)] hover:border-[#d9c7ab]"
    >
      {/* Image - Full cover */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#f7f3ed]">
        <ProductMedia
          product={product}
          image={product.image_src || product.image}
          video={product.video_url}
          alt={productName}
          imageClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          videoClassName="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {hasDiscount && (
          <span className="absolute top-3 right-3 bg-[#0f172a] text-[#e9d7bb] text-[10px] font-semibold tracking-[1px] px-3 py-1">
            {product.discount_percentage}% OFF
          </span>
        )}
      </div>

      {/* Details - matching the image style */}
      <div className="p-3 md:p-4 text-center">
        <h4 className="text-sm md:text-base font-medium text-[#0f172a] uppercase tracking-[2px]">
          {productName}
        </h4>

        <div className="mt-1.5 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-base md:text-lg font-semibold text-[#0f172a]">
            {formatPrice(product.offer_price ?? product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.original_price ?? product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Loading Skeleton ────────────────────────────────────────── */
const SpotlightSkeleton = () => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
      <div className="text-center mb-8 md:mb-10">
        <div className="mx-auto h-3 w-32 bg-[#f2ede5] animate-pulse rounded-full" />
        <div className="mx-auto mt-3 h-px w-20 bg-[#f2ede5]" />
      </div>
      <div className="grid lg:grid-cols-5 gap-5 md:gap-6">
        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3 md:gap-4">
          <div className="aspect-[3/4] bg-[#f2ede5] animate-pulse" />
          <div className="aspect-[3/4] bg-[#f2ede5] animate-pulse" />
        </div>
        <div className="lg:col-span-3 bg-gradient-to-r from-[#f2ede5] via-[#e7ddcd] to-[#f2ede5] animate-pulse" />
      </div>
    </section>
  );
};

export default Spotlight;