import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
} from "react-native";
import { COLORS, getGridColumns, getResponsiveSize, FONT_SIZES, SPACING, getShadow, isTablet, isLargeTablet } from "../constants/theme";
import { api } from "../constants/api";
import PostCard from "../components/PostCard";
import { useNavigation, useRoute } from "@react-navigation/native";
import FilterModal from "../components/FilterModal";
import { Feather } from "@expo/vector-icons";
import AppHeader from "../components/AppHeader";
import { ScrollView as RNScrollView } from "react-native";
import useWishlist from "../hooks/useWishlist";
import CustomDatePickerModal from '../components/CustomDatePickerModal';

// Use responsive grid columns instead of hardcoded tablet detection
const gridColumns = getGridColumns();

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

const defaultFilters = normalizeFilters();

export default function ExploreScreen() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [showFooter, setShowFooter] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { wishlist, toggleWishlist } = useWishlist();

  // Animation refs for end message
  const headerAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

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

  // Filtering logic
  const filteredListings = React.useMemo(() => {
    let filtered = [...listings];
    // Only use filters state for filtering
    const f = Object.fromEntries(
      Object.entries(filters).filter(
        ([, v]) =>
          v !== null &&
          v !== undefined &&
          v !== "" &&
          !(Array.isArray(v) && v.length === 0)
      )
    );
    if (f.search) {
      const searchTerm = f.search.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title?.toLowerCase().includes(searchTerm) ||
          l.description?.toLowerCase().includes(searchTerm) ||
          l.location?.toLowerCase().includes(searchTerm)
      );
    }
    if (f.location) {
      const searchLoc = f.location.trim().toLowerCase();
      filtered = filtered.filter(
        (l) => l.location && l.location.trim().toLowerCase().includes(searchLoc)
      );
    }
    if (f.destination) {
      filtered = filtered.filter(
        (l) =>
          l.title && l.title.toLowerCase().includes(f.destination.toLowerCase())
      );
    }
    if (f.category && f.category !== "all") {
      filtered = filtered.filter(
        (l) =>
          l.title?.toLowerCase().includes(f.category.toLowerCase()) ||
          l.description?.toLowerCase().includes(f.category.toLowerCase())
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
    if (f.sortBy) {
      switch (f.sortBy) {
        case "price-low":
          filtered.sort((a, b) => a.price - b.price);
          break;
        case "price-high":
          filtered.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case "newest":
          filtered.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          break;
        case "popular":
          filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
          break;
        default:
          break;
      }
    }
    return filtered;
  }, [listings, filters]);

  const activeFilterCount = Object.values(filters).filter((v) =>
    Array.isArray(v) ? v.length > 0 : v && v !== "all" && v !== "relevance"
  ).length;

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
    setFilters(prev => {
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
    setFilters(defaultFilters);
  };

  // Demo: local wishlist state (replace with global/persisted in real app)
  const handleToggleWishlist = async (id) => {
    const result = await toggleWishlist(id);
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

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const currentScrollY = contentOffset.y;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
      contentSize.height - paddingToBottom;
    
    // Header visibility logic with improved detection
    const scrollThreshold = 30; // Minimum scroll distance to trigger
    const scrollDifference = currentScrollY - lastScrollY;
    
    if (Math.abs(scrollDifference) > scrollThreshold) {
      if (scrollDifference > 0 && currentScrollY > 50) {
        // Scrolling down and past initial area - hide header
        if (showHeader) {
          setShowHeader(false);
          Animated.timing(headerAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      } else if (scrollDifference < 0) {
        // Scrolling up - show header
        if (!showHeader) {
          setShowHeader(true);
          Animated.timing(headerAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }).start();
        }
      }
    }
    
    setLastScrollY(currentScrollY);
    
    if (isCloseToBottom && filteredListings.length > 0) {
      setShowFooter(true);
      // Trigger animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(bounceAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(bounceAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    }
  };

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

  // Helper to format date like Home page
  const formatDateDisplay = (date) => {
    if (!date) return 'Date (YYYY-MM-DD)';
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    if (new Date(date).toDateString() === today.toDateString()) {
      return 'Today';
    } else if (new Date(date).toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'short',
      });
    }
  };

  // FlatList renderItem
  const renderGridItem = useCallback(({ item }) => (
    <PostCard
      {...item}
      image={item.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
      wishlisted={wishlist.includes(item._id)}
      onToggleWishlist={() => handleToggleWishlist(item._id)}
      onPress={() =>
        navigation.navigate("ListingDetail", {
          id: item._id,
        })
      }
      style={[styles.card, { width: '95%', alignSelf: 'center', marginHorizontal: 0 }]}
    />
  ), [wishlist, handleToggleWishlist, gridColumns, navigation]);

  // Memoize the ListHeaderComponent to prevent remounts and input blur
  const renderListHeader = useMemo(() => (
    <View style={styles.headerCard}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Explore Stays</Text>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterModalVisible(true)}>
          <Feather name="sliders" size={20} color="#fff" />
          <Text style={styles.filterBtnText}>Filters</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.searchBarRow}>
        <Feather name="map-pin" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Where to? (Location)"
          placeholderTextColor={COLORS.textMuted}
          value={filters.location}
          onChangeText={text => setFilters(f => ({ ...f, location: text }))}
          onBlur={() => setFilters(f => ({ ...f, location: f.location.trim() }))}
          returnKeyType="search"
        />
        {!!filters.location && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setFilters(f => ({ ...f, location: '' }))}
          >
            <Feather name="x-circle" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.searchBarRow}>
        <Feather name="calendar" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
        <TouchableOpacity
          style={[styles.searchInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 6 }]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={{ color: filters.date ? COLORS.text : COLORS.textMuted, fontSize: 15 }}>
            {formatDateDisplay(filters.date)}
          </Text>
          {filters.date ? (
            <TouchableOpacity
              onPress={() => setFilters(f => ({ ...f, date: '' }))}
              style={{ marginLeft: 6 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x-circle" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>
      {/* Active Filters Section */}
      {filterChips.length > 0 && (
        <View style={styles.activeFiltersCard}>
          <View style={styles.activeFiltersHeader}>
            <Text style={styles.activeFiltersTitle}>Active Filters</Text>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={clearAllFilters}
              activeOpacity={0.8}
            >
              <Feather name="refresh-cw" size={16} color="#fff" />
              <Text style={styles.clearAllButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterChipsRow}>
            {filterChips.map((chip) => (
              <TouchableOpacity
                key={chip.key}
                style={[styles.filterChip, chipColorStyle(chip.key)]}
                onPress={() => removeFilter(chip.key)}
              >
                <Text style={[styles.filterChipText, chipTextColorStyle(chip.key)]}>
                  {chip.label}
                </Text>
                <Feather
                  name="x"
                  size={14}
                  color={chipTextColor(chip.key)}
                  style={{ marginLeft: 6 }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {/* Stays found count */}
      <View style={styles.staysCount}>
        <Feather name="check-circle" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
        <Text style={styles.staysCountText}>{filteredListings.length} stays found</Text>
      </View>
    </View>
  ), [filters, filterChips, filteredListings.length, setFilterModalVisible, setShowDatePicker, clearAllFilters, removeFilter]);

  return (
    <View style={styles.container}>
      <AppHeader />
      <FlatList
        data={filteredListings}
        renderItem={renderGridItem}
        keyExtractor={item => item._id}
        numColumns={gridColumns}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={{ width: '100%', alignSelf: 'center', paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={7}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
        ) : (
          <Text style={styles.empty}>No listings found.</Text>
        )}
      />
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setFilters}
        onClear={clearAllFilters}
        initialFilters={{ ...filters }}
      />
      <CustomDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={selectedDate => {
          setFilters(f => ({ ...f, date: selectedDate.toISOString().split('T')[0] }));
          setShowDatePicker(false);
        }}
        type="checkIn"
      />
    </View>
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
    width: '100%',
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
  title: { color: COLORS.primary, fontSize: FONT_SIZES['4xl'], fontWeight: "bold" },
  filterBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
  filterBtnText: { color: "#fff", fontWeight: "bold", marginLeft: 8, fontSize: FONT_SIZES.base },
  searchBarRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: "#ececec", borderRadius: 10, backgroundColor: "#fff", fontSize: 15 },
  empty: { color: COLORS.textMuted, textAlign: "center", marginTop: 32, fontSize: FONT_SIZES.lg },
  listContent: { paddingBottom: 32 },
  card: { marginBottom: 16 },
  clearBtn: { padding: 5 },
  activeFiltersCard: {
    backgroundColor: '#f8f6ff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#e0d7fa',
    padding: 18,
    marginTop: 18,
    marginBottom: 14,
    shadowColor: '#a21caf',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    width: '90%',
    alignSelf: 'center',
  },
  activeFiltersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  activeFiltersTitle: {
    color: COLORS.primary,
    fontSize: FONT_SIZES['xl'],
    fontWeight: 'bold',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: FONT_SIZES.base,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: FONT_SIZES.sm,
  },
  staysCount: {
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  staysCountText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: FONT_SIZES.base,
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
 
