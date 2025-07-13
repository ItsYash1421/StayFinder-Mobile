import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";

const FEATURES = [
  {
    icon: (color, size) => <Feather name="shield" size={size} color={color} />,
    title: "Verified Listings",
    description:
      "Every property undergoes rigorous verification so you book with confidence.",
  },
  {
    icon: (color, size) => <Feather name="star" size={size} color={color} />,
    title: "Unique Stays",
    description:
      "Discover treehouses, boutique villas, and homes with character—no generic hotels.",
  },
  {
    icon: (color, size) => <Feather name="heart" size={size} color={color} />,
    title: "Personalized Matching",
    description: "AI-powered recommendations tailored to your travel style.",
  },
  {
    icon: (color, size) => <Feather name="globe" size={size} color={color} />,
    title: "Global Coverage",
    description: "120+ countries with local experts to guide your stay.",
  },
  {
    icon: (color, size) => <Feather name="tag" size={size} color={color} />,
    title: "Transparent Pricing",
    description: "No hidden fees—see the total cost upfront.",
  },
  {
    icon: (color, size) => <Feather name="key" size={size} color={color} />,
    title: "Instant Booking",
    description: "Secure your stay instantly with real-time availability.",
  },
];

const BADGES = [
  { label: "Rated 4.9/5 stars", value: "4.9/5" },
  { label: "10,000+ verified stays", value: "10,000+" },
  { label: "24/7 customer support", value: "24/7" },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MARGIN = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 3) / 2; // 2 cards + 3 margins
const ICON_SIZE = 26;

function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export default function WhyChooseUs() {
  const slides = chunkArray(FEATURES, 2);

  // Create seamless infinite loop by duplicating slides
  const seamlessSlides = [...slides, ...slides, ...slides]; // 3 copies for smooth looping

  const scrollRef = useRef(null);
  const currentIndex = useRef(slides.length); // Start at the middle copy
  const autoScrollTimeout = useRef(null);

  // Define autoScroll function first
  const autoScroll = () => {
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    autoScrollTimeout.current = setTimeout(() => {
      let nextIndex = currentIndex.current + 1;

      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
      }

      currentIndex.current = nextIndex;

      // Reset to middle section when reaching the end
      if (nextIndex >= slides.length * 2) {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              x: slides.length * SCREEN_WIDTH,
              animated: false,
            });
          }
          currentIndex.current = slides.length;
        }, 300);
      }

      autoScroll(); // Recursive call
    }, 4000);
  };

  // Simple auto-scroll logic
  useEffect(() => {
    let isUnmounted = false;

    // Start at the middle section for seamless loop
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          x: slides.length * SCREEN_WIDTH,
          animated: false,
        });
      }
    }, 100);

    // Start auto-scroll
    autoScroll();

    return () => {
      isUnmounted = true;
      if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    };
  }, [slides.length]);

  // Pause auto-scroll on manual interaction
  const handleScrollBeginDrag = () => {
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
  };

  const handleScrollEndDrag = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(x / SCREEN_WIDTH);
    currentIndex.current = slideIndex;

    // Resume auto-scroll after 5 seconds
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    autoScrollTimeout.current = setTimeout(() => {
      let nextIndex = currentIndex.current + 1;

      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          x: nextIndex * SCREEN_WIDTH,
          animated: true,
        });
      }

      currentIndex.current = nextIndex;

      // Reset to middle section when reaching the end
      if (nextIndex >= slides.length * 2) {
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              x: slides.length * SCREEN_WIDTH,
              animated: false,
            });
          }
          currentIndex.current = slides.length;
        }, 300);
      }

      // Continue auto-scroll
      if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
      autoScrollTimeout.current = setTimeout(() => {
        autoScroll();
      }, 4000);
    }, 5000);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        Why <Text style={{ color: COLORS.primary }}>StayFindz</Text> Stands Out
      </Text>
      <Text style={styles.subtitle}>
        We redefine travel by focusing on what really matters—authentic
        experiences and peace of mind.
      </Text>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {seamlessSlides.map((slide, slideIdx) => (
          <View key={slideIdx} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={styles.cardsRow}>
              {slide.map((feature, idx) => (
                <View key={idx} style={styles.card}>
                  <View style={styles.iconCircle}>
                    {feature.icon(COLORS.primary, ICON_SIZE)}
                  </View>
                  <Text style={styles.cardTitle}>{feature.title}</Text>
                  <Text style={styles.cardDesc}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.badgesRow}>
        {BADGES.map((badge, idx) => (
          <View key={idx} style={styles.badge}>
            <Text style={styles.badgeValue}>{badge.value}</Text>
            <Text style={styles.badgeLabel}>{badge.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#fff",
    paddingVertical: 28,
    paddingHorizontal: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginLeft: 20,
    marginBottom: 16,
  },
  carousel: {
    paddingBottom: 8,
  },
  slide: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_MARGIN,
  },
  cardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + "18",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "11",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
    textAlign: "center",
  },
  cardDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
  badgesRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 18,
    gap: 12,
  },
  badge: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 6,
    marginVertical: 4,
  },
  badgeValue: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 15,
  },
  badgeLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
});
