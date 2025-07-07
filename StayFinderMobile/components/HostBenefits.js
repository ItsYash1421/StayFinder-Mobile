import React, { useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { COLORS } from "../constants/theme";
import {
  FontAwesome,
  Feather,
  MaterialIcons,
  AntDesign,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";

const BENEFITS = [
  {
    icon: (color, size) => (
      <Feather name="trending-up" size={size} color={color} />
    ),
    title: "Maximize Earnings",
    description:
      "Our smart pricing tool adjusts rates based on demand, seasonality, and local events",
    stat: "30% higher average income",
  },
  {
    icon: (color, size) => <Feather name="shield" size={size} color={color} />,
    title: "Full Protection",
    description:
      "$1M property damage protection and liability coverage included at no extra cost",
    stat: "Risk-free hosting",
  },
  {
    icon: (color, size) => <Feather name="zap" size={size} color={color} />,
    title: "Instant Visibility",
    description: "Get listed in our global marketplace within minutes",
    stat: "2M+ monthly travelers",
  },
  {
    icon: (color, size) => <Feather name="users" size={size} color={color} />,
    title: "Quality Guests",
    description:
      "Verified ID, payment screening, and review system ensure respectful guests",
    stat: "4.9/5 host satisfaction",
  },
  {
    icon: (color, size) => (
      <AntDesign name="Safety" size={size} color={color} />
    ),
    title: "Superhost Program",
    description:
      "Earn badges, better placement, and exclusive perks as you build your reputation",
    stat: "20% more bookings",
  },
  {
    icon: (color, size) => <Feather name="clock" size={size} color={color} />,
    title: "Flexible Control",
    description:
      "Set your own availability, minimum stays, and cancellation policies",
    stat: "100% calendar control",
  },
  {
    icon: (color, size) => (
      <Feather name="dollar-sign" size={size} color={color} />
    ),
    title: "Fast Payouts",
    description:
      "Get paid via direct deposit, PayPal, or wire transfer within 24 hours of check-in",
    stat: "No hidden fees",
  },
  {
    icon: (color, size) => <Feather name="globe" size={size} color={color} />,
    title: "Global Reach",
    description:
      "Connect with travelers from 120+ countries with built-in translation for 20 languages",
    stat: "International exposure",
  },
];

const PERKS = [
  {
    icon: <Feather name="home" size={20} color={COLORS.primary} />,
    text: "Professional photography service",
  },
  {
    icon: <Feather name="message-square" size={20} color={COLORS.primary} />,
    text: "Priority customer support",
  },
  {
    icon: <Feather name="credit-card" size={20} color={COLORS.primary} />,
    text: "Exclusive discount on cleaning services",
  },
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

export default function HostBenefits() {
  const navigation = useNavigation();
  const { user, token } = useContext(AuthContext);
  const slides = chunkArray(BENEFITS, 4); // 4 cards per slide

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
    }, 4500);
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
      }, 4500);
    }, 5000);
  };

  const handleGetStarted = () => {
    if (!user || !token) {
      // User is not logged in, redirect to sign-up
      navigation.navigate("Register");
    } else {
      // User is logged in, navigate to BecomeHostStack > BecomeHostIntro
      navigation.navigate("BecomeHostStack", { screen: "BecomeHostIntro" });
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        <Text style={{ color: COLORS.primary }}>Host</Text> With Confidence
      </Text>
      <Text style={styles.subtitle}>
        Join 500,000+ hosts earning an average of $15,000/year on our platform
      </Text>

      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80",
        }}
        style={styles.hostImg}
      />

      <View style={styles.perksBox}>
        <Text style={styles.perksTitle}>Premium Host Perks</Text>
        {PERKS.map((perk, idx) => (
          <View key={idx} style={styles.perkRow}>
            {perk.icon}
            <Text style={styles.perkText}>{perk.text}</Text>
          </View>
        ))}
      </View>

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
            <View style={styles.cardsGrid}>
              {slide.map((benefit, idx) => (
                <View key={idx} style={styles.card}>
                  <View style={styles.iconCircle}>
                    {benefit.icon(COLORS.primary, ICON_SIZE)}
                  </View>
                  <Text style={styles.cardTitle}>{benefit.title}</Text>
                  <Text style={styles.cardDesc}>{benefit.description}</Text>
                  <Text style={styles.cardStat}>{benefit.stat}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.ctaBtn} onPress={handleGetStarted}>
        <Text style={styles.ctaBtnText}>Get Started Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: "#fff",
    paddingTop: 28,
    paddingBottom: 8,
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
  hostImg: {
    width: "90%",
    height: 120,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 16,
  },
  perksBox: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 18,
  },
  perksTitle: {
    fontWeight: "bold",
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 8,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  perkText: {
    color: COLORS.text,
    fontSize: 13,
    marginLeft: 8,
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
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  card: {
    width: CARD_WIDTH,
    height: 180, // Fixed height for all cards
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
    marginBottom: 12,
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
    marginBottom: 6,
  },
  cardStat: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "500",
    backgroundColor: COLORS.primary + "10",
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: "center",
  },
  ctaBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
