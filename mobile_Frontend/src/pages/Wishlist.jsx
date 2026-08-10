import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Trash2, MoveRight, Sparkles, ArrowLeft } from "lucide-react";
import { formatCurrency } from "../utils/formatters";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../utils/toast";
import api from "../services/api";
import ProductMedia from "../components/ProductMedia";

export default function Wishlist() {
  const { guestId, wishlistItems, refreshCounts } = useStore();
  const { user } = useAuth();
  const [items, setItems] = useState(wishlistItems);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  useEffect(() => {
    setItems(wishlistItems);
  }, [wishlistItems]);

  const removeItem = async (id) => {
    try {
      const response = await api.delete(`/shop/wishlist/${id}`, { params: { user_id: user?.id || 0 } });
      const isSuccess = response.data?.success || response.data?.status;

      if (isSuccess) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        await refreshCounts();
        showToast("Removed from wishlist", "success");
      } else {
        showToast(response.data?.message || "Unable to remove item", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Unable to remove item", "error");
    }
  };

  const moveToCart = async (product) => {
    try {
      const response = await api.post("/shop/wishlist/move-to-cart", {
        user_id: user?.id || 0,
        wishlist_id: product.id,
        product_id: product.product_id,
        quantity: 1,
        price: product.offer_price || product.price,
        size: product.size || "",
      });
      const isSuccess = response.data?.success || response.data?.status;

      if (isSuccess) {
        setItems((prev) => prev.filter((item) => item.id !== product.id));
        await refreshCounts();
        showToast("Moved to cart successfully", "success");
      } else {
        showToast(response.data?.message || "Unable to move item to cart", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Unable to move item to cart", "error");
    }
  };

  const moveAllToCart = async () => {
    for (const item of items) {
      await moveToCart(item);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">Favorites</p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0f172a]">
              Wishlist
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {items.length} {items.length === 1 ? 'item' : 'items'} in your wishlist
            </p>
          </div>
          
          {items.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <Link 
                to="/" 
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-slate-50 hover:border-[#2563eb]/40 transition"
              >
                <ArrowLeft size={16} /> Continue Shopping
              </Link>
              <button 
                onClick={moveAllToCart}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full text-sm font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30"
              >
                <ShoppingBag size={16} /> Move All to Cart
              </button>
            </div>
          )}
        </div>
        
        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl bg-white p-12 text-center ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 flex items-center justify-center">
                <Heart size={32} className="text-[#2563eb]" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-700">Your wishlist is empty</h3>
            <p className="text-gray-400 mt-2">Start adding your favorite items to your wishlist</p>
            <Link 
              to="/" 
              className="mt-6 inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full font-semibold hover:opacity-90 transition shadow-lg shadow-[#2563eb]/30"
            >
              <ShoppingBag size={18} /> Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
              {items.map((item) => (
                <div key={item.id} className="group rounded-2xl bg-white ring-1 ring-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_50px_rgba(37,99,235,0.16)] hover:ring-[#2563eb]/20 transition-all duration-300 overflow-hidden">
                  {/* Image Container */}
                  <div className="relative overflow-hidden bg-[#f8fafc] aspect-square">
                    <ProductMedia
                      product={item}
                      image={item.image}
                      video={item.video_url}
                      alt={item.product_name}
                      className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Wishlist badge */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-[#2563eb] shadow-sm flex items-center gap-1">
                        <Heart size={12} fill="#2563eb" className="text-[#2563eb]" /> 
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#0f172a] line-clamp-2">
                          {item.product_name}
                        </h3>
                        {item.size && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-400">Size</span>
                            <span className="text-xs font-medium bg-[#2563eb]/5 border border-[#2563eb]/20 text-[#2563eb] px-2 py-0.5 rounded-full">
                              {item.size}
                            </span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)} 
                        className="text-gray-300 hover:text-red-500 transition p-1 hover:bg-red-50 rounded-full flex-shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#2563eb]">
                        {formatCurrency(item.offer_price || item.price)}
                      </span>
                      <button 
                        onClick={() => moveToCart(item)}
                        className="text-[10px] xs:text-[11px] sm:text-xs bg-[#0f172a] text-white px-2 xs:px-2.5 sm:px-4 py-1.5 rounded-full hover:bg-[#1e293b] transition flex items-center gap-1 font-semibold"
                      >
                        <ShoppingBag size={12} /> Move to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}