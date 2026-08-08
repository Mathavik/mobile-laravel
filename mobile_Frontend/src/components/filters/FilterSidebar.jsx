import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, SlidersHorizontal } from 'lucide-react';

const FilterSidebar = ({
  filters,
  setFilters,
  onApply,
  onClear,
  isMobile = false,
  onClose
}) => {
  // ---------- Refs for uncontrolled price inputs ----------
  const minInputRef = useRef(null);
  const maxInputRef = useRef(null);

  // ---------- Section expand/collapse ----------
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    sizes: true,
    availability: true,
    rating: true
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get available sizes
  const availableSizes = filters.availableOptions?.sizes || ['S', 'M', 'L', 'XL', 'XXL'];

  // ---------- Helper: sync input values when filters change from outside ----------
  useEffect(() => {
    if (minInputRef.current) {
      minInputRef.current.value = filters.price_min ? String(filters.price_min) : '';
    }
    if (maxInputRef.current) {
      maxInputRef.current.value =
        filters.price_max && filters.price_max !== 1000000
          ? String(filters.price_max)
          : '';
    }
  }, [filters.price_min, filters.price_max]);

  // ---------- Price range renderer (uncontrolled) ----------
  const renderPriceRange = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            ₹
          </span>
          <input
            ref={minInputRef}
            type="text"
            inputMode="numeric"
            defaultValue={filters.price_min ? String(filters.price_min) : ''}
            onBlur={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              const num = raw === '' ? 0 : Number(raw);
              setFilters((prev) => ({ ...prev, price_min: num }));
            }}
            className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a97c50] focus:border-transparent bg-gray-50"
            placeholder="Min"
          />
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
            ₹
          </span>
          <input
            ref={maxInputRef}
            type="text"
            inputMode="numeric"
            defaultValue={
              filters.price_max && filters.price_max !== 1000000
                ? String(filters.price_max)
                : ''
            }
            onBlur={(e) => {
              const raw = e.target.value.replace(/\D/g, '');
              const num = raw === '' ? 1000000 : Number(raw);
              setFilters((prev) => ({ ...prev, price_max: num }));
            }}
            className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a97c50] focus:border-transparent bg-gray-50"
            placeholder="Max"
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 px-1">
        <span>Min: ₹{filters.price_min || 0}</span>
        <span>Max: ₹{filters.price_max || 1000000}</span>
      </div>
    </div>
  );

  // ---------- Size chips ----------
  const renderSizeChips = () => {
    const sizes = availableSizes;
    if (!sizes || sizes.length === 0) {
      return <p className="text-sm text-gray-400">No sizes available</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => {
              const selected = (filters.sizes || []).includes(size);
              setFilters((prev) => ({
                ...prev,
                sizes: selected
                  ? (prev.sizes || []).filter((s) => s !== size)
                  : [...(prev.sizes || []), size]
              }));
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              (filters.sizes || []).includes(size)
                ? 'bg-[#a97c50] text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    );
  };

  // ---------- Availability ----------
  const renderAvailability = () => (
    <div className="space-y-2">
      {['all', 'in_stock', 'out_of_stock'].map((option) => (
        <label
          key={option}
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-all"
        >
          <input
            type="radio"
            name="availability"
            value={option}
            checked={filters.availability === option}
            onChange={() =>
              setFilters((prev) => ({ ...prev, availability: option }))
            }
            className="w-4 h-4 text-[#a97c50] focus:ring-[#a97c50] border-gray-300"
          />
          <span className="text-sm text-gray-700 capitalize">
            {option === 'all'
              ? 'All Products'
              : option === 'in_stock'
              ? 'In Stock'
              : 'Out of Stock'}
          </span>
        </label>
      ))}
    </div>
  );

  // ---------- Rating ----------
  const renderRating = () => (
    <div className="space-y-2">
      {[4, 3, 2, 1].map((star) => (
        <button
          key={star}
          onClick={() =>
            setFilters((prev) => ({
              ...prev,
              rating: prev.rating === star ? 0 : star
            }))
          }
          className={`flex items-center gap-3 w-full p-2 rounded-lg transition-all hover:bg-gray-50 ${
            filters.rating === star ? 'bg-yellow-50' : ''
          }`}
        >
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-gray-600">{star}★ & above</span>
          {filters.rating === star && (
            <span className="ml-auto text-xs text-[#a97c50] font-semibold">✓</span>
          )}
        </button>
      ))}
    </div>
  );

  // ---------- Section component ----------
  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-gray-100 py-4 last:border-0">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="font-medium text-gray-800 group-hover:text-[#a97c50] transition-colors">
          {title}
        </span>
        {expandedSections[section] ? (
          <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-[#a97c50] transition-colors" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-[#a97c50] transition-colors" />
        )}
      </button>
      {expandedSections[section] && <div className="mt-3">{children}</div>}
    </div>
  );

  // ---------- Helpers ----------
  const hasActiveFilters = () => {
    return (
      (filters.price_min || 0) > 0 ||
      (filters.sizes || []).length > 0 ||
      filters.availability !== 'all' ||
      filters.rating > 0
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if ((filters.price_min || 0) > 0) count++;
    if ((filters.sizes || []).length > 0) count++;
    if (filters.availability !== 'all') count++;
    if (filters.rating > 0) count++;
    return count;
  };

  // ---------- Clear handler ----------
  const handleClear = () => {
    // Reset input fields
    if (minInputRef.current) minInputRef.current.value = '';
    if (maxInputRef.current) maxInputRef.current.value = '';
    onClear();
  };

  // ---------- Apply handler (read from refs) ----------
  const handleApply = () => {
    const minRaw = minInputRef.current?.value || '';
    const maxRaw = maxInputRef.current?.value || '';
    const min = minRaw === '' ? 0 : Number(minRaw.replace(/\D/g, ''));
    const max = maxRaw === '' ? 1000000 : Number(maxRaw.replace(/\D/g, ''));
    setFilters((prev) => ({ ...prev, price_min: min, price_max: max }));
    onApply();
  };

  // ---------- Remove individual price filter ----------
  const removePriceFilter = () => {
    if (minInputRef.current) minInputRef.current.value = '';
    if (maxInputRef.current) maxInputRef.current.value = '';
    setFilters((prev) => ({ ...prev, price_min: 0, price_max: 1000000 }));
  };

  // ---------- Main render ----------
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#a97c50]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {getActiveFilterCount() > 0 && (
            <span className="bg-[#a97c50] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Active Filters */}
      {hasActiveFilters() && (
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex flex-wrap gap-2">
            {(filters.price_min || 0) > 0 && (
              <span className="bg-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-200">
                ₹{filters.price_min} - ₹{filters.price_max}
                <button
                  onClick={removePriceFilter}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {(filters.sizes || []).map((size) => (
              <span
                key={size}
                className="bg-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-200"
              >
                Size {size}
                <button
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      sizes: (prev.sizes || []).filter((s) => s !== size)
                    }))
                  }
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            {filters.availability !== 'all' && (
              <span className="bg-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-200">
                {filters.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, availability: 'all' }))
                  }
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
            {filters.rating > 0 && (
              <span className="bg-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-gray-200">
                {filters.rating}★ & above
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, rating: 0 }))}
                  className="hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </span>
            )}
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-[#a97c50] hover:text-[#8b6a43] mt-2 font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        <FilterSection title="Price Range" section="price">
          {renderPriceRange()}
        </FilterSection>

        <FilterSection title="Sizes" section="sizes">
          {renderSizeChips()}
        </FilterSection>

        <FilterSection title="Availability" section="availability">
          {renderAvailability()}
        </FilterSection>

        <FilterSection title="Rating" section="rating">
          {renderRating()}
        </FilterSection>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApply}
        className="w-full mt-4 py-3 bg-[#a97c50] hover:bg-[#8b6a43] text-white rounded-xl font-medium transition-all duration-300 hover:shadow-lg active:scale-95"
      >
        Apply Filters
      </button>
    </div>
  );
};

export default FilterSidebar;