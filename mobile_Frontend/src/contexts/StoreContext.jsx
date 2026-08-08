// StoreContext.js
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const StoreContext = createContext();

const createGuestId = () => {
  let id = localStorage.getItem("bridal_guest_id");
  if (!id) {
    id = `guest-${Date.now()}`;
    localStorage.setItem("bridal_guest_id", id);
  }
  return id;
};

export function StoreProvider({ children }) {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [guestIdValue, setGuestIdValue] = useState(createGuestId);
  const [loading, setLoading] = useState(false);
  const previousUserRef = useRef(user);

  const guestId = () => {
    if (user && user.id) {
      return `user_${user.id}`;
    }
    return guestIdValue;
  };

  const resetStore = useCallback(() => {
    setCartItems([]);
    setWishlistItems([]);
    setCartCount(0);
    setWishlistCount(0);
    setLoading(false);
    localStorage.removeItem("bridal_cart");
    localStorage.removeItem("bridal_wishlist");

    const newId = `guest-${Date.now()}`;
    setGuestIdValue(newId);
    localStorage.setItem("bridal_guest_id", newId);
  }, []);

  useEffect(() => {
    const previousUser = previousUserRef.current;
    if (previousUser && !user) {
      resetStore();
    } else if (previousUser && user && previousUser.id !== user.id) {
      resetStore();
    }
    previousUserRef.current = user;
  }, [user, resetStore]);

  const refreshCounts = useCallback(async () => {
    const id = user?.id || 0;

    try {
      const cartRes = await api.get('/shop/cart', { params: { user_id: id } });
      const cartPayload = cartRes.data?.data || cartRes.data;
      const items = Array.isArray(cartPayload) ? cartPayload : cartPayload?.data || [];
      setCartItems(items);
      const totalCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
      setCartCount(totalCount);
    } catch (error) {
      console.error("Cart count refresh failed:", error);
    }

    try {
      const wishlistRes = await api.get('/shop/wishlist', { params: { user_id: id } });
      const wishlistPayload = wishlistRes.data?.data || wishlistRes.data;
      const items = Array.isArray(wishlistPayload) ? wishlistPayload : wishlistPayload?.data || [];
      setWishlistItems(items);
      setWishlistCount(items.length);
    } catch (error) {
      console.error("Wishlist count refresh failed:", error);
    }
  }, [user]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  // Clear cart
  const clearCart = async () => {
    setLoading(true);
    try {
      const id = user?.id || 0;
      await api.delete('/shop/cart', { params: { user_id: id } });
      setCartItems([]);
      setCartCount(0);
      localStorage.removeItem("bridal_cart");
      return { status: true, message: "Cart cleared successfully" };
    } catch (error) {
      console.error("Error clearing cart:", error);
      // Fallback: clear local state anyway
      setCartItems([]);
      setCartCount(0);
      localStorage.removeItem("bridal_cart");
      return { status: false, message: "Failed to clear cart" };
    } finally {
      setLoading(false);
    }
  };

  // Add to cart
  const addToCart = async (productId, quantity = 1, price = 0) => {
    try {
      const id = user?.id || 0;
      const response = await api.post('/shop/cart', {
        user_id: id,
        product_id: productId,
        quantity: quantity,
        price: price
      });

      if (response.data?.success || response.data?.status) {
        await refreshCounts();
        return { status: true, message: "Added to cart" };
      } else {
        return { status: false, message: response.data?.message || "Failed to add to cart" };
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      return { status: false, message: "Error adding to cart" };
    }
  };

  // Remove from cart
  const removeFromCart = async (cartItemId) => {
    try {
      await api.delete(`/shop/cart/${cartItemId}`, { params: { user_id: user?.id || 0 } });
      await refreshCounts();
      return { status: true, message: "Removed from cart" };
    } catch (error) {
      console.error("Remove from cart error:", error);
      return { status: false, message: "Failed to remove from cart" };
    }
  };

  // Update cart quantity
  const updateCartQuantity = async (cartItemId, quantity) => {
    try {
      await api.post(`/shop/cart/${cartItemId}`, {
        user_id: user?.id || 0,
        quantity: quantity
      });
      await refreshCounts();
      return { status: true, message: "Cart updated" };
    } catch (error) {
      console.error("Update cart error:", error);
      return { status: false, message: "Failed to update cart" };
    }
  };

  // Add to wishlist
  const addToWishlist = async (productId) => {
    try {
      const id = user?.id || 0;
      const response = await api.post('/shop/wishlist', {
        user_id: id,
        product_id: productId
      });

      if (response.data?.success || response.data?.status) {
        await refreshCounts();
        return { status: true, message: "Added to wishlist" };
      } else {
        return { status: false, message: response.data?.message || "Failed to add to wishlist" };
      }
    } catch (error) {
      console.error("Add to wishlist error:", error);
      return { status: false, message: "Error adding to wishlist" };
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (wishlistItemId) => {
    try {
      await api.delete(`/shop/wishlist/${wishlistItemId}`, { params: { user_id: user?.id || 0 } });
      await refreshCounts();
      return { status: true, message: "Removed from wishlist" };
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      return { status: false, message: "Failed to remove from wishlist" };
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.product_id === productId);
  };

  // Manual count updates
  const changeCartCount = (delta = 1) => {
    setCartCount((prev) => Math.max(0, prev + delta));
  };

  const changeWishlistCount = (delta = 1) => {
    setWishlistCount((prev) => Math.max(0, prev + delta));
  };

  const value = useMemo(() => ({
    cartCount,
    wishlistCount,
    cartItems,
    wishlistItems,
    loading,
    refreshCounts,
    clearCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    changeCartCount,
    changeWishlistCount,
    incrementCartCount: changeCartCount,
    incrementWishlistCount: changeWishlistCount,
    guestId,
    clearStore: resetStore,
  }), [cartCount, wishlistCount, cartItems, wishlistItems, loading, resetStore]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);