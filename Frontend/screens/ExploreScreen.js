import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Animated,
  TextInput,
  Easing,
  Platform,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import {
  COLORS,
  getGridColumns,
  getResponsiveSize,
  FONT_SIZES,
  SPACING,
  getShadow,
  isTablet,
  isLargeTablet,
} from "../constants/theme";
import { api } from "../constants/api";
import PostCard from "../components/PostCard";
import { useNavigation, useRoute } from "@react-navigation/native";
import FilterModal from "../components/FilterModal";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { ScrollView as RNScrollView } from "react-native";
import useWishlist from "../hooks/useWishlist";
import CustomDatePickerModal from "../components/CustomDatePickerModal";
import HomePostCard from "../components/HomePostCard";
import LoginPromptModal from "../components/LoginPromptModal";

// Normalization function to ensure consistent filter structure
function normalizeFilters(obj = {}) {
  return {
    search: obj.search || "",
    location: obj.location || "",
    category: obj.category || "all",
    minPrice: obj.minPrice || "",
    maxPrice: obj.maxPrice || "",
    guests: obj.guests || "",
    amenities: Array.isArray(obj.amenities) ? obj.amenities : [],
    sortBy: obj.sortBy || "relevance",
    date: obj.date || "",
  };
}

export default function ExploreScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState(normalizeFilters());
  const [showFooter, setShowFooter] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const scrollTimeoutRef = useRef(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { wishlist, toggleWishlist, getWishlist } = useWishlist();
  const flatListRef = useRef(null);

  // Animation refs for end message
  const headerAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  // Collapsible Explore Stays header state
  const scrollY = useRef(new Animated.Value(0)).current;
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Animate header height and font size
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [110, 60],
    extrapolate: "clamp",
  });
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [28, 20],
    extrapolate: "clamp",
  });
  const searchBarOpacity = scrollY.interpolate({
    inputRange: [0, 40],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/listings");
      setListings(res.data.listings || []);
    } catch (err) {
      setError("Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    getWishlist();
    // Cleanup timeout on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Guarded sync: Only update filters if route.params and filters differ (normalized)
  useEffect(() => {
    if (route.params) {
      const paramsNorm = normalizeFilters(route.params);
      const filtersNorm = normalizeFilters(filters);
      if (JSON.stringify(paramsNorm) !== JSON.stringify(filtersNorm)) {
        setFilters(paramsNorm);
      }
    }
  }, [route.params]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchListings();
    setRefreshing(false);
  };

  // Helper: check if any filter is active
  const isAnyFilterActive = useMemo(() => {
    const f = filters;
    return (
      !!f.search?.trim() ||
      !!f.location?.trim() ||
      (f.category && f.category !== 'all') ||
      !!f.minPrice ||
      !!f.maxPrice ||
      !!f.guests ||
      (Array.isArray(f.amenities) && f.amenities.length > 0)
    );
  }, [filters]);

  // Filtering logic
  const filteredListings = useMemo(() => {
    let filtered = [...listings];
    filtered = filtered.filter((listing) => listing.status !== 'paused');
    const f = filters;
    if (f.search?.trim()) {
      const searchTerm = f.search.trim().toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title?.toLowerCase().includes(searchTerm) ||
          l.description?.toLowerCase().includes(searchTerm) ||
          l.location?.toLowerCase().includes(searchTerm)
      );
    }
    if (f.location?.trim()) {
      const loc = f.location.trim().toLowerCase();
      filtered = filtered.filter(
        (l) => l.location && l.location.toLowerCase().includes(loc)
      );
    }
    if (f.category && f.category !== 'all') {
      filtered = filtered.filter(
        (l) => l.category && l.category.toLowerCase() === f.category.toLowerCase()
      );
    }
    if (f.minPrice) {
      filtered = filtered.filter((l) => l.price >= parseInt(f.minPrice));
    }
    if (f.maxPrice) {
      filtered = filtered.filter((l) => l.price <= parseInt(f.maxPrice));
    }
    if (f.guests) {
      filtered = filtered.filter((l) => l.guests >= parseInt(f.guests));
    }
    if (f.amenities && f.amenities.length > 0) {
      filtered = filtered.filter((l) => {
        const listingAmenities = l.amenities
          ? Object.entries(l.amenities)
              .filter(([k, v]) => v)
              .map(([k]) => k)
          : [];
        return f.amenities.every((a) => listingAmenities.includes(a));
      });
    }
    return filtered;
  }, [listings, filters]);

  // Helper: count active filters (excluding empty/default values)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search?.trim()) count++;
    if (filters.location?.trim()) count++;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.guests) count++;
    if (Array.isArray(filters.amenities) && filters.amenities.length > 0) count++;
    return count;
  }, [filters]);

  // Helper to get filter chips
  const filterChips = [];
  if (filters.search)
    filterChips.push({ key: "search", label: `Search: "${filters.search}"` });
  if (filters.location)
    filterChips.push({
      key: "location",
      label: `Location: ${filters.location}`,
    });
  if (filters.category && filters.category !== "all")
    filterChips.push({ key: "category", label: `Type: ${filters.category}` });
  if (
    (filters.minPrice && parseInt(filters.minPrice) > 0) ||
    (filters.maxPrice && parseInt(filters.maxPrice) < 1000)
  )
    filterChips.push({
      key: "price",
      label: `Price: $${filters.minPrice || 0} - $${filters.maxPrice || 1000}`,
    });
  if (filters.guests && parseInt(filters.guests) > 1)
    filterChips.push({ key: "guests", label: `${filters.guests} guests` });
  if (filters.amenities && filters.amenities.length > 0)
    filterChips.push({
      key: "amenities",
      label: `${filters.amenities.length} amenities`,
    });
  if (filters.sortBy && filters.sortBy !== "relevance")
    filterChips.push({ key: "sortBy", label: `Sort: ${filters.sortBy}` });

  const removeFilter = (key) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      if (key === "price") {
        newFilters.minPrice = "";
        newFilters.maxPrice = "";
      } else if (key === "amenities") {
        newFilters.amenities = [];
      } else if (key === "category") {
        newFilters.category = "all";
      } else if (key === "sortBy") {
        newFilters.sortBy = "relevance";
      } else {
        newFilters[key] = "";
      }
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters(normalizeFilters());
  };

  // Demo: local wishlist state (replace with global/persisted in real app)
  const handleToggleWishlist = async (id) => {
    const result = await toggleWishlist(id, true, () => setShowLoginPrompt(true));
    if (!result?.success) {
      // You could show a toast or alert here
      console.error("Failed to toggle wishlist:", result?.message);
    }
  };

  // Helper to detect if user came from Home search (location param only, no other filters)
  // const isHomeSearch = !!route.params?.location;

  // Special clear for Home search
  // const clearHomeSearch = () => {
  //   navigation.navigate("Home");
  // };

  const handleScroll = useCallback((event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const paddingToBottom = 20;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    // Update scrollY for header animations
    scrollY.setValue(currentScrollY);

    // Header visibility logic with debounced detection
    const scrollThreshold = 20; // Reduced threshold for better responsiveness
    const scrollDifference = currentScrollY - lastScrollY;

    // Only trigger header changes if scroll is significant
    if (Math.abs(scrollDifference) > scrollThreshold) {
      if (scrollDifference > 0 && currentScrollY > 30) {
        // Scrolling down - hide header
        if (showHeader) {
          setShowHeader(false);
          Animated.spring(headerAnim, {
            toValue: 0,
            tension: 40, // Smoother, less snap
            friction: 18, // More damping, less bounce
            useNativeDriver: true,
          }).start();
        }
      } else if (scrollDifference < 0 && currentScrollY < 100) {
        // Scrolling up and near top - show header
        if (!showHeader) {
          setShowHeader(true);
          Animated.spring(headerAnim, {
            toValue: 1,
            tension: 40, // Smoother, less snap
            friction: 18, // More damping, less bounce
            useNativeDriver: true,
          }).start();
        }
      }
    }

    setLastScrollY(currentScrollY);

    // Footer animation only for search results with enough items
    if (isCloseToBottom && filteredListings.length > 5) {
      setShowFooter(true);
      // Trigger animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600, // Faster animation
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  }, [lastScrollY, showHeader, filteredListings.length, headerAnim, fadeAnim, scaleAnim, bounceAnim, scrollY]);

  const handleRefreshListings = () => {
    fetchListings();
    setShowFooter(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    bounceAnim.setValue(0);
  };

  const handleExploreMore = () => {
    navigation.navigate("Home");
  };

  // Login prompt handlers
  const handleLoginPrompt = () => {
    navigation.navigate('Login');
  };

  const handleLater = () => {
    // User chose to continue browsing without logging in
    // No action needed, just close the modal
  };

  // Helper to format date like Home page
  const formatDateDisplay = (date) => {
    if (!date) return "Date (YYYY-MM-DD)";
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (new Date(date).toDateString() === today.toDateString()) {
      return "Today";
    } else if (new Date(date).toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
    }
  };

  // Pagination logic for filtered listings
  const paginatedListings = filteredListings.slice(0, visibleCount);
  const hasMore = visibleCount < filteredListings.length;

  // Compute top 10 destinations by total views of their listings
  const destinationMap = {};
  listings.forEach((listing) => {
    const loc = listing.location?.trim();
    if (!loc) return;
    if (!destinationMap[loc]) {
      destinationMap[loc] = [];
    }
    destinationMap[loc].push(listing);
  });
  const topDestinations = Object.entries(destinationMap)
    .map(([location, listings]) => ({
      location,
      listings: listings
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5),
      total: listings.length,
      totalViews: listings.reduce((sum, l) => sum + (l.views || 0), 0),
    }))
    .sort((a, b) => b.totalViews - a.totalViews)
    .slice(0, 7);

  // Search logic
  const isSearching = !!filters.search?.trim();
  const searchTerm = filters.search?.trim();
  const searchedListings = isSearching ? filteredListings : [];

  // Render horizontal HomePostCard for a destination (no extra View, just the card)
  const renderDestinationCard = ({ item }) => (
    <HomePostCard
      title={item.title}
      location={item.location}
      price={`$${item.price}/night`}
      image={item.images?.[0]}
      style={{ width: 220, marginRight: 16 }}
      onPress={() => navigation.navigate("ListingDetail", { id: item._id })}
      bookingCount={item.bookingCount}
      rating={item.rating}
        wishlisted={wishlist.includes(item._id)}
        onToggleWishlist={() => handleToggleWishlist(item._id)}
      listingId={item._id}
    />
  );

  // Universal, place-agnostic attention-grabbing lines for top 10 destinations
  const destinationHeadlines = [
    "Top stays in ",
    "Unforgettable nights await in ",
    "Your next adventure starts in ",
    "Feel at home in ",
    "Best picks for your trip to ",
    "Discover comfort in ",
    "Handpicked homes in ",
    "Stay where memories are made in ",
    "Experience the best of ",
    "Find your perfect stay in ",
  ];

  // Render each destination section
  const renderDestinationSection = (dest, idx) => (
    <View key={dest.location} style={{ marginBottom: 24 }}>
      <Pressable
        onPress={() =>
          navigation.navigate("DestinationDetail", {
            location: dest.location,
          })
        }
        android_ripple={{ color: 'transparent', borderless: true }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginLeft: 18,
          marginBottom: 8,
          marginTop: 8,
          justifyContent: 'space-between',
          marginRight: 18,
        }}
          >
            <Text
              style={{
            fontSize: 18,
            fontWeight: "bold",
            color: COLORS.text,
            flex: 1,
          }}
        >
          {(destinationHeadlines[idx] || "Discover amazing stays in ") + dest.location}
            </Text>
        <MaterialIcons name="chevron-right" size={28} color={COLORS.primary} />
      </Pressable>
      <FlatList
        data={dest.listings}
        renderItem={renderDestinationCard}
        keyExtractor={(item) => item._id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 12, paddingRight: 12 }}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews
      />
            </View>
  );

  // Render search results vertical list
  const renderSearchResult = ({ item }) => (
    <HomePostCard
      title={item.title}
      location={item.location}
      price={`from $${item.price}`}
      image={item.images?.[0]}
      style={{ width: "100%", marginBottom: 16 }}
      onPress={() => navigation.navigate("ListingDetail", { id: item._id })}
      bookingCount={item.bookingCount}
      rating={item.rating}
      wishlisted={wishlist.includes(item._id)}
      onToggleWishlist={() => handleToggleWishlist(item._id)}
      listingId={item._id}
    />
  );

  // Expand search bar on tap
  const handleExpandSearch = () => {
    setSearchExpanded(true);
    setTimeout(() => {
      if (searchInputRef.current) searchInputRef.current.focus();
    }, 200);
  };
  // Collapse search bar on blur
  const handleCollapseSearch = () => {
    setSearchExpanded(false);
    setIsInputFocused(false);
  };

  // Collapse search bar on scroll if expanded
  const handleScrollWithCollapse = useCallback((event) => {
    // Update scrollY immediately for smooth animations
    scrollY.setValue(event.nativeEvent.contentOffset.y);
    
    // Debounce the search collapse to prevent rapid state changes
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Only collapse search if it's expanded and not focused
      if (searchExpanded && !isInputFocused) {
        setSearchExpanded(false);
        setIsInputFocused(false);
        if (searchInputRef.current) searchInputRef.current.blur();
      }
    }, 100); // Small delay to prevent rapid toggling
    
    // Call the main scroll handler
    handleScroll(event);
  }, [searchExpanded, isInputFocused, handleScroll, scrollY]);

  // Handler to collapse search bar when tapping outside
  const handleOutsidePress = () => {
    if (searchExpanded && !isInputFocused) {
      setSearchExpanded(false);
      setIsInputFocused(false);
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  // Collapsible Explore Stays header
  const renderExploreHeader = () => (
    <Animated.View
              style={{
        backgroundColor: "#fff",
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: "#f3e8ff",
        marginHorizontal: 18,
        marginTop: 45,
        marginBottom: 4,
        padding: 22,
        paddingHorizontal: 22,
        maxWidth: "95%",
                alignSelf: "center",
                shadowColor: COLORS.primary,
        shadowOpacity: 0.08,
        shadowRadius: 14,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
        height: headerHeight,
        justifyContent: "flex-end",
        alignItems: "center",
        paddingTop: 12,
        paddingBottom: 6,
      }}
    >
      {/* Masked Explore Stays title */}
      <View
                style={{
          alignSelf: "center",
          backgroundColor: "#fff",
          top: -16,
          paddingHorizontal: 16,
          zIndex: 2,
          marginBottom: 23,
        }}
      >
        <Animated.Text
          style={{
            fontSize: searchExpanded ? 28 : titleFontSize,
            fontWeight: "bold",
            color: COLORS.primary,
            letterSpacing: 0.2,
            textAlign: "center",
          }}
        >
          Explore Stays
        </Animated.Text>
      </View>
      {/* Search bar and filter button row */}
                <View
                  style={{
          flexDirection: "row",
                    alignItems: "center",
          justifyContent: "center",
          width: "100%",
          paddingHorizontal: 10,
                  }}
                >
        {/* Collapsed/Expanded pill search bar (unified style) */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "transparent",
                      borderRadius: 999,
                      borderWidth: 2,
                      borderColor: "#f3e8ff",
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      minHeight: 44,
                      minWidth: 220,
                      height: 48,
                      marginTop: 0,
                      flex: 1,
                      marginRight: 10,
                    }}
                  >
                    <Feather
                      name="search"
                      size={20}
                      color={COLORS.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    {searchExpanded ? (
                      <TextInput
                        ref={searchInputRef}
                    style={{
                          flex: 1,
                          fontSize: 18,
                          color: COLORS.text,
                          backgroundColor: "transparent",
                          paddingVertical: 0,
                        }}
                        placeholder="Search by city, title, or description"
                        placeholderTextColor={COLORS.textMuted}
                        value={filters.search}
                        onChangeText={(text) =>
                          setFilters((f) => ({ ...f, search: text, location: "" }))
                        }
                        onBlur={handleCollapseSearch}
                        onFocus={() => setIsInputFocused(true)}
                        returnKeyType="search"
                        autoFocus
                      />
                    ) : (
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={0.95}
                        onPress={handleExpandSearch}
                      >
                  <Text
                          style={{ fontSize: 18, color: (filters.search || filters.location) ? COLORS.text : COLORS.textMuted, fontWeight: "500" }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {filters.search ? filters.search : filters.location ? filters.location : 'Start your search'}
                  </Text>
                      </TouchableOpacity>
                    )}
                    {(filters.search || filters.location) && (
                      <TouchableOpacity
                        style={{ padding: 4, marginLeft: 4 }}
                        onPress={() => setFilters(normalizeFilters())}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x-circle" size={18} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
        {/* Filter button */}
        <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    style={{
              marginLeft: 12,
                      backgroundColor: COLORS.primary,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
                      justifyContent: "center",
              alignItems: "center",
              minHeight: 44,
              marginRight: 2,
                    }}
            onPress={() => setFilterModalVisible(true)}
                    activeOpacity={0.85}
                  >
            <Feather name="sliders" size={20} color="#fff" />
                  </TouchableOpacity>
          {activeFilterCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 2,
                right: 2,
                backgroundColor: COLORS.error || '#f43f5e',
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                paddingHorizontal: 4,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
                </View>
              </Animated.View>
  );

  // Main render
  return (
    <TouchableWithoutFeedback onPress={handleOutsidePress}>
      <View style={styles.container}>
        <AppHeader />
        {renderExploreHeader()}
        <RNScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={handleScrollWithCollapse}
          scrollEventThrottle={8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading listings...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Feather name="wifi-off" size={48} color={COLORS.textMuted} />
              <Text style={styles.errorTitle}>Failed to load listings</Text>
              <Text style={styles.errorSubtitle}>
                Please check your internet connection and try again
                    </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={fetchListings}
                activeOpacity={0.8}
              >
                <Feather name="refresh-cw" size={20} color="#fff" />
                <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
          ) : listings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="home" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No listings available</Text>
              <Text style={styles.emptySubtitle}>
                Check back later for new properties
              </Text>
            </View>
          ) : (
            <>
              {isAnyFilterActive
                ? (filteredListings.length > 0
                    ? <>
                        {(filters.search || filters.location) && (
                          <Text
                            style={{
                              fontSize: 20,
                              fontWeight: "bold",
                              color: COLORS.primary,
                              marginLeft: 18,
                              marginTop: 10,
                              marginBottom: 8,
                            }}
                          >
                            Stays in "{filters.search || filters.location}"
                          </Text>
                        )}
                        {filteredListings.map((item) => (
                          <React.Fragment key={item._id}>
                            {renderSearchResult({ item })}
                          </React.Fragment>
                        ))}
                      </>
                    : <Text style={{ fontSize: 18, fontWeight: "bold", color: COLORS.primary, marginBottom: 12, textAlign: 'center', marginTop: 32 }}>No stays found for your search.</Text>
                  )
                : topDestinations.map((item, index) => renderDestinationSection(item, index))
              }
            </>
          )}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        currentFilters={filters}
            onApply={(newFilters) => setFilters(newFilters)}
          />
          
      <LoginPromptModal
        visible={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        onLogin={handleLoginPrompt}
        onLater={handleLater}
      />
        </RNScrollView>
    </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: getResponsiveSize(60, 50, 64, 68),
    paddingHorizontal: 0,
  },
  headerCard: {
    padding: 20,
    backgroundColor: "#fcfcfd",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#f3e8ff",
    width: "100%",
    alignSelf: "center",
    marginTop: 48,
    marginBottom: 12,
    shadowColor: "#a21caf",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    color: COLORS.primary,
    fontSize: FONT_SIZES["4xl"],
    fontWeight: "bold",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterBtnText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: FONT_SIZES.base,
  },
  searchBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  empty: {
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 32,
    fontSize: FONT_SIZES.lg,
  },
  listContent: { paddingBottom: 32 },
  card: { marginBottom: 16 },
  clearBtn: { padding: 5 },
  activeFiltersCard: {
    backgroundColor: "#f8f6ff",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: "#e0d7fa",
    padding: 18,
    marginTop: 18,
    marginBottom: 14,
    shadowColor: "#a21caf",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: "90%",
    alignSelf: "center",
  },
  activeFiltersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  activeFiltersTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZES["xl"],
    fontWeight: "bold",
  },
  clearAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearAllButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: FONT_SIZES.base,
  },
  filterChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 2,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ede9fe",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#c4b5fd",
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: FONT_SIZES.sm,
  },
  staysCount: {
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  staysCountText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: FONT_SIZES.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorSubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
});

// Helper for chip colors
function chipColorStyle(key) {
  switch (key) {
    case "category":
      return { backgroundColor: "#ede9fe" };
    case "price":
      return { backgroundColor: "#d1fae5" };
    case "guests":
      return { backgroundColor: "#fef3c7" };
    case "sortBy":
      return { backgroundColor: "#f3f4f6" };
    case "location":
      return { backgroundColor: "#e0f2fe" };
    case "search":
      return { backgroundColor: "#fce7f3" };
    case "amenities":
      return { backgroundColor: "#e0e7ff" };
    default:
      return { backgroundColor: COLORS.backgroundSecondary };
  }
}

function chipTextColorStyle(key) {
  switch (key) {
    case "category":
      return { color: "#7c3aed", fontWeight: "bold" };
    case "price":
      return { color: "#047857", fontWeight: "bold" };
    case "guests":
      return { color: "#b45309", fontWeight: "bold" };
    case "sortBy":
      return { color: "#374151" };
    case "location":
      return { color: "#0369a1", fontWeight: "bold" };
    case "search":
      return { color: "#be185d", fontWeight: "bold" };
    case "amenities":
      return { color: "#3730a3", fontWeight: "bold" };
    default:
      return { color: COLORS.text };
  }
}

function chipTextColor(key) {
  switch (key) {
    case "category":
      return "#7c3aed";
    case "price":
      return "#047857";
    case "guests":
      return "#b45309";
    case "sortBy":
      return "#374151";
    case "location":
      return "#0369a1";
    case "search":
      return "#be185d";
    case "amenities":
      return "#3730a3";
    default:
      return COLORS.primary;
  }
}
