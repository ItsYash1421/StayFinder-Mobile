import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { COLORS } from "../constants/theme";
import {
  Feather,
  AntDesign,
} from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const STEPS = [
  {
    icon: (color, size) => <Feather name="search" size={size} color={color} />,
    title: "Search Smart",
    description: "Use our AI-powered filters to find exactly what you want",
    highlight: "100+ filters available",
  },
  {
    icon: (color, size) => <Feather name="calendar" size={size} color={color} />,
    title: "Book Seamlessly",
    description: "Instant booking or request with 24-hour response guarantee",
    highlight: "No booking fees",
  },
  {
    icon: (color, size) => <Feather name="key" size={size} color={color} />,
    title: "Enjoy Your Stay",
    description: "Access digital guidebooks and 24/7 support during your trip",
    highlight: "Local tips included",
  },
  {
    icon: (color, size) => <AntDesign name="staro" size={size} color={color} />,
    title: "Share Your Experience",
    description: "Rewards for reviews & help our community grow",
    highlight: "Loyalty program",
  },
];

const CARD_WIDTH = 220;
const CARD_MARGIN = 28;
const ICON_SIZE = 28;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HowItWorks() {
  const anims = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const currentIndex = useRef(0);
  const autoScrollTimeout = useRef(null);
  const scheduleNextScrollRef = useRef();

  // Remove duplicate card logic; use only real cards
  const carouselData = STEPS;

  // Helper for smooth auto-scroll
  const smoothScrollTo = (index) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        x: index * (CARD_WIDTH + CARD_MARGIN),
        animated: true,
      });
    }
  };

  // Auto-scroll logic (smooth, no glitches)
  scheduleNextScrollRef.current = () => {
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    autoScrollTimeout.current = setTimeout(() => {
      let nextIndex = currentIndex.current + 1;
      if (nextIndex >= STEPS.length) {
        nextIndex = 0;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ x: 0, animated: false });
        }
      } else {
        smoothScrollTo(nextIndex);
      }
      currentIndex.current = nextIndex;
      scheduleNextScrollRef.current();
    }, 3200);
  };

  useEffect(() => {
    Animated.stagger(
      180,
      anims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      )
    ).start();
    scheduleNextScrollRef.current();
    return () => {
      if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    };
  }, []);

  // Pause auto-scroll on manual scroll, then resume after delay
  const handleScrollBeginDrag = () => {
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
  };
  const handleScrollEndDrag = (event) => {
    const x = event.nativeEvent.contentOffset.x;
    currentIndex.current = Math.round(x / (CARD_WIDTH + CARD_MARGIN));
    if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
    autoScrollTimeout.current = setTimeout(() => {
      let nextIndex = currentIndex.current + 1;
      if (nextIndex >= STEPS.length) {
        nextIndex = 0;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ x: 0, animated: false });
        }
      } else {
        smoothScrollTo(nextIndex);
      }
      currentIndex.current = nextIndex;
      // Resume auto-scroll
      if (autoScrollTimeout.current) clearTimeout(autoScrollTimeout.current);
      autoScrollTimeout.current = setTimeout(() => {
        scheduleNextScrollRef.current();
      }, 3200);
    }, 3500);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        How <Text style={{ color: COLORS.primary }}>StayFindz</Text> Works
      </Text>
      <Text style={styles.subtitle}>
        From dream to destination in just a few clicks
      </Text>
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsList}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        pagingEnabled={false}
        bounces={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
      >
        {carouselData.map((step, idx) => {
          const scale = scrollX.interpolate({
            inputRange: [
              (idx - 2) * (CARD_WIDTH + CARD_MARGIN),
              (idx - 1) * (CARD_WIDTH + CARD_MARGIN),
              idx * (CARD_WIDTH + CARD_MARGIN),
              (idx + 1) * (CARD_WIDTH + CARD_MARGIN),
              (idx + 2) * (CARD_WIDTH + CARD_MARGIN),
            ],
            outputRange: [0.95, 0.98, 1, 0.98, 0.95],
            extrapolate: "clamp",
          });
          const iconPulse = scrollX.interpolate({
            inputRange: [
              (idx - 2) * (CARD_WIDTH + CARD_MARGIN),
              (idx - 1) * (CARD_WIDTH + CARD_MARGIN),
              idx * (CARD_WIDTH + CARD_MARGIN),
              (idx + 1) * (CARD_WIDTH + CARD_MARGIN),
              (idx + 2) * (CARD_WIDTH + CARD_MARGIN),
            ],
            outputRange: [1, 1.04, 1.12, 1.04, 1],
            extrapolate: "clamp",
          });
          return (
            <Animated.View
              key={idx}
              style={[
                styles.stepCard,
                {
                  transform: [
                    { scale },
                  ],
                },
              ]}
            >
              <Pressable style={{ flex: 1 }}>
                <Animated.View style={[styles.iconCircle, { transform: [{ scale: iconPulse }] }]}
                >
                  {step.icon(COLORS.primary, ICON_SIZE)}
                </Animated.View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.description}</Text>
                <Text style={styles.stepHighlight}>{step.highlight}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.backgroundSecondary,
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
  stepsList: {
    paddingHorizontal: 12,
    paddingBottom: 4,
    alignItems: "center",
  },
  stepCard: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + "18",
    overflow: "hidden",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "11",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    alignSelf: "center",
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
    textAlign: "center",
  },
  stepDesc: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 6,
    textAlign: "center",
  },
  stepHighlight: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "500",
    backgroundColor: COLORS.primary + "10",
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
});
