import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  COLORS,
  getModalWidth,
  getResponsiveSize,
  FONT_SIZES,
  SPACING,
  getShadow,
} from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function FilterModal({
  visible,
  onClose,
  onApply,
  currentFilters = {},
}) {
  const [filters, setFilters] = useState(currentFilters);

  const categories = [
    "all",
    "Beach",
    "Mountain",
    "City",
    "Countryside",
    "Luxury",
    "Budget",
    "Historical",
    "Adventure",
  ];
  const amenities = [
    "wifi",
    "kitchen",
    "parking",
    "tv",
    "fireplace",
    "balcony",
    "heating",
    "bbq",
  ];

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleAmenity = (amenity) => {
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...(prev.amenities || []), amenity],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const cleared = {
      search: "",
      category: "all",
      minPrice: "",
      maxPrice: "",
      guests: "",
      amenities: [],
      sortBy: "relevance",
    };
    setFilters(cleared);
    onApply(cleared);
    onClose();
  };

  return (
    <View style={[styles.overlay, { display: visible ? "flex" : "none" }]}>
      <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.modal}>
        <View style={styles.headerRow}>
          <Text style={styles.header}>Filters</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather
              name="x"
              size={getResponsiveSize(20, 22, 24, 26)}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search */}
          <Text style={styles.label}>Search</Text>
          <TextInput
            style={styles.input}
            placeholder="Search properties..."
            value={filters.search || ""}
            onChangeText={(text) => updateFilter("search", text)}
          />

          {/* Price Range */}
          <Text style={styles.label}>Price Range</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.inputSmall}
              placeholder="Min"
              keyboardType="numeric"
              value={filters.minPrice || ""}
              onChangeText={(text) => updateFilter("minPrice", text)}
            />
            <Text
              style={{ marginHorizontal: getResponsiveSize(8, 10, 12, 14) }}
            >
              -
            </Text>
            <TextInput
              style={styles.inputSmall}
              placeholder="Max"
              keyboardType="numeric"
              value={filters.maxPrice || ""}
              onChangeText={(text) => updateFilter("maxPrice", text)}
            />
          </View>

          {/* Guests */}
          <Text style={styles.label}>Guests</Text>
          <TextInput
            style={styles.inputSmall}
            placeholder="Number of guests"
            keyboardType="numeric"
            value={filters.guests || ""}
            onChangeText={(text) => updateFilter("guests", text)}
          />

          {/* Categories */}
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catBtn,
                  filters.category === cat && styles.catBtnActive,
                ]}
                onPress={() => updateFilter("category", cat)}
              >
                <Text
                  style={[
                    styles.catBtnText,
                    filters.category === cat && {
                      color: COLORS.primary,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Amenities */}
          <Text style={styles.label}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map((amenity) => (
              <TouchableOpacity
                key={amenity}
                style={[
                  styles.amenityBtn,
                  filters.amenities?.includes(amenity) &&
                    styles.amenityBtnActive,
                ]}
                onPress={() => toggleAmenity(amenity)}
              >
                <Text
                  style={[
                    styles.amenityBtnText,
                    filters.amenities?.includes(amenity) && {
                      color: COLORS.primary,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort By */}
          <Text style={styles.label}>Sort By</Text>
          <View style={styles.sortRow}>
            {["relevance", "price-low", "price-high", "rating"].map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[
                  styles.sortBtn,
                  filters.sortBy === sort && styles.sortBtnActive,
                ]}
                onPress={() => updateFilter("sortBy", sort)}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    filters.sortBy === sort && {
                      color: COLORS.primary,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {sort
                    .replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyBtnText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    width: getModalWidth(),
    maxHeight: SCREEN_HEIGHT * 0.95,
    minHeight: getResponsiveSize(220, 300, 400, 450),
    backgroundColor: "#fff",
    borderRadius: getResponsiveSize(10, 14, 18, 22),
    padding: getResponsiveSize(8, 12, 16, 20),
    ...getShadow("lg"),
    flexShrink: 1,
    alignSelf: "center",
    marginTop: getResponsiveSize(4, 8, 12, 16),
    marginBottom: getResponsiveSize(4, 8, 12, 16),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: getResponsiveSize(8, 10, 12, 14),
  },
  header: {
    fontSize: FONT_SIZES["2xl"],
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeBtn: {
    padding: getResponsiveSize(8, 10, 12, 14),
  },
  content: {
    flexGrow: 1,
    minHeight: getResponsiveSize(200, 250, 300, 350),
  },
  label: {
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: getResponsiveSize(6, 8, 10, 12),
    marginBottom: getResponsiveSize(2, 4, 6, 8),
    fontSize: getResponsiveSize(13, 14, 15, 16),
  },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    padding: getResponsiveSize(8, 10, 12, 14),
    fontSize: getResponsiveSize(13, 14, 15, 16),
    color: COLORS.text,
    marginBottom: getResponsiveSize(4, 6, 8, 10),
  },
  inputSmall: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    padding: getResponsiveSize(8, 10, 12, 14),
    fontSize: getResponsiveSize(13, 14, 15, 16),
    color: COLORS.text,
    width: getResponsiveSize(60, 70, 80, 90),
    textAlign: "center",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: getResponsiveSize(6, 8, 10, 12),
  },
  categoriesScroll: {
    marginBottom: getResponsiveSize(10, 12, 14, 16),
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8, 10),
    paddingHorizontal: getResponsiveSize(8, 10, 12, 14),
    marginRight: getResponsiveSize(4, 6, 8, 10),
  },
  catBtnActive: {
    backgroundColor: COLORS.primary + "11",
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  catBtnText: {
    marginLeft: getResponsiveSize(3, 4, 6, 8),
    fontWeight: "500",
    color: COLORS.text,
    fontSize: getResponsiveSize(12, 13, 14, 15),
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: getResponsiveSize(4, 6, 8, 10),
    marginBottom: getResponsiveSize(4, 6, 8, 10),
  },
  amenityBtn: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8, 10),
    paddingHorizontal: getResponsiveSize(8, 10, 12, 14),
    marginRight: getResponsiveSize(4, 6, 8, 10),
    marginBottom: getResponsiveSize(4, 6, 8, 10),
  },
  amenityBtnActive: {
    backgroundColor: COLORS.primary + "11",
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  amenityBtnText: {
    color: COLORS.text,
    fontSize: getResponsiveSize(12, 13, 14, 15),
  },
  sortRow: {
    flexDirection: "row",
    gap: getResponsiveSize(4, 6, 8, 10),
    marginBottom: getResponsiveSize(10, 12, 16, 18),
  },
  sortBtn: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(4, 6, 8, 10),
    paddingHorizontal: getResponsiveSize(8, 10, 12, 14),
  },
  sortBtnActive: {
    backgroundColor: COLORS.primary + "11",
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  sortBtnText: {
    color: COLORS.text,
    fontSize: getResponsiveSize(12, 13, 14, 15),
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: getResponsiveSize(6, 8, 10, 12),
  },
  resetBtn: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(8, 10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 14, 16, 18),
  },
  resetBtnText: {
    color: COLORS.text,
    fontWeight: "bold",
    fontSize: getResponsiveSize(14, 15, 16, 17),
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: getResponsiveSize(6, 8, 10, 12),
    paddingVertical: getResponsiveSize(8, 10, 12, 14),
    paddingHorizontal: getResponsiveSize(12, 14, 16, 18),
  },
  applyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: getResponsiveSize(14, 15, 16, 17),
  },
});
