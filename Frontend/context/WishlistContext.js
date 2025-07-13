import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../constants/api';
import { useToast } from './ToastContext';
import { useContext as useReactContext } from 'react';
import { AuthContext } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token, loading: authLoading } = useReactContext(AuthContext);
  const { showToast } = useToast();

  // Fetch wishlist from backend
  const getWishlist = useCallback(async () => {
    if (authLoading || !token) {
      setWishlist([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/user/get-wishlist');
      if (response.data.success) {
        setWishlist(response.data.wishlist || []);
      } else {
        setError(response.data.message || 'Failed to fetch wishlist');
      }
    } catch (err) {
      setError('Error fetching wishlist');
    } finally {
      setLoading(false);
    }
  }, [authLoading, token]);

  // Toggle wishlist item (optimistic update)
  const toggleWishlist = useCallback(async (listingId, showToastFlag, onLoginRequired) => {
    if (authLoading || !token) {
      setError('Please login to manage your wishlist');
      if (onLoginRequired) {
        onLoginRequired();
      } else if (showToastFlag) {
        showToast('Please login to manage your wishlist', 'error');
      }
      return { success: false, message: 'Please login to manage your wishlist' };
    }
    setWishlist((prev) => {
      const isRemoving = prev.includes(listingId);
      const newWishlist = isRemoving
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId];
      if (showToastFlag) showToast(
        isRemoving ? 'Removed from wishlist' : 'Added to wishlist',
        'success'
      );
      return newWishlist;
    });
    try {
      const response = await api.post('/api/user/toggle-wishlist', {
        listingId,
        userId: user?._id,
      });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        setError(response.data.message || 'Failed to toggle wishlist');
        if (showToastFlag) showToast('Failed to update wishlist', 'error');
        return { success: false, message: response.data.message || 'Failed to toggle wishlist' };
      }
    } catch (err) {
      setError('Error toggling wishlist');
      if (showToastFlag) showToast('Error updating wishlist', 'error');
      return { success: false, message: 'Error toggling wishlist' };
    }
  }, [authLoading, token, user, showToast]);

  // Fetch wishlist on login or token change
  useEffect(() => {
    getWishlist();
  }, [getWishlist]);

  return (
    <WishlistContext.Provider value={{ wishlist, getWishlist, toggleWishlist, loading, error }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext); 