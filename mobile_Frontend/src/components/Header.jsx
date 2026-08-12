import { useEffect, useRef, useState } from "react";
import { Menu, Search, Heart, ShoppingBag, X, Loader2, Smartphone, ChevronDown, Phone, Truck, Zap } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../contexts/StoreContext";
import UserDropdown from "./UserDropdown";
import api from "../services/api";
import ProductMedia from "./ProductMedia";
import { formatCurrency } from "../utils/formatters";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeCategories, setActiveCategories] = useState([]);
  const [inactiveCategories, setInactiveCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tracks which query has actually been answered, so the "No products found"
  // message is only shown after a real (non-loading) response for current text.
  const [resolvedQuery, setResolvedQuery] = useState("");

  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const searchAbortRef = useRef(null);
  const { cartCount, wishlistCount } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const activeCategoryId = params.get("category_id") || "";

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/category/get_all`);

        const allData = res.data?.status ? res.data.data || [] : [];

        setActiveCategories(
          allData.filter((category) => category.status === "active")
        );
        setInactiveCategories(
          allData.filter((category) => category.status !== "active")
        );
      } catch (err) {
        console.error("Error fetching categories:", err);
        setActiveCategories([]);
        setInactiveCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();

    // Refetch when the tab regains focus so status changes made in the
    // admin Category page are reflected without a manual page reload.
    const handleFocus = () => {
      fetchCategories();
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [location.search]);

  // ── Live suggestions: debounced, race-protected ──
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSuggestions([]);
      setSearchLoading(false);
      setResolvedQuery("");
      searchAbortRef.current?.abort?.();
      return;
    }

    setSearchLoading(true);

    const handler = setTimeout(() => {
      const controller = new AbortController();
      searchAbortRef.current?.abort?.();
      searchAbortRef.current = controller;

      const doFetch = async () => {
        try {
          const params = { q: query, limit: 8 };
          const response = await api.get("/search/suggestions", {
            params,
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          const items =
            response.data?.status && Array.isArray(response.data.data)
              ? response.data.data
              : [];
          setSuggestions(items);
          setActiveSuggestionIndex(-1);
          setResolvedQuery(query);
          setSuggestionsOpen(true);
        } catch {
          if (controller.signal.aborted) return;
          setSuggestions([]);
          setResolvedQuery(query);
          setSuggestionsOpen(true);
        } finally {
          if (!controller.signal.aborted) {
            setSearchLoading(false);
          }
        }
      };

      doFetch();
    }, 250);

    return () => {
      clearTimeout(handler);
      searchAbortRef.current?.abort?.();
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSuggestionsOpen(false);
        setSearchFocused(false);
        setActiveSuggestionIndex(-1);
      }
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target)
      ) {
        setSuggestionsOpen(false);
        setSearchFocused(false);
        setShowMobileSearch(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchNavigate = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    window.scrollTo(0, 0);
    setSearchQuery("");
    setSuggestionsOpen(false);
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
    setShowMobileSearch(false);
    setMenuOpen(false);
  };

  const selectSuggestion = (product) => {
    navigate(`/product/${product.id}`);
    setSearchQuery("");
    setSuggestionsOpen(false);
    setSearchFocused(false);
    setActiveSuggestionIndex(-1);
    setShowMobileSearch(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearchNavigate(searchQuery);
    } else if (event.key === "Escape") {
      setSuggestionsOpen(false);
      setSearchFocused(false);
      setActiveSuggestionIndex(-1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) =>
        Math.min(prev + 1, suggestions.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  const getMegaMenuColumns = (categories) => {
    const totalColumns = categories.length ? Math.min(categories.length, 4) : 1;
    const columns = Array.from({ length: totalColumns }, () => []);

    if (!categories.length) return columns;

    const itemsPerColumn = Math.ceil(categories.length / totalColumns);

    categories.forEach((category, index) => {
      const columnIndex = Math.min(
        Math.floor(index / itemsPerColumn),
        totalColumns - 1
      );
      columns[columnIndex].push(category);
    });

    return columns;
  };

  const megaMenuColumns = getMegaMenuColumns(inactiveCategories);

  const renderSuggestionList = () => (
    <div
      className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-[#E5E7EB] bg-white shadow-xl max-h-[400px] overflow-y-auto"
      onMouseDown={(e) => e.preventDefault()}
    >
      {searchLoading && suggestions.length === 0 ? (
        <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Searching...
        </div>
      ) : suggestions.length > 0 ? (
        <>
          {suggestions.map((product, index) => (
            <button
              key={product.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(product)}
              className={`w-full text-left flex items-center gap-3 px-3 py-3 transition hover:bg-[#f8fafc] ${
                activeSuggestionIndex === index ? "bg-[#dbeafe]" : ""
              }`}
            >
              <ProductMedia
                product={product}
                image={product.image}
                video={product.video_url}
                alt={product.product_name}
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1">
                  {product.product_name}
                </p>
                <p className="text-xs text-gray-500 line-clamp-1">
                  {product.category_name ||
                    product.subcategory_name ||
                    product.brand_name ||
                    "Category"}
                </p>
              </div>
              {product.price != null && (
                <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                  {formatCurrency(product.price)}
                </span>
              )}
            </button>
          ))}
          {searchLoading && (
            <div className="flex items-center justify-center gap-2 border-t border-gray-100 py-2 text-xs text-gray-400">
              <Loader2 size={13} className="animate-spin" /> Updating...
            </div>
          )}
        </>
      ) : resolvedQuery === searchQuery.trim() ? (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No products found for "{searchQuery.trim()}"
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Searching...
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* ── ANNOUNCEMENT STRIP ─────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#7c3aed] text-white">
          <div className="absolute inset-0 opacity-20 [background-image:repeating-linear-gradient(45deg,#fff_0,#fff_1px,transparent_1px,transparent_12px)]" />
          <div className="relative max-w-[1220px] mx-auto h-9 px-4 lg:px-0 flex items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs">
            <span className="hidden sm:flex items-center gap-1.5 text-blue-50">
              <Truck size={12} /> Free Delivery above ₹999
            </span>
            <span className="flex items-center gap-1.5 font-semibold tracking-wide whitespace-nowrap truncate max-w-full">
              <Zap size={12} className="text-amber-300 shrink-0" /> MEGA 5G SALE — Up to 20% Off
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-blue-50">
              <Phone size={12} /> +91 93899 03752
            </span>
          </div>
        </div>

        {/* ── MAIN BAR ──────────────────────────────── */}
        <div className="relative z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-[0_2px_20px_rgba(15,23,42,0.06)]">
          <div className="max-w-[1220px] mx-auto h-[72px] px-4 lg:px-0 flex items-center justify-between gap-2 sm:gap-3">
            {/* LEFT: menu + logo */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-5 flex-1 min-w-0">
              <button
                onClick={() => setMenuOpen(true)}
                className="lg:hidden p-1.5 sm:p-2 -ml-1.5 sm:-ml-2 rounded-xl hover:bg-slate-100 transition"
              >
                <Menu size={24} />
              </button>

              {/* LOGO */}
              <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
                <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#2563eb] via-[#3b82f6] to-[#7c3aed] text-white shadow-lg shadow-[#2563eb]/30 group-hover:scale-105 transition-transform">
                  <Smartphone size={20} />
                </span>
                <span className="hidden min-[340px]:inline text-base min-[480px]:text-xl min-[640px]:text-2xl font-extrabold tracking-tight text-[#0f172a]">
                  Mobile<span className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">Kart</span>
                </span>
              </Link>
            </div>

            {/* CENTER: search */}
            <div
              ref={searchRef}
              className="relative hidden md:flex items-center w-[300px] lg:w-[420px] xl:w-[520px] h-12 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] p-[1.5px] focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.15)] transition-shadow"
            >
              <div className="flex items-center w-full h-full rounded-full bg-white px-4">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) setSearchFocused(true);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search smartphones, brands..."
                  className="flex-1 outline-none text-sm bg-transparent px-2.5"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSearchNavigate(searchQuery);
                  }}
                  className="shrink-0 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-90 text-white w-8 h-8 flex items-center justify-center transition"
                  aria-label="Search"
                >
                  {searchLoading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Search size={15} />
                  )}
                </button>
              </div>

              {searchFocused &&
                searchQuery.trim() !== "" &&
                renderSuggestionList()}
            </div>

            {/* RIGHT: icons */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 flex-1 min-w-0">
              {/* Mobile Search */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileSearch((prev) => !prev);
                  if (!showMobileSearch) setSearchFocused(true);
                }}
                className="md:hidden p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 transition"
                aria-label="Search"
              >
                <Search size={22} />
              </button>

              {/* User Dropdown */}
              <UserDropdown />

              {/* Wishlist */}
              <Link to="/wishlist" className="relative p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 group transition">
                <Heart
                  size={21}
                  className={`${wishlistCount > 0 ? "text-red-600" : "text-slate-700 group-hover:text-[#2563eb]"} transition`}
                />
                <span className="absolute top-0.5 right-0.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-1.5 py-0.5 text-[10px] leading-none text-white font-bold shadow">
                  {wishlistCount}
                </span>
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 group transition">
                <ShoppingBag size={21} className="text-slate-700 group-hover:text-[#2563eb] transition" />
                <span className="absolute top-0.5 right-0.5 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] px-1.5 py-0.5 text-[10px] leading-none text-white font-bold shadow">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── CATEGORY NAV BAR ──────────────────────── */}
        <div className="relative z-30 hidden lg:block bg-[#f8fafc]/95 backdrop-blur border-b border-slate-100">
          <div className="max-w-[1220px] mx-auto h-12 px-0 flex items-center gap-2 text-[13.5px]">
            {/* Active categories */}
            <nav className="flex items-center gap-2 text-[13.5px] font-medium text-slate-700">
              {loading ? (
                <span className="text-gray-400 px-2">Loading...</span>
              ) : activeCategories.length > 0 ? (
                activeCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/mobiles?category_id=${category.id}`}
                    className={`whitespace-nowrap rounded-full px-4 py-1.5 transition ${
                      activeCategoryId === String(category.id)
                        ? "bg-[#2563eb] text-white font-semibold shadow-md shadow-[#2563eb]/30"
                        : "text-slate-600 hover:bg-[#eef2f7] hover:text-[#2563eb]"
                    }`}
                  >
                    {category.name}
                  </Link>
                ))
              ) : null}
            </nav>

            {/* Shop All dropdown (only when inactive categories exist) */}
            {inactiveCategories.length > 0 && (
              <div className="relative h-full flex items-center" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 font-semibold transition ${
                    dropdownOpen
                      ? "bg-[#0f172a] text-white"
                      : "bg-white text-[#0f172a] border border-slate-200 hover:border-[#2563eb] hover:text-[#2563eb]"
                  }`}
                >
                  <Menu size={14} />
                  Shop All
                  <ChevronDown
                    size={13}
                    className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <div
                  className={`absolute left-0 top-[calc(100%_+_8px)] z-40 w-[1220px] rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.15)] transition-all duration-200 ${
                    dropdownOpen
                      ? "opacity-100 visible translate-y-0"
                      : "opacity-0 invisible translate-y-2 pointer-events-none"
                  }`}
                >
                  <div className="px-8 py-6">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#0f172a]">
                          Shop All Categories
                        </h3>
                        <p className="mt-1 text-[13px] text-gray-500">
                          Explore all available mobile collections
                        </p>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex justify-center py-10">
                        <div className="text-gray-500">Loading categories...</div>
                      </div>
                    ) : inactiveCategories.length === 0 ? (
                      <div className="flex justify-center py-10">
                        <div className="text-gray-500">No categories available</div>
                      </div>
                    ) : (
                      <div
                        className={`grid gap-4 ${
                          megaMenuColumns.length === 1
                            ? "grid-cols-1"
                            : megaMenuColumns.length === 2
                              ? "grid-cols-2"
                              : megaMenuColumns.length === 3
                                ? "grid-cols-3"
                                : "grid-cols-4"
                        }`}
                      >
                        {megaMenuColumns.map((column, columnIndex) => (
                          <div
                            key={columnIndex}
                            className={`px-4 min-h-[180px] ${
                              columnIndex !== megaMenuColumns.length - 1
                                ? "border-r border-slate-100"
                                : ""
                            }`}
                          >
                            <div className="space-y-1">
                              {column.map((category) => (
                                <Link
                                  key={category.id}
                                  to={`/mobiles?category_id=${category.id}`}
                                  className={`block rounded-lg px-3 py-2 text-[14px] transition ${
                                    activeCategoryId === String(category.id)
                                      ? "bg-[#eff6ff] text-[#2563eb] font-semibold"
                                      : "text-[#0f172a] hover:bg-[#f1f5f9] hover:text-[#2563eb]"
                                  }`}
                                  onClick={() => setDropdownOpen(false)}
                                >
                                  {category.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <Link
                        to="/mobiles"
                        className="inline-flex items-center text-[14px] font-semibold text-[#2563eb] hover:underline"
                        onClick={() => setDropdownOpen(false)}
                      >
                        View all products →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <span className="ml-auto text-[12.5px] text-slate-500 flex items-center gap-1.5 px-2">
              <Zap size={13} className="text-amber-500" />
              Deals & Offers
            </span>
          </div>
        </div>
      </header>

      {/* Mobile search panel */}
      {showMobileSearch && (
        <div
          ref={mobileSearchRef}
          className="fixed inset-x-0 top-[108px] z-50 px-3 sm:px-4 py-3 bg-white shadow-xl md:hidden"
        >
          <div className="relative">
            <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] p-[1.5px]">
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 w-full">
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) setSearchFocused(true);
                  }}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-sm outline-none"
                  placeholder="Search products"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSearchNavigate(searchQuery);
                  }}
                  className="text-[#2563eb]"
                  aria-label="Search"
                >
                  {searchLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Search size={20} />
                  )}
                </button>
              </div>
            </div>

            {searchFocused &&
              searchQuery.trim() !== "" &&
              renderSuggestionList()}
          </div>
        </div>
      )}

      {/* Overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-[300px] bg-white z-[70] transition-transform duration-300 overflow-y-auto ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-gradient-to-r from-[#1d4ed8] to-[#7c3aed] z-10 flex items-center justify-between px-5 h-[70px]">
          <Link to="/" className="flex items-center gap-1.5" onClick={() => setMenuOpen(false)}>
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 text-white">
              <Smartphone size={15} />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              Mobile<span className="text-[#c7d2fe]">Kart</span>
            </span>
          </Link>
          <button onClick={() => setMenuOpen(false)} className="text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center rounded-full bg-gradient-to-r from-[#2563eb] to-[#7c3aed] p-[1.5px]">
            <div className="flex items-center w-full rounded-full bg-[#f8fafc] h-11 px-4">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchNavigate(searchQuery);
                  }
                }}
                placeholder="Search Products"
                className="flex-1 outline-none text-sm bg-transparent"
              />
              <button
                type="button"
                onClick={() => handleSearchNavigate(searchQuery)}
                className="text-[#2563eb]"
              >
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>

        <nav className="px-5 pb-6 flex flex-col">
          {loading ? (
            <div className="py-4 text-gray-400">Loading...</div>
          ) : activeCategories.length > 0 ? (
            activeCategories.map((category) => (
              <Link
                key={category.id}
                to={`/mobiles?category_id=${category.id}`}
                className={`py-4 border-b text-[16px] font-medium ${
                  activeCategoryId === String(category.id)
                    ? "text-[#2563eb] font-semibold"
                    : "text-[#0f172a]"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))
          ) : (
            <div className="py-4 text-gray-400">No active categories</div>
          )}

          {inactiveCategories.length > 0 && (
            <div>
              <p className="py-3 text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
                Shop All
              </p>
              {inactiveCategories.map((category) => (
                <Link
                  key={category.id}
                  to={`/mobiles?category_id=${category.id}`}
                  className="py-4 border-b text-[16px] font-medium text-[#0f172a]"
                  onClick={() => setMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          <Link
            to="/wishlist"
            className="py-4 border-b text-[16px] font-medium text-[#0f172a]"
            onClick={() => setMenuOpen(false)}
          >
            Wishlist ({wishlistCount})
          </Link>
          <Link
            to="/cart"
            className="py-4 border-b text-[16px] font-medium text-[#0f172a]"
            onClick={() => setMenuOpen(false)}
          >
            Cart ({cartCount})
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Header;
