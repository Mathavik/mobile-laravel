import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../contexts/AuthContext";
import ProductCard from "../components/ProductCard";
import FilterSidebar from "../components/filters/FilterSidebar";
import { showToast } from "../utils/toast";
import { Filter } from "lucide-react";
import api, { resolveMediaUrl } from "../services/api";

export default function Product() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [totalProducts, setTotalProducts] = useState(0);
    const [filterOptions, setFilterOptions] = useState(null);
    const [filters, setFilters] = useState({
        price_min: 0,
        price_max: 1000000,
        sizes: [],
        availability: 'all',
        rating: 0,
        sort_by: 'newest',
        limit: 20,
        offset: 0,
        availableOptions: {}
    });

    const { guestId, refreshCounts, wishlistItems } = useStore();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Get category_id from URL
    const categoryId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const id = params.get("category_id");
        return id ? parseInt(id, 10) : null;
    }, [location.search]);

    // URL is the source of truth: whenever the route changes (e.g. the user
    // clicks a category link), rehydrate the filter state from the query string.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sizes = (params.get("sizes") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        setFilters((prev) => ({
            ...prev,
            price_min: params.get("min_price") ? Number(params.get("min_price")) : 0,
            price_max: params.get("max_price")
                ? Number(params.get("max_price"))
                : prev.availableOptions?.price_range?.max || 1000000,
            sizes,
            availability: params.get("availability") || "all",
            rating: params.get("rating") ? Number(params.get("rating")) : 0,
            sort_by: params.get("sort") || "newest",
            offset: 0,
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]);

    // Fetch filter options (global across all companies)
    useEffect(() => {
        const fetchFilterOptions = async () => {
            try {
                const params = {};
                if (categoryId) {
                    params.category_id = categoryId;
                }
                const response = await api.get('/shop/products/filters', { params });
                const payload = response.data?.data || response.data;
                if (response.data?.success || response.data?.status) {
                    setFilterOptions(payload);
                    setFilters(prev => ({
                        ...prev,
                        availableOptions: payload
                    }));
                }
            } catch (error) {
                console.error("Failed to load filter options:", error);
            }
        };
        fetchFilterOptions();
    }, [categoryId]);

    // Fetch products with filters (global across all companies)
    const fetchProducts = async () => {
        try {
            setLoading(true);

            const response = await api.get('/shop/products', {
                params: {
                    category_id: categoryId || 0,
                    search: filters.search || '',
                    min_price: filters.price_min > 0 ? filters.price_min : undefined,
                    max_price: filters.price_max < 1000000 ? filters.price_max : undefined,
                    sizes: (filters.sizes || []).join(','),
                    availability: filters.availability !== 'all' ? filters.availability : undefined,
                    sort: filters.sort_by || 'newest',
                    per_page: filters.limit || 20,
                    page: Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1,
                }
            });

            const payload = response.data?.data || response.data;
            const list = Array.isArray(payload) ? payload : payload?.data || [];

            if (response.data?.success || response.data?.status) {
                const productsWithResolvedImages = list.map(product => ({
                    ...product,
                    image: resolveMediaUrl(product.image),
                    additional_images: product.additional_images
                        ? product.additional_images.map(img => resolveMediaUrl(img))
                        : []
                }));
                setProducts(productsWithResolvedImages);
                setTotalProducts(payload?.total || list.length || 0);
            } else {
                console.error("API returned error:", response.data);
            }
        } catch (error) {
            console.error("Failed to fetch products:", error);
            showToast("Failed to load products", "error");
        } finally {
            setLoading(false);
        }
    };

    // Debounced real-time fetch whenever any filter / pagination / category changes.
    const sizesKey = (filters.sizes || []).slice().sort().join(",");
    const filterKey = [
        categoryId,
        filters.price_min,
        filters.price_max,
        sizesKey,
        filters.availability,
        filters.rating,
        filters.sort_by,
        filters.limit,
        filters.offset,
        filters.search || "",
    ].join("|");

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 200);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterKey]);

    // Keep the URL in sync with the current filter state (replaceState, so no
    // history spam and no navigation loop). The URL is shareable/refreshable.
    useEffect(() => {
        const params = new URLSearchParams();
        if (categoryId) params.set("category_id", String(categoryId));
        if (filters.price_min > 0) params.set("min_price", String(filters.price_min));
        if (filters.price_max < 1000000) params.set("max_price", String(filters.price_max));
        if (sizesKey) params.set("sizes", sizesKey);
        if (filters.availability !== "all") params.set("availability", filters.availability);
        if (filters.rating > 0) params.set("rating", String(filters.rating));
        if (filters.sort_by && filters.sort_by !== "newest") params.set("sort", filters.sort_by);
        const qs = params.toString();
        const next = qs ? `${location.pathname}?${qs}` : location.pathname;
        if (window.location.pathname + window.location.search !== next) {
            window.history.replaceState({}, "", next);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryId, filters.price_min, filters.price_max, sizesKey, filters.availability, filters.rating, filters.sort_by]);

    const applyFilters = () => {
        setFilters(prev => ({ ...prev, offset: 0 }));
        if (window.innerWidth < 768) {
            setShowMobileFilter(false);
        }
    };

    const clearFilters = () => {
        setFilters({
            price_min: 0,
            price_max: filterOptions?.price_range?.max || 1000000,
            sizes: [],
            availability: 'all',
            rating: 0,
            sort_by: 'newest',
            limit: 20,
            offset: 0,
            availableOptions: filterOptions || {}
        });
    };

    const getDefaultSize = (product) => {
        if (!product?.available_sizes) return "";
        const sizes = product.available_sizes
            .split(/[,;|]/)
            .map((size) => size.trim())
            .filter(Boolean);
        return sizes.length > 0 ? sizes[0] : "";
    };

    const addToCart = async (product, size = "") => {
        if (!user) {
            showToast('Please log in to add items to cart', 'error');
            setTimeout(() => navigate('/login'), 500);
            return;
        }

        const selectedSize = size || getDefaultSize(product);

        try {
            // ✅ Use the api instance
            const response = await api.post('/shop/cart', {
                user_id: user?.id || 0,
                product_id: product.id,
                quantity: 1,
                price: product.offer_price || product.price,
                size: selectedSize,
            });
            await refreshCounts();
            if (response.data?.success || response.data?.status) {
                showToast('Added to cart successfully', 'success');
            } else {
                showToast(response.data?.message || 'Unable to add to cart', 'error');
            }
        } catch (error) {
            console.error("Add to cart failed:", error);
            await refreshCounts();
            showToast('Add to cart failed. Please try again.', 'error');
        }
    };

    const wishlistIds = useMemo(
        () => new Set(wishlistItems.map((item) => item.product_id)),
        [wishlistItems]
    );

    const isWishlisted = (product) => wishlistIds.has(product.id);

    const addToWishlist = async (product, size = "") => {
        if (!user) {
            showToast("Please log in to add items to wishlist", "error");
            setTimeout(() => navigate("/login"), 500);
            return;
        }

        const existingItem = wishlistItems.find(
            (item) => item.product_id === product.id
        );

        try {
            if (existingItem) {
                // ✅ Use the api instance
                const response = await api.delete(
                    `/shop/wishlist/${existingItem.id}`, {
                        params: { user_id: user?.id || 0 }
                    }
                );
                if (response.data?.success || response.data?.status) {
                    await refreshCounts();
                    showToast("Removed from wishlist", "success");
                }
                return;
            }

            const selectedSize = size || getDefaultSize(product);
            // ✅ Use the api instance
            const response = await api.post('/shop/wishlist', {
                user_id: user?.id || 0,
                product_id: product.id,
                size: selectedSize,
            });

            if (response.data?.success || response.data?.status) {
                await refreshCounts();
                showToast("Added to wishlist", "success");
            }
        } catch (error) {
            console.error(error);
            showToast("Something went wrong", "error");
        }
    };

    const handleSortChange = (e) => {
        setFilters(prev => ({ ...prev, sort_by: e.target.value, offset: 0 }));
    };

    const activeFilterCount =
        (filters.sizes || []).length +
        (filters.availability !== 'all' ? 1 : 0) +
        (filters.rating > 0 ? 1 : 0) +
        (filters.price_min > 0 ? 1 : 0);

    return (
        <div className="min-h-screen bg-[#f8f7f2] pt-28 pb-16 px-4 md:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {totalProducts} products found
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Sort */}
                        <select
                            value={filters.sort_by}
                            onChange={handleSortChange}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="newest">Newest First</option>
                            <option value="price_low">Price: Low to High</option>
                            <option value="price_high">Price: High to Low</option>
                            <option value="popular">Most Popular</option>
                            <option value="rating">Top Rated</option>
                        </select>

                        {/* Filter Button - Mobile */}
                        <button
                            onClick={() => setShowMobileFilter(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="bg-blue-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="flex gap-8">
                    {/* Desktop Filter Sidebar */}
                    <div className="hidden md:block w-72 flex-shrink-0">
                        <FilterSidebar
                            filters={filters}
                            setFilters={setFilters}
                            onApply={applyFilters}
                            onClear={clearFilters}
                        />
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <div key={index} className="h-96 rounded-xl bg-white animate-pulse" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20">
                                <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-lg text-gray-500">No products found</p>
                                <p className="text-sm text-gray-400">Try adjusting your filters</p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-4 text-blue-500 hover:text-blue-700"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
                                {products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        onNavigate={() => navigate(`/product/${product.id}`)}
                                        onAddToCart={(prod, size) => addToCart(prod, size)}
                                        onAddToWishlist={(prod, size) => addToWishlist(prod, size)}
                                        isWishlisted={isWishlisted(product)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            {showMobileFilter && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowMobileFilter(false)}
                    />
                    <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-white overflow-y-auto p-4 animate-slide-in">
                        <FilterSidebar
                            filters={filters}
                            setFilters={setFilters}
                            onApply={applyFilters}
                            onClear={clearFilters}
                            isMobile={true}
                            onClose={() => setShowMobileFilter(false)}
                        />
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
                .animate-slide-in {
                  animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}