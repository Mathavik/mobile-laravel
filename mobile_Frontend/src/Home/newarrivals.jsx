import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../utils/toast";

function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { guestId, refreshCounts, wishlistItems, incrementWishlistCount } = useStore();
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const fetchNewArrivals = async () => {
      try {
        const res = await api.get("/shop/products", {
          params: {
            sort: "newest",
            per_page: 4,
            page: 1,
          },
        });

        const payload = res.data?.data || res.data;
        const list = Array.isArray(payload) ? payload : payload?.data || [];

        if (cancelled) return;

        if (res.data?.success || res.data?.status) {
          setProducts(list);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error fetching new arrivals:", err);
        if (cancelled) return;
        setError("Failed to load new arrivals");
        setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchNewArrivals();

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => products.slice(0, 4), [products]);

  const wishlistIds = useMemo(
    () => new Set(wishlistItems.map((item) => item.product_id)),
    [wishlistItems]
  );

  const addToCart = async (product) => {
    if (!user) {
      showToast("Please log in to add items to cart", "error");
      setTimeout(() => navigate("/login"), 500);
      return;
    }
    try {
      const response = await api.post("/shop/cart", {
        user_id: user?.id || 0,
        product_id: product.id,
        quantity: 1,
        price: product.offer_price || product.price,
      });
      await refreshCounts();
      if (response.data?.success || response.data?.status) {
        showToast("Added to cart successfully", "success");
      } else {
        showToast(response.data?.message || "Unable to add to cart", "error");
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
      await refreshCounts();
      showToast("Add to cart failed. Please try again.", "error");
    }
  };

  const toggleWishlist = async (product) => {
    if (!user) {
      showToast("Please log in to add items to wishlist", "error");
      setTimeout(() => navigate("/login"), 500);
      return;
    }
    const existingItem = wishlistItems.find((item) => item.product_id === product.id);
    try {
      if (existingItem) {
        const response = await api.delete(`/shop/wishlist/${existingItem.id}`, {
          params: { user_id: user?.id || 0 },
        });
        if (response.data?.success || response.data?.status) {
          await refreshCounts();
          showToast("Removed from wishlist", "success");
        }
        return;
      }
      const response = await api.post("/shop/wishlist", {
        user_id: user?.id || 0,
        product_id: product.id,
      });
      if (response.data?.success || response.data?.status) {
        incrementWishlistCount(1);
        await refreshCounts();
        showToast("Added to wishlist", "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Something went wrong", "error");
    }
  };

  if (loading) {
    return (
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-white py-14">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader />
          <div className="text-center text-red-500 py-10">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
              Just Landed
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
              New Arrivals
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              The latest smartphones just landed
            </p>
          </div>
          <button
            onClick={() => navigate("/mobiles")}
            className="inline-flex items-center gap-1 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 transition shadow-md shadow-[#2563eb]/20"
          >
            View All →
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-lg">No products available yet</p>
            <p className="text-sm">New products will appear here soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {cards.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={() => navigate(`/product/${product.id}`)}
                onAddToCart={(prod) => addToCart(prod)}
                onAddToWishlist={(prod) => toggleWishlist(prod)}
                isWishlisted={wishlistIds.has(product.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="mb-8">
      <span className="text-xs font-semibold uppercase tracking-widest text-[#2563eb]">
        Just Landed
      </span>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
        New Arrivals
      </h2>
      <p className="text-sm text-gray-500 mt-1">
        The latest smartphones just landed
      </p>
    </div>
  );
}

export default NewArrivals;
