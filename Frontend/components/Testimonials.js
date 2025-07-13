import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { COLORS } from "../constants/theme";

const TESTIMONIALS = [
  {
    id: 1,
    quote:
      "StayFinder helped me discover a hidden gem in Bali. The host verification gave me peace of mind as a solo traveler.",
    author: "Sophia L.",
    role: "Solo Traveler",
    rating: 5,
    location: "Ubud, Bali",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    id: 2,
    quote:
      "As a host, I've increased my bookings by 60% using StayFinder's smart pricing tools. The dashboard is incredibly intuitive.",
    author: "Miguel R.",
    role: "Superhost",
    rating: 5,
    location: "Barcelona, Spain",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    id: 3,
    quote:
      "Found the perfect pet-friendly cabin through StayFinder's advanced filters. Our golden retriever loved it as much as we did!",
    author: "The Chen Family",
    role: "Pet Owners",
    rating: 4,
    location: "Lake Tahoe, USA",
    image:
      "https://images.unsplash.com/photo-1545167622-3a6ac756afa4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80",
  },
  {
    id: 4,
    quote:
      "The instant booking feature saved our anniversary trip when our original plans fell through. Found a luxury villa in minutes!",
    author: "James & Elena",
    role: "Couple",
    rating: 5,
    location: "Santorini, Greece",
    image:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80",
  },
];

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const { width } = Dimensions.get("window");
  const INTERVAL = 3500;

  // Duplicate first testimonial at the end for seamless looping
  const carouselData = [...TESTIMONIALS, TESTIMONIALS[0]];
  const lastIndex = TESTIMONIALS.length - 1;

  // Auto-scroll logic with seamless transition
  useEffect(() => {
    if (!scrollRef.current) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        let next = prev + 1;
        if (next > lastIndex) {
          // Scroll to duplicate (animated), then jump to real first
          if (scrollRef.current) {
            scrollRef.current.scrollTo({
              x: (lastIndex + 1) * width,
              animated: true,
            });
            setTimeout(() => {
              scrollRef.current &&
                scrollRef.current.scrollTo({ x: 0, animated: false });
            }, 400); // match animation duration
          }
          return 0;
        } else {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ x: next * width, animated: true });
          }
          return next;
        }
      });
    }, INTERVAL);
    return () => clearInterval(interval);
  }, [width]);

  // Sync manual scroll with activeIndex and handle seamless swipe
  const onMomentumScrollEnd = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / width);
    if (slide === carouselData.length - 1) {
      // If swiped to duplicate, jump to real first
      setTimeout(() => {
        scrollRef.current &&
          scrollRef.current.scrollTo({ x: 0, animated: false });
      }, 10);
      setActiveIndex(0);
    } else {
      setActiveIndex(slide);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.title}>What Our Users Say</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {carouselData.map((item, idx) => (
          <View
            key={idx === carouselData.length - 1 ? "duplicate" : item.id}
            style={[styles.card, { width }]}
          >
            <View style={styles.cardContent}>
              <Image source={{ uri: item.image }} style={styles.avatar} />
              <Text style={styles.quote}>&ldquo;{item.quote}&rdquo;</Text>
              <Text style={styles.author}>
                {item.author} <Text style={styles.role}>({item.role})</Text>
              </Text>
              <Text style={styles.location}>{item.location}</Text>
              <View style={styles.ratingRow}>
                {[...Array(5)].map((_, i) => (
                  <Text
                    key={i}
                    style={[styles.star, i < item.rating && styles.starFilled]}
                  >
                    ★
                  </Text>
                ))}
              </View>
              <Text style={styles.highlight}>{item.highlight}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dotsRow}>
        {TESTIMONIALS.map((_, idx) => (
          <View
            key={idx}
            style={[styles.dot, activeIndex === idx && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.backgroundSecondary,
    top: 10,
    bottom: 0,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginLeft: 20,
    marginBottom: 18,
  },
  carousel: {
    flexGrow: 0,
  },
  card: {
    top: 0.05,
    alignItems: "center",
    paddingHorizontal: 29,
  },
  cardContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    top: -0.5,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  quote: {
    fontSize: 16,
    color: COLORS.text,
    fontStyle: "italic",
    marginBottom: 10,
    textAlign: "center",
  },
  author: {
    fontWeight: "bold",
    color: COLORS.primary,
    fontSize: 15,
    marginBottom: 2,
  },
  role: {
    color: COLORS.textMuted,
    fontWeight: "normal",
    fontSize: 13,
  },
  location: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  star: {
    color: "#ddd",
    fontSize: 18,
    marginHorizontal: 1,
  },
  starFilled: {
    color: COLORS.primary,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
});
