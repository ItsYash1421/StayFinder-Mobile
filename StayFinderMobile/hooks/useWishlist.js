import { useState, useEffect, useContext } from 'react';
import { api } from '../constants/api';
import { AuthContext } from '../context/AuthContext';

const useWishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token, loading: authLoading } = useContext(AuthContext);

  // Fetch wishlist from backend
  const getWishlist = async () => {
    if (authLoading || !token) {
      setWishlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching wishlist from backend...');
      const response = await api.get('/api/user/get-wishlist');
      console.log('Wishlist response:', response.data);

      if (response.data.success) {
        setWishlist(response.data.wishlist || []);
        console.log('Wishlist set to:', response.data.wishlist || []);
      } else {
        setError(response.data.message || 'Failed to fetch wishlist');
        console.log('Wishlist fetch failed:', response.data.message);
      }
    } catch (err) {
      setError('Error fetching wishlist');
      console.error('Wishlist fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle wishlist item (optimistic update)
  const toggleWishlist = async (listingId) => {
    if (authLoading || !token) {
      setError('Please login to manage your wishlist');
      return { success: false, message: 'Please login to manage your wishlist' };
    }

    // Optimistically update UI
    setWishlist((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );

    try {
      const response = await api.post(
        '/api/user/toggle-wishlist',
        { listingId, userId: user?._id }
      );

      if (response.data.success) {
        // Optionally sync with backend
        // await getWishlist();
        return { success: true, message: response.data.message };
      } else {
        // Revert UI if failed
        setWishlist((prev) =>
          prev.includes(listingId)
            ? prev.filter((id) => id !== listingId)
            : [...prev, listingId]
        );
        setError(response.data.message || 'Failed to toggle wishlist');
        return { success: false, message: response.data.message || 'Failed to toggle wishlist' };
      }
    } catch (err) {
      // Revert UI if error
      setWishlist((prev) =>
        prev.includes(listingId)
          ? prev.filter((id) => id !== listingId)
          : [...prev, listingId]
      );
      setError('Error toggling wishlist');
      console.error('Wishlist toggle error:', err);
      return { success: false, message: 'Error toggling wishlist' };
    }
  };

  return {
    wishlist,
    getWishlist,
    toggleWishlist,
    loading,
    error,
  };
};

export default useWishlist; 