import { useMemo } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { formatCurrency, getDiscountPercent } from "../utils/formatters";
// 👇 Shared video/image renderer so every page shows the same media
import ProductMedia from "./ProductMedia";
export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  isWishlisted,
  onNavigate,
}) {
  const isOutOfStock = Number(product.stock) <= 0;

  const specs = useMemo(() => {
    const list = [];
    if (product?.ram) list.push(product.ram);
    if (product?.internal_storage) list.push(product.internal_storage);
    if (product?.display_size) list.push(product.display_size);
    return list;
  }, [product]);

  const hasVideo = !!product?.video_url;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(15,23,42,0.06)] ring-1 ring-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(37,99,235,0.16)] hover:ring-[#2563eb]/30">
      {/* Gradient top accent on hover */}
      <div className="absolute inset-x-0 top-0 z-20 h-1 bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#7c3aed] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {/* Image Section */}
      <button
        type="button"
        onClick={onNavigate}
        className="block w-full text-left relative"
      >
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#f8fafc]">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product, selectedSize);
            }}
            className={`absolute top-3 right-3 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-300 ${
              isWishlisted
                ? "bg-gradient-to-br from-[#ef4444] to-[#b91c1c] text-white scale-110"
                : "bg-white/90 text-gray-700 hover:bg-red-50 hover:scale-110"
            }`}
            aria-label="Add to wishlist"
          >
            <Heart
              size={18}
              fill={isWishlisted ? "currentColor" : "none"}
              className="transition-all duration-300"
            />
          </button>

          {/* Video or Image */}
          <div className={`w-full h-full transition-all duration-500 ${isOutOfStock ? "blur-[3px]" : ""}`}>
            <ProductMedia
              product={product}
              image={product.image}
              video={product.video_url}
              alt={product.product_name || "Product"}
              imageClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              videoClassName="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>

          {/* Video Badge */}
          {hasVideo && (
            <div className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg className="w-3 h-3" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Video
            </div>
          )}

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <span className="bg-black/90 text-white px-3 xs:px-4 sm:px-7 py-2 sm:py-3 rounded-md text-xs sm:text-lg font-bold tracking-[1.5px] sm:tracking-[3px] shadow-xl text-center">
                OUT OF STOCK
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Content Section */}
      <div className="p-3 xs:p-3 sm:p-4 md:p-5 flex flex-col flex-1">
        {/* Product Name */}
        <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] sm:min-h-[3.5rem]">
          {product.product_name || "Product"}
        </h3>

        {/* Price */}
        <div className="mt-2 sm:mt-3 flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="font-bold text-base sm:text-lg text-[#0f172a] whitespace-nowrap">
            {formatCurrency(product.offer_price || product.price)}
          </span>

          {product.offer_price && (
            <span className="line-through text-gray-400 text-xs sm:text-sm">
              {formatCurrency(product.price)}
            </span>
          )}

          {product.offer_price && (
            <span className="text-[#2563eb] text-xs sm:text-sm font-semibold">
              {getDiscountPercent(product.price, product.offer_price)}% off
            </span>
          )}
        </div>

        {/* Rating and Stock */}
        <div className="mt-2 sm:mt-3 flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="bg-gradient-to-r from-[#16a34a] to-[#22c55e] text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
              4.8 ★
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500">
              ({product.view_count || 0})
            </span>
          </div>

          <span className={`text-[10px] sm:text-xs font-medium ${isOutOfStock ? "text-red-500" : "text-green-600"}`}>
            {isOutOfStock ? "Out of Stock" : `${product.stock} Left`}
          </span>
        </div>

          {/* Phone Specs */}
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {specs.length > 0 ? (
              specs.map((spec) => (
                <span
                  key={spec}
                  className="text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600"
                >
                  {spec}
                </span>
              ))
            ) : (
              <span className="text-[10px] sm:text-xs text-gray-400">
                No specs listed
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm text-white font-semibold transition-all duration-300 ${
              isOutOfStock
                ? "bg-gray-400 cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:shadow-lg hover:shadow-[#2563eb]/30 hover:opacity-95 active:scale-95"
            }`}
          >
            <ShoppingBag size={16} />
            {isOutOfStock ? "Out of Stock" : "Add to Cart"}
          </button>
      </div>
    </div>
  );
}