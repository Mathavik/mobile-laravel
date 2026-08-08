import { useEffect, useRef, useState } from "react";
import { Menu, Search, Heart, ShoppingBag, X, Loader2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import botikLogo from "../assets/Botik.png";
import { useStore } from "../contexts/StoreContext";
import UserDropdown from "./UserDropdown";
import api from "../services/api";
import ProductMedia from "./ProductMedia";
import { formatCurrency } from "../utils/formatters";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [navCategories, setNavCategories] = useState([]);
  const [shopAllCategories, setShopAllCategories] = useState([]);
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
        const navUrl = `/category/get_active_category`;
        const allUrl = `/category/get_all`;

        const [navRes, allRes] = await Promise.all([
          api.get(navUrl),
          api.get(allUrl),
        ]);

        const navData = navRes.data?.status ? navRes.data.data || [] : [];
        setNavCategories(navData.slice(0, 3));

        const allData = allRes.data?.status ? allRes.data.data || [] : [];
        setShopAllCategories(allData);

      } catch (err) {
        console.error("Error fetching categories:", err);
        setNavCategories([]);
        setShopAllCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
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
    const totalColumns = 4;
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

  const megaMenuColumns = getMegaMenuColumns(shopAllCategories);

  const renderSuggestionList = () => (
    <div
      className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl border border-[#E5E7EB] bg-white shadow-lg max-h-[400px] overflow-y-auto"
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
              className={`w-full text-left flex items-center gap-3 px-3 py-3 transition hover:bg-[#f8f7f2] ${
                activeSuggestionIndex === index ? "bg-[#f0efd8]" : ""
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="max-w-[1220px] mx-auto h-[82px] px-3 sm:px-4 lg:px-0 flex items-center justify-between gap-2">
          {/* LEFT */}
          <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
            {/* Desktop Shop Button */}
            <div className="relative hidden lg:flex" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 border border-[#D8D8D8] rounded-md px-4 h-[40px] text-[14px] font-medium hover:bg-gray-50 transition whitespace-nowrap"
              >
                <Menu size={15} />
                <span>Shop All</span>
              </button>

              <div
                className={`absolute left-0 top-[calc(100%_+_14px)] z-40 w-[1220px] rounded-none border border-[#E7E2DA] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] transition-all duration-200 ${
                  dropdownOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible translate-y-2"
                }`}
              >
                <div className="px-8 py-6">
                  <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3">
                    <div>
                      <h3 className="text-[20px] font-semibold text-[#181818]">
                        Shop All Categories
                      </h3>
                      <p className="mt-1 text-[13px] text-gray-500">
                        Explore all available bridal collections
                      </p>
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-10">
                      <div className="text-gray-500">Loading categories...</div>
                    </div>
                  ) : shopAllCategories.length === 0 ? (
                    <div className="flex justify-center py-10">
                      <div className="text-gray-500">No categories available</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-4">
                      {megaMenuColumns.map((column, columnIndex) => (
                        <div
                          key={columnIndex}
                          className={`px-4 min-h-[200px] ${
                            columnIndex !== megaMenuColumns.length - 1
                              ? "border-r border-black/10"
                              : ""
                          }`}
                        >
                          <div className="space-y-1">
                            {column.map((category) => (
                              <Link
                                key={category.id}
                                to={`/bridal-lehenga?category_id=${category.id}`}
                                className={`block rounded-md px-3 py-2 text-[15px] transition ${
                                  activeCategoryId === String(category.id)
                                    ? "bg-[#f8f3ed] text-[#a97c50] font-semibold"
                                    : "text-[#181818] hover:bg-[#faf7f2] hover:text-[#a97c50]"
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

                  <div className="mt-4 border-t border-black/10 pt-3">
                    <Link
                      to="/bridal-lehenga"
                      className="inline-flex items-center text-[14px] font-medium text-[#a97c50] hover:underline"
                      onClick={() => setDropdownOpen(false)}
                    >
                      View all products
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            <button onClick={() => setMenuOpen(true)} className="lg:hidden">
              <Menu size={25} />
            </button>

            {/* Desktop Navigation - Shows first 3 active categories */}
            <nav className="hidden lg:flex shrink-0 items-center gap-8 text-[14px] font-medium text-[#181818]">
              {loading ? (
                <span className="text-gray-400">Loading...</span>
              ) : navCategories.length > 0 ? (
                navCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/bridal-lehenga?category_id=${category.id}`}
                    className={`whitespace-nowrap hover:text-[#a97c50] ${
                      activeCategoryId === String(category.id)
                        ? "text-[#a97c50] font-semibold"
                        : ""
                    }`}
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <span className="text-gray-400">No categories</span>
              )}
            </nav>
          </div>

          {/* LOGO */}
          <div className="flex flex-col items-center flex-shrink-0">
            <Link to="/">
              <img
                src={botikLogo}
                alt="BOTIK"
                className="w-[110px] xs:w-[125px] sm:w-[150px] md:w-[185px]"
              />
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-4 md:gap-5 flex-1 min-w-0">
            {/* Desktop Search */}
            <div
              ref={searchRef}
              className="relative hidden md:flex items-center w-[320px] h-[42px] border border-[#D8D8D8] rounded-md px-4 bg-white"
            >
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) setSearchFocused(true);
                }}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search"
                className="flex-1 outline-none text-sm"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleSearchNavigate(searchQuery);
                }}
                className="text-gray-500"
                aria-label="Search"
              >
                {searchLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Search size={20} />
                )}
              </button>

              {searchFocused &&
                searchQuery.trim() !== "" &&
                renderSuggestionList()}
            </div>

            {/* Mobile Search */}
            <button
              type="button"
              onClick={() => {
                setShowMobileSearch((prev) => !prev);
                if (!showMobileSearch) setSearchFocused(true);
              }}
              className="md:hidden"
              aria-label="Search"
            >
              <Search size={22} />
            </button>

            {showMobileSearch && (
              <div
                ref={mobileSearchRef}
                className="fixed inset-x-0 top-[82px] z-50 px-3 sm:px-4 py-3 bg-white shadow-lg md:hidden"
              >
                <div className="relative">
                  <div className="flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-3 py-2">
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
                      className="text-gray-500"
                      aria-label="Search"
                    >
                      {searchLoading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <Search size={20} />
                      )}
                    </button>
                  </div>

                  {searchFocused &&
                    searchQuery.trim() !== "" &&
                    renderSuggestionList()}
                </div>
              </div>
            )}

            {/* User Dropdown */}
            <UserDropdown />

            {/* Wishlist */}
            <Link to="/wishlist" className="relative">
              <Heart
                size={22}
                className={`${
                  wishlistCount > 0 ? "text-red-600" : "text-black"
                } cursor-pointer`}
              />
              <span className="absolute -top-2 -right-2 rounded-full bg-[#a97c50] px-1.5 py-0.5 text-[10px] text-white">
                {wishlistCount}
              </span>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <ShoppingBag size={22} className="cursor-pointer" />
              <span className="absolute -top-2 -right-2 rounded-full bg-[#a97c50] px-1.5 py-0.5 text-[10px] text-white">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Overlay */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          menuOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[290px] bg-white z-[70] transition-transform duration-300 overflow-y-auto ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 h-[70px] border-b">
          <img src={botikLogo} alt="" className="w-[110px]" />
          <button onClick={() => setMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center border rounded-md h-11 px-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchNavigate(searchQuery);
                }
              }}
              placeholder="Search Products"
              className="flex-1 outline-none text-sm"
            />
            <button
              type="button"
              onClick={() => handleSearchNavigate(searchQuery)}
              className="text-gray-500"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        <nav className="px-5 pb-6 flex flex-col">
          {loading ? (
            <div className="py-4 text-gray-400">Loading...</div>
          ) : navCategories.length > 0 ? (
            navCategories.map((category) => (
              <Link
                key={category.id}
                to={`/bridal-lehenga?category_id=${category.id}`}
                className={`py-4 border-b text-[16px] font-medium ${
                  activeCategoryId === String(category.id)
                    ? "text-[#a97c50] font-semibold"
                    : "text-[#181818]"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {category.name}
              </Link>
            ))
          ) : (
            <div className="py-4 text-gray-400">No categories available</div>
          )}

          <Link
            to="/bridal-lehenga"
            className="py-4 border-b text-[16px] font-medium text-[#181818]"
            onClick={() => setMenuOpen(false)}
          >
            Shop All
          </Link>
        </nav>
      </div>
    </>
  );
}

export default Header;