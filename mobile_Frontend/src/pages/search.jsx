import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../utils/toast";
import api from "../services/api"; // 👈 Import the axios instance

// Removed: const API_BASE = "http://localhost/bridal-boutique/Bridal-Boutique-backend/api";

const parseQuery = (search) => {
  const params = new URLSearchParams(search);
  return {
    q: params.get("q") || "",
    category_id: params.get("category_id") || "",
    min_price: params.get("min_price") || "",
    max_price: params.get("max_price") || "",
    availability: params.get("availability") || "",
    sort: params.get("sort") || "",
  };
};

export default function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const { guestId, refreshCounts, wishlistItems, incrementWishlistCount } = useStore();
  const { user } = useAuth();
  const { q, category_id, min_price, max_price, availability, sort } = useMemo(
    () => parseQuery(location.search),
    [location.search]
  );

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(category_id);
  const [priceRange, setPriceRange] = useState({ min: min_price, max: max_price });
  const [selectedAvailability, setSelectedAvailability] = useState(availability);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/shop/products/filters");
        const payload = response.data?.data || response.data;
        if (response.data?.success || response.data?.status) {
          setCategories(payload?.categories || []);
        }
      } catch (error) {
        console.error("Unable to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(category_id);
    setPriceRange({ min: min_price, max: max_price });
    setSelectedAvailability(availability);
    setSelectedSort(sort);
  }, [q, category_id, min_price, max_price, availability, sort]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const controller = new AbortController();
      abortRef.current?.abort?.();
      abortRef.current = controller;
      try {
        const response = await api.get("/search/products", {
          params: {
            q: q || "",
            category_id: selectedCategory || 0,
            min_price: priceRange.min || "",
            max_price: priceRange.max || "",
            availability: selectedAvailability || "",
            sort: selectedSort || "",
            per_page: 24,
          },
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const payload = response.data?.data || response.data;
        const list = Array.isArray(payload) ? payload : payload?.data || [];
        if (response.data?.success || response.data?.status) {
          setProducts(list);
        } else {
          setProducts([]);
        }
      } catch (error) {
        if (error.code === "ERR_CANCELED" || controller.signal.aborted) return;
        console.error("Search request failed:", error);
        setProducts([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchResults();

    return () => {
      abortRef.current?.abort?.();
    };
  }, [q, selectedCategory, priceRange.min, priceRange.max, selectedAvailability, selectedSort]);

  const updateQuery = (updates) => {
    const params = new URLSearchParams(location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value || value === 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    navigate({ pathname: "/search", search: params.toString() });
  };

  const handleAddToCart = async (product, size = "") => {
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
        size,
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

  const wishlistIds = useMemo(
    () => new Set(wishlistItems.map((item) => item.product_id)),
    [wishlistItems]
  );

  const isWishlisted = (product) => wishlistIds.has(product.id);

  const handleAddToWishlist = async (product, size = "") => {
    if (!user) {
      showToast("Please log in to add items to wishlist", "error");
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    try {
      const response = await api.post("/shop/wishlist", {
        user_id: user?.id || 0,
        product_id: product.id,
        size,
      });
      if (response.data?.success || response.data?.status) {
        incrementWishlistCount(1);
        await refreshCounts();
        showToast("Added to wishlist successfully", "success");
      } else {
        showToast(response.data?.message || "Unable to add to wishlist", "error");
      }
    } catch (error) {
      console.error("Add to wishlist failed:", error);
      showToast("Add to wishlist failed. Please try again.", "error");
    }
  };

  const handleClearAll = () => {
    updateQuery({
      category_id: "",
      min_price: "",
      max_price: "",
      availability: "",
      sort: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-[116px] lg:pt-[156px] px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
    
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#2563eb]">Search</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0f172a]">Search Results</h1>
              <p className="text-gray-500 mt-1.5">Showing {products.length} result{products.length !== 1 ? "s" : ""} for "{q || ""}"</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/30 transition hover:opacity-90 md:hidden"
              onClick={() => setShowMobileFilters(true)}
            >
              Filters
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:grid grid-cols-1 gap-3 xl:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(180px,1fr)_minmax(180px,1fr)_auto] mt-4">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => updateQuery({ category_id: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Price</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                  onBlur={() => updateQuery({ min_price: priceRange.min })}
                  placeholder="Min"
                  className="w-full rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                  onBlur={() => updateQuery({ max_price: priceRange.max })}
                  placeholder="Max"
                  className="w-full rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Availability</label>
              <select
                value={selectedAvailability}
                onChange={(e) => updateQuery({ availability: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
              >
                <option value="">All</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Sort By</label>
              <select
                value={selectedSort}
                onChange={(e) => updateQuery({ sort: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
              >
                <option value="">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center justify-end rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={handleClearAll}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0f172a] transition hover:bg-slate-50 hover:border-[#2563eb] hover:text-[#2563eb]"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Mobile Filters */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm p-4 md:hidden">
              <div className="h-full overflow-y-auto rounded-[24px] bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-[#0f172a]">Filters</p>
                    <p className="text-sm text-gray-500">Adjust your search criteria</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="text-sm font-semibold text-gray-600"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => updateQuery({ category_id: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      <option value="">All Categories</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Price</label>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                        onBlur={() => updateQuery({ min_price: priceRange.min })}
                        placeholder="Min"
                        className="w-full rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                        onBlur={() => updateQuery({ max_price: priceRange.max })}
                        placeholder="Max"
                        className="w-full rounded-xl border border-slate-200 bg-[#fafafa] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Availability</label>
                    <select
                      value={selectedAvailability}
                      onChange={(e) => updateQuery({ availability: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      <option value="">All</option>
                      <option value="in_stock">In Stock</option>
                      <option value="out_of_stock">Out of Stock</option>
                    </select>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <label className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Sort By</label>
                    <select
                      value={selectedSort}
                      onChange={(e) => updateQuery({ sort: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      <option value="">Newest</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#0f172a] transition hover:bg-slate-50"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#2563eb]/30 transition hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-96 rounded-2xl bg-white animate-pulse ring-1 ring-slate-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563eb]/10 to-[#7c3aed]/10 flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-[#2563eb]" />
            </div>
            <p className="text-gray-600 font-semibold">No products found for "{q}"</p>
            <button
              type="button"
              onClick={() => navigate("/mobiles")}
              className="mt-5 px-6 py-2.5 bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white rounded-full text-sm font-semibold shadow-lg shadow-[#2563eb]/30 hover:opacity-90 transition"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={() => navigate(`/product/${product.id}`)}
                onAddToCart={(prod, size) => handleAddToCart(prod, size)}
                onAddToWishlist={(prod, size) => handleAddToWishlist(prod, size)}
                isWishlisted={isWishlisted(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}