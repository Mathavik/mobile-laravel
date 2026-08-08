import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, ShoppingBag, Truck, ChevronLeft, ChevronRight, Play, AlertTriangle, X, Expand } from "lucide-react";
import { formatCurrency, getDiscountPercent } from "../utils/formatters";
import { useStore } from "../contexts/StoreContext";
import { useAuth } from "../contexts/AuthContext";
import { showToast } from "../utils/toast";
import api, { resolveMediaUrl } from "../services/api";

const buildTagList = (product) => {
  if (!product) return [];
  const raw = Array.isArray(product.keywords_list)
    ? product.keywords_list
    : product.keywords
      ? String(product.keywords).split(/[,]+/).map((k) => k.trim()).filter(Boolean)
      : [];
  return [...new Set(raw)];
};

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { guestId, refreshCounts, wishlistItems, incrementWishlistCount } = useStore();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      setProduct(null);

      if (!id) {
        setError("Product ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/shop/products/${id}`);
        if (response.data?.success || response.data?.status) {
          setProduct(response.data.data);
        } else {
          setError(response.data?.message || "Product not found.");
        }
      } catch (fetchError) {
        console.error("Failed to load product:", fetchError);
        setError("Unable to load product details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const availableSizes = useMemo(() => {
    if (!product?.available_sizes) return [];
    return product.available_sizes
      .split(/[,;|]/)
      .map((size) => size.trim())
      .filter(Boolean);
  }, [product]);

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  // Stock details calculation
  const isOutOfStock = useMemo(() => {
    if (!product) return true;
    return product.stock === undefined || product.stock === null || Number(product.stock) <= 0;
  }, [product]);

  const validateSize = () => {
    if (availableSizes.length > 0 && !selectedSize) {
      showToast('Please select a size', 'error');
      return false;
    }
    return true;
  };

  const addToCart = async () => {
    if (isOutOfStock) {
      showToast('Product is out of stock', 'error');
      return;
    }

    if (!user) {
      showToast('Please log in to add items to cart', 'error');
      setTimeout(() => navigate('/login'), 500);
      return;
    }

    if (!validateSize()) {
      return;
    }

    try {
      const response = await api.post('/shop/cart', {
        user_id: user?.id || 0,
        product_id: product.id,
        quantity: quantity,
        price: product.price,
        size: selectedSize,
        gst_percentage: product.gst_percentage || 0,
      });
      await refreshCounts();
      if (response.data?.success || response.data?.status) {
        showToast(`${product.product_name} added to cart successfully`, 'success');
      } else {
        showToast(response.data?.message || "Unable to add to cart", 'error');
      }
    } catch (error) {
      console.error("Add to cart failed:", error);
      await refreshCounts();
      showToast("Add to cart failed. Please try again.", 'error');
    }
  };

  const addToWishlist = async () => {
    if (!user) {
      showToast("Please log in to add items to wishlist", "error");
      setTimeout(() => navigate("/login"), 500);
      return;
    }

    if (!validateSize()) {
      return;
    }

    try {
      // Check if already in wishlist
      const existingItem = wishlistItems.find(
        (item) => item.product_id === product.id
      );

      if (existingItem) {
        const response = await api.delete(
          `/shop/wishlist/${existingItem.id}`,
          { params: { user_id: user?.id || 0 } }
        );

        if (response.data?.success || response.data?.status) {
          await refreshCounts();
          showToast("Removed from wishlist", "success");
        } else {
          showToast(response.data?.message || "Unable to remove", "error");
        }
        return;
      }

      // Add to wishlist
      const response = await api.post('/shop/wishlist', {
        user_id: user?.id || 0,
        product_id: product.id,
        size: selectedSize,
      });

      if (response.data?.success || response.data?.status) {
        incrementWishlistCount(1);
        await refreshCounts();
        showToast("Added to wishlist", "success");
      } else {
        showToast(response.data?.message || "Unable to add", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("Something went wrong", "error");
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) {
      showToast('Product is out of stock', 'error');
      return;
    }

    if (!user) {
      showToast('Please log in to proceed to payment', 'error');
      setTimeout(() => navigate('/login'), 500);
      return;
    }

    const productData = {
      product_id: product.id,
      product_name: product.product_name,
      price: Number(product.price),
      quantity: quantity,
      size: selectedSize,
      gst_percentage: Number(product.gst_percentage || 0),
    };

    navigate("/checkout", {
      state: {
        fromProduct: true,
        product: productData,
        customer_name: user.name || "",
        email: user.email || "",
        mobile: user.phone || "",
        shipping_address: user.address || "",
      }
    });
  };

  const incrementQuantity = () => {
    if (product.stock && quantity >= Number(product.stock)) {
      showToast(`Only ${product.stock} items available in stock`, 'warning');
      return;
    }
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const nextMedia = () => {
    if (mediaItems.length > 0) {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaItems.length);
    }
  };

  const prevMedia = () => {
    if (mediaItems.length > 0) {
      setCurrentMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
    }
  };

  // Helper functions - using resolveMediaUrl from api.js
  const convertImagePath = (imagePath) => {
    return resolveMediaUrl(imagePath);
  };

  const convertVideoPath = (videoPath) => {
    return resolveMediaUrl(videoPath);
  };

  // Parse gallery images
  let galleryImages = [];
  if (product?.image_gallery_json) {
    try {
      let cleanJson = product.image_gallery_json;
      if (typeof cleanJson === 'string') {
        cleanJson = cleanJson.replace(/\\\\/g, "").replace(/\\\"/g, '"').replace(/\\\//g, "/");
        galleryImages = JSON.parse(cleanJson);
      } else if (Array.isArray(cleanJson)) {
        galleryImages = cleanJson;
      }
    } catch (e) {
      console.warn("Failed to parse image gallery JSON:", e);
      galleryImages = [];
    }
  }

  // Build images array - include main image and gallery images
  let productImages = [];
  
  // Add main image
  if (product?.image) {
    productImages.push(product.image);
  }
  
  // Add gallery images (avoid duplicates)
  if (galleryImages.length > 0) {
    galleryImages.forEach(img => {
      if (!productImages.includes(img)) {
        productImages.push(img);
      }
    });
  }
  
  // Convert all to URLs and remove nulls
  productImages = productImages.filter(Boolean).map(convertImagePath).filter(Boolean);

  // If no images, use default
  if (productImages.length === 0) {
    productImages = ["https://images.unsplash.com/photo-1515886657613-9f3515b0c78f"];
  }

  // Get video URL
  const videoUrl = product?.video_url ? convertVideoPath(product.video_url) : null;
  const hasVideo = !!videoUrl;

  // Build media items array (video first if exists, then images)
  const mediaItems = [];
  if (hasVideo) {
    mediaItems.push({ type: 'video', url: videoUrl });
  }
  productImages.forEach((img) => {
    mediaItems.push({ type: 'image', url: img });
  });

  // Get current media item
  const currentMedia = mediaItems[currentMediaIndex] || mediaItems[0];

  // Check if product is in wishlist
  const isWishlisted = wishlistItems.some(
    (item) => item.product_id === product?.id
  );

  // Fullscreen modal for image
  const openFullscreen = () => {
    setIsFullscreen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    document.body.style.overflow = 'auto';
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center pt-28">Loading product...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center pt-28 text-center px-4 text-red-600">{error}</div>;
  }

  if (!product) {
    return <div className="min-h-screen flex items-center justify-center pt-28">Product not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f8f7f2] pt-28 pb-16 px-4 md:px-8 lg:px-12">
      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-50 bg-white/95 flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-gray-800 hover:text-gray-600 transition z-50 bg-white/80 rounded-full p-2"
          >
            <X size={28} />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4">
            {currentMedia?.type === 'video' ? (
              <video
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              >
                <source src={currentMedia.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={currentMedia?.url || productImages[0]}
                alt={product.product_name}
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>
          {/* Fullscreen navigation */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevMedia();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 text-gray-800 shadow-lg transition z-50"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextMedia();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-3 text-gray-800 shadow-lg transition z-50"
              >
                <ChevronRight size={28} />
              </button>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 text-gray-800 px-4 py-2 rounded-full text-sm shadow-lg">
                {currentMediaIndex + 1} / {mediaItems.length}
              </div>
            </>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10">
        {/* Left Column - Media Gallery */}
        <div>
          {/* Main Media Display - No black background */}
          <div 
            className="relative rounded-xl overflow-hidden cursor-pointer bg-[#f8f7f2]"
            onClick={openFullscreen}
          >
            {currentMedia?.type === 'video' ? (
              <video
                controls
                autoPlay
                muted
                loop
                className="w-full h-[320px] xs:h-[380px] sm:h-[460px] md:h-[520px] object-contain"
                onClick={(e) => e.stopPropagation()}
              >
                <source src={currentMedia.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={currentMedia?.url || productImages[0]}
                alt={product.product_name}
                className="w-full h-[320px] xs:h-[380px] sm:h-[460px] md:h-[520px] object-contain"
              />
            )}

            {/* Expand button */}
            {currentMedia?.type !== 'video' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openFullscreen();
                }}
                className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-md transition z-10"
              >
                <Expand size={18} />
              </button>
            )}

            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevMedia();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition z-10"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextMedia();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition z-10"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Media Type Badge */}
            {currentMedia?.type === 'video' && (
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Play size={12} fill="white" /> Video
              </div>
            )}
            
            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                {currentMediaIndex + 1} / {mediaItems.length}
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {mediaItems.length > 1 && (
            <div className="mt-4 grid grid-cols-6 gap-2">
              {mediaItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={`relative rounded-lg overflow-hidden border-2 transition ${
                    currentMediaIndex === index 
                      ? 'border-[#a97c50]' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="relative h-20 w-full bg-gray-900 flex items-center justify-center">
                      <video
                        src={item.url}
                        className="h-full w-full object-cover opacity-70"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Play size={20} className="text-white" fill="white" />
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded">
                        Video
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="h-20 w-full object-cover hover:opacity-80 transition"
                    />
                  )}
                  {currentMediaIndex === index && (
                    <div className="absolute inset-0 bg-[#a97c50]/10"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div>
          <p className="text-sm uppercase tracking-[3px] text-[#a97c50]">{product.category_name}</p>
          <h1 className="text-2xl xs:text-2xl sm:text-3xl font-semibold mt-2">{product.product_name}</h1>
          <p className="text-gray-600 mt-3">{product.short_description || product.full_description}</p>

          {/* Stock Badges Status Display */}
          <div className="mt-3">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Out of Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                In Stock ({product.stock} items left)
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-semibold">{formatCurrency(product.price)}</span>
            {product.original_price && (
              <>
                <span className="line-through text-gray-400">{formatCurrency(product.original_price)}</span>
                <span className="text-[#a97c50]">{getDiscountPercent(product.original_price, product.price)}% off</span>
              </>
            )}
          </div>

          {!isOutOfStock && (
            <div className="mt-2 text-sm text-gray-600">
              Total: <span className="font-semibold">{formatCurrency(product.price * quantity)}</span>
            </div>
          )}

          {availableSizes.length > 0 && (
            <div className="mt-4">
              <span className="text-sm font-medium text-gray-700">Select Size:</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      selectedSize === size 
                        ? "border-[#a97c50] bg-[#a97c50] text-white" 
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selector - Hides if out of stock */}
          {!isOutOfStock && (
            <div className="mt-4 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-md bg-white">
                <button 
                  onClick={decrementQuantity} 
                  className="px-3 py-1 hover:bg-gray-100 transition" 
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1 min-w-[40px] text-center">{quantity}</span>
                <button 
                  onClick={incrementQuantity} 
                  className="px-3 py-1 hover:bg-gray-100 transition"
                  disabled={product.stock && quantity >= Number(product.stock)}
                >
                  +
                </button>
              </div>
              {product.stock && (
                <span className="text-xs text-gray-500">Max: {product.stock}</span>
              )}
            </div>
          )}

          <div className="mt-4 text-sm text-gray-500">SKU: {product.product_code || "N/A"} • Barcode: {product.barcode || "N/A"}</div>

          {/* Action Buttons with Conditional Rendering */}
          <div className="mt-6 flex flex-wrap gap-3">
            {isOutOfStock ? (
              <div className="w-full flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-md font-medium text-center justify-center">
                <AlertTriangle size={18} /> Product is Out of Stock
              </div>
            ) : (
              <>
                <button 
                  onClick={addToCart} 
                  className="flex items-center gap-2 rounded-md bg-[#181818] px-4 py-3 text-white hover:bg-[#333] transition"
                >
                  <ShoppingBag size={16} /> Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow} 
                  className="flex items-center gap-2 rounded-md bg-[#a97c50] px-4 py-3 text-white hover:bg-[#8a6540] transition"
                >
                  Buy Now
                </button>
              </>
            )}
            <button
              onClick={addToWishlist}
              className={`flex items-center gap-2 rounded-md border px-4 py-3 transition ${
                isWishlisted
                  ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Heart
                size={16}
                fill={isWishlisted ? "currentColor" : "none"}
              />
              {isWishlisted ? "Remove Wishlist" : "Wishlist"}
            </button>
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="font-semibold text-lg">Product Details</h2>
            <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-gray-700">
              {product.fabric && <div><span className="font-medium">Fabric:</span> {product.fabric}</div>}
              {product.material && <div><span className="font-medium">Material:</span> {product.material}</div>}
              {product.embroidery && <div><span className="font-medium">Embroidery:</span> {product.embroidery}</div>}
              {product.color && <div><span className="font-medium">Color:</span> {product.color}</div>}
              {product.available_sizes && <div><span className="font-medium">Sizes:</span> {product.available_sizes}</div>}
              {product.occasion && <div><span className="font-medium">Occasion:</span> {product.occasion}</div>}
              {product.unit && <div><span className="font-medium">Unit:</span> {product.unit}</div>}
              {product.gst_percentage && <div><span className="font-medium">GST:</span> {product.gst_percentage}%</div>}
            </div>
          </div>

          {buildTagList(product).length > 0 && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="font-semibold text-lg mb-3">Search Tags</h2>
              <div className="flex flex-wrap gap-2">
                {buildTagList(product).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-[#a97c50] hover:text-[#a97c50]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-3">
              <Truck className="mt-1" />
              <div>
                <h3 className="font-semibold">Shipping</h3>
                <p className="text-sm text-gray-600">Fast delivery across India.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}