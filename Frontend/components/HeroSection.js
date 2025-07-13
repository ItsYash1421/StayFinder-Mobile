import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { COLORS } from "../constants/theme";
import CustomDatePickerModal from "./CustomDatePickerModal";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { api } from "../constants/api";

const { width } = Dimensions.get("window");

const TAGS = [
  "Beachfront",
  "Mountain View",
  "Luxury",
  "Budget",
  "Family Friendly",
];

// Wave Animation Component
const WaveAnimation = () => {
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const wave3Anim = useRef(new Animated.Value(0)).current;
  const wave4Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startWaveAnimation = () => {
      // Wave 1 - 30s linear infinite
      Animated.loop(
        Animated.timing(wave1Anim, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: false,
        })
      ).start();

      // Wave 2 - 15s linear infinite, reverse direction
      Animated.loop(
        Animated.timing(wave2Anim, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: false,
        })
      ).start();

      // Wave 3 - 30s linear infinite
      Animated.loop(
        Animated.timing(wave3Anim, {
          toValue: 1,
          duration: 30000,
          useNativeDriver: false,
        })
      ).start();

      // Wave 4 - 5s linear infinite, reverse direction
      Animated.loop(
        Animated.timing(wave4Anim, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: false,
        })
      ).start();
    };

    startWaveAnimation();
  }, []);

  const wave1TranslateX = wave1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1000],
  });

  const wave2TranslateX = wave2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000],
  });

  const wave3TranslateX = wave3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1000],
  });

  const wave4TranslateX = wave4Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1000],
  });

  return (
    <View style={styles.waveContainer}>
      {/* Wave 1 */}
      <Animated.View
        style={[
          styles.wave,
          styles.wave1,
          {
            transform: [{ translateX: wave1TranslateX }],
          },
        ]}
      />
      {/* Wave 2 */}
      <Animated.View
        style={[
          styles.wave,
          styles.wave2,
          {
            transform: [{ translateX: wave2TranslateX }],
          },
        ]}
      />
      {/* Wave 3 */}
      <Animated.View
        style={[
          styles.wave,
          styles.wave3,
          {
            transform: [{ translateX: wave3TranslateX }],
          },
        ]}
      />
      {/* Wave 4 */}
      <Animated.View
        style={[
          styles.wave,
          styles.wave4,
          {
            transform: [{ translateX: wave4TranslateX }],
          },
        ]}
      />
    </View>
  );
};

export default function HeroSection({ onSearch, listings = [] }) {
  console.log('HeroSection listings:', listings);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [guests, setGuests] = useState(null);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Fetch unique locations from backend on mount
  useEffect(() => {
    let mounted = true;
    setLocationsLoading(true);
    api.get("/api/listings/locations")
      .then(res => {
        if (mounted && Array.isArray(res.data.locations)) {
          setAllLocations(res.data.locations.filter(Boolean));
        }
      })
      .catch(err => {
        // fallback to extracting from listings if API fails
        setAllLocations(Array.from(new Set(listings.map((l) => l.location && l.location.trim()).filter(Boolean))));
      })
      .finally(() => {
        if (mounted) setLocationsLoading(false);
      });
    return () => { mounted = false; };
  }, [listings]);

  // Use allLocations for suggestions
  const destinations = allLocations;
  // Improved fuzzy/word-based suggestions
  const input = location.trim().toLowerCase();
  let wordStartsWithMatches = [];
  let includesMatches = [];
  if (input) {
    wordStartsWithMatches = destinations.filter((d) =>
      d
        .toLowerCase()
        .split(/\s|,|-/)
        .some((word) => word.startsWith(input))
    );
    includesMatches = destinations.filter((d) =>
      !wordStartsWithMatches.includes(d) &&
      d.toLowerCase().includes(input)
    );
  }
  const suggestions = input
    ? [...wordStartsWithMatches, ...includesMatches].slice(0, 3)
    : [];

  const formatDateDisplay = (date) => {
    if (!date) return "Select dates";
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        weekday: "short",
      });
    }
  };

  const guestPlaceholder = guests
    ? `${guests} guest${guests > 1 ? "s" : ""}`
    : "Guests";

  return (
    <View style={styles.gradientBg}>
      <WaveAnimation />
      <ScrollView
        contentContainerStyle={styles.heroContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Find Your Perfect Stay</Text>
        <Text style={styles.subtitle}>
          Discover unique places to stay around the world with our curated
          selection of hotels
        </Text>
        <View style={styles.tagsRow}>
          {TAGS.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={styles.searchBox}>
          <View style={{ position: 'relative' }}>
            <TextInput
              style={styles.input}
              placeholder="Where are you going?"
              placeholderTextColor="#888"
              value={location}
              onChangeText={setLocation}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setTimeout(() => setIsInputFocused(false), 150)}
              autoCorrect={false}
              autoCapitalize="words"
            />
            {/* Suggestions dropdown */}
            {isInputFocused && location.trim() && (
              <View style={{
                position: 'absolute',
                top: 48,
                left: 0,
                right: 0,
                backgroundColor: '#fff',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#eee',
                zIndex: 100,
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 20,
                minHeight: 10,
              }}>
                {locationsLoading ? (
                  <Text style={{ padding: 16, color: COLORS.textMuted, textAlign: 'center' }}>Loading suggestions...</Text>
                ) : suggestions.length > 0 ? (
                  suggestions.map((dest, idx) => (
                    <TouchableOpacity
                      key={dest}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderBottomWidth: idx !== suggestions.length - 1 ? 1 : 0,
                        borderBottomColor: '#f3f3f3',
                      }}
                      activeOpacity={0.85}
                      onPress={() => {
                        setLocation(dest);
                        setIsInputFocused(false);
                        onSearch && onSearch({ search: dest, date, guests });
                      }}
                    >
                      <Feather name="map-pin" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 16, color: COLORS.text }}>{dest}</Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={{ padding: 16, color: COLORS.textMuted, textAlign: 'center' }}>No destinations found</Text>
                )}
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.8}
          >
            <Text style={{ color: date ? COLORS.text : "#888", fontSize: 15 }}>
              {formatDateDisplay(date)}
            </Text>
            <Feather name="calendar" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.input,
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              },
            ]}
            onPress={() => setShowGuestPicker(true)}
            activeOpacity={0.8}
          >
            <Text
              style={{ color: guests ? COLORS.text : "#888", fontSize: 15 }}
            >
              {guestPlaceholder}
            </Text>
            <Feather name="users" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() =>
              onSearch && onSearch({ search: location.trim(), date, guests })
            }
          >
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trustRow}>
          <Text style={styles.trustText}>Verified properties</Text>
          <Text style={styles.trustText}>24/7 customer support</Text>
          <Text style={styles.trustText}>Best price guarantee</Text>
        </View>
      </ScrollView>
      <CustomDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelect={(selectedDate) => {
          setDate(selectedDate);
          setShowDatePicker(false);
        }}
        type="checkIn"
      />
      {/* Guest Picker Modal with Blur */}
      <Modal
        visible={showGuestPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGuestPicker(false)}
      >
        {Platform.OS === "android" ? (
          <BlurView intensity={-10} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Number of Guests</Text>
                <TouchableOpacity
                  onPress={() => setShowGuestPicker(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <ScrollView
                contentContainerStyle={styles.guestListContainer}
                showsVerticalScrollIndicator={false}
              >
                {[...Array(10)].map((_, i) => (
                  <TouchableOpacity
                    key={i + 1}
                    style={[
                      styles.guestOption,
                      guests === i + 1 && styles.guestOptionSelected,
                    ]}
                    onPress={() => {
                      setGuests(i + 1);
                      setShowGuestPicker(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.guestOptionLabel,
                        guests === i + 1 && styles.guestOptionLabelSelected,
                      ]}
                    >
                      {i + 1} guest{i !== 0 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  marginTop: 10,
                  paddingVertical: 10,
                  backgroundColor: COLORS.backgroundSecondary,
                  borderRadius: 8,
                  paddingHorizontal: 24,
                }}
                onPress={() => setShowGuestPicker(false)}
              >
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        ) : (
          <BlurView intensity={30} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Number of Guests</Text>
                <TouchableOpacity
                  onPress={() => setShowGuestPicker(false)}
                  style={styles.closeButton}
                >
                  <Feather name="x" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <ScrollView
                contentContainerStyle={styles.guestListContainer}
                showsVerticalScrollIndicator={false}
              >
                {[...Array(10)].map((_, i) => (
                  <TouchableOpacity
                    key={i + 1}
                    style={[
                      styles.guestOption,
                      guests === i + 1 && styles.guestOptionSelected,
                    ]}
                    onPress={() => {
                      setGuests(i + 1);
                      setShowGuestPicker(false);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.guestOptionLabel,
                        guests === i + 1 && styles.guestOptionLabelSelected,
                      ]}
                    >
                      {i + 1} guest{i !== 0 ? "s" : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={{
                  alignItems: "center",
                  marginTop: 10,
                  paddingVertical: 10,
                  backgroundColor: COLORS.backgroundSecondary,
                  borderRadius: 8,
                  paddingHorizontal: 24,
                }}
                onPress={() => setShowGuestPicker(false)}
              >
                <Text
                  style={{
                    color: COLORS.primary,
                    fontWeight: "bold",
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    backgroundColor: COLORS.primary,
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  heroContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 18,
    textAlign: "center",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 18,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    color: "#fff",
    fontSize: 13,
  },
  searchBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
    marginBottom: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  trustText: {
    color: "#fff",
    fontSize: 13,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  guestModalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  guestModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: 280,
    alignItems: "center",
  },
  guestModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: COLORS.text,
  },
  guestOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginVertical: 2,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    minWidth: 180,
  },
  guestOptionSelected: {
    backgroundColor: "rgba(244,63,94,0.10)", // Soft primary color
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  guestOptionLabel: {
    fontSize: 17,
    color: COLORS.text,
    fontWeight: "500",
  },
  guestOptionLabelSelected: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  guestCheckIcon: {
    marginLeft: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  androidFrosted: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(0,0,0,0.10)",
    borderWidth: 0.5,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
  guestListContainer: {
    width: "100%",
    alignItems: "center",
  },
  waveContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  wave: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wave1: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  wave2: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  wave3: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  wave4: {
    backgroundColor: "rgba(255,255,255,0.4)",
  },
});
