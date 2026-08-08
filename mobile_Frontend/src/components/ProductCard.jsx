import { useEffect, useMemo, useState } from "react";
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
  const availableSizes = useMemo(() => {
    if (!product?.available_sizes) return [];
    return product.available_sizes
      .split(/[,;|]/)
      .map((size) => size.trim())
      .filter(Boolean);
  }, [product]);

  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || "");

  useEffect(() => {
    if (availableSizes.length > 0) {
      setSelectedSize((prev) => prev || availableSizes[0]);
    } else {
      setSelectedSize("");
    }
  }, [availableSizes]);

  const isOutOfStock = Number(product.stock) <= 0;

  // 🎬 Whether this product has a product video (drives the "Video" badge).
  const hasVideo = !!product?.video_url;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col">
      {/* Image Section */}
      <button
        type="button"
        onClick={onNavigate}
        className="block w-full text-left relative"
      >
        <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#f8f8f8]">
          {/* Wishlist Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToWishlist(product, selectedSize);
            }}
            className={`absolute top-3 right-3 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              isWishlisted
                ? "bg-red-500 text-white scale-110"
                : "bg-white text-gray-700 hover:bg-red-50 hover:scale-110"
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
            <div className="absolute top-3 left-3 z-20 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
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
          <span className="font-bold text-base sm:text-lg text-gray-900 whitespace-nowrap">
            {formatCurrency(product.offer_price || product.price)}
          </span>

          {product.offer_price && (
            <span className="line-through text-gray-400 text-xs sm:text-sm">
              {formatCurrency(product.price)}
            </span>
          )}

          {product.offer_price && (
            <span className="text-[#a97c50] text-xs sm:text-sm font-semibold">
              {getDiscountPercent(product.price, product.offer_price)}% off
            </span>
          )}
        </div>

        {/* Rating and Stock */}
        <div className="mt-2 sm:mt-3 flex items-center justify-between flex-wrap gap-1">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="bg-green-600 text-white text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center gap-1">
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

        {/* Size Selection - Only show if in stock */}
        {!isOutOfStock && availableSizes.length > 0 && (
          <div className="mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[10px] sm:text-xs text-gray-500">Size:</span>
            {availableSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`text-[10px] sm:text-xs px-2 sm:px-3 py-1 rounded-full border transition-all duration-200 ${
                  selectedSize === size
                    ? "border-blue-500 bg-blue-50 text-blue-600 font-semibold"
                    : "border-gray-300 hover:border-gray-400 text-gray-600"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => onAddToCart(product, selectedSize)}
          className={`mt-3 sm:mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-2 sm:py-2.5 text-xs sm:text-sm text-white font-medium transition-all duration-300 ${
            isOutOfStock
              ? "bg-gray-400 cursor-not-allowed opacity-60"
              : "bg-[#181818] hover:bg-black hover:shadow-lg active:scale-95"
          }`}
        >
          <ShoppingBag size={16} />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}