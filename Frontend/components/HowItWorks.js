import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather, AntDesign } from "@expo/vector-icons";

const STEP_COLORS = [
  { bg: "#e0edfa", text: "#2563eb" }, // blue
  { bg: "#ede9fe", text: "#7c3aed" }, // purple
  { bg: "#dcfce7", text: "#22c55e" }, // green
  { bg: "#fef3c7", text: "#f59e42" }, // amber
];

const STEPS = [
  {
    icon: (color, size) => <Feather name="search" size={size} color={color} />,
    title: "Search Smart",
    description: "Use our AI-powered filters to find exactly what you want",
    highlight: "100+ filters available",
    colorIdx: 0,
  },
  {
    icon: (color, size) => <Feather name="calendar" size={size} color={color} />,
    title: "Book Seamlessly",
    description: "Instant booking or request with 24-hour response guarantee",
    highlight: "No booking fees",
    colorIdx: 1,
  },
  {
    icon: (color, size) => <Feather name="key" size={size} color={color} />,
    title: "Enjoy Your Stay",
    description: "Access digital guidebooks and 24/7 support during your trip",
    highlight: "Local tips included",
    colorIdx: 2,
  },
  {
    icon: (color, size) => <AntDesign name="staro" size={size} color={color} />,
    title: "Share Your Experience",
    description: "Earn rewards for reviews and help our community grow",
    highlight: "Loyalty program",
    colorIdx: 3,
  },
];

export default function HowItWorks() {
  const { width: windowWidth } = useWindowDimensions();
  // Responsive radii (decrease icon circle size by 5px)
  const MAIN_CIRCLE_RADIUS = windowWidth > 400 ? 150 : 110;
  const ICON_RADIUS = windowWidth > 400 ? 35 : 25;
  const ICON_SIZE = windowWidth > 400 ? 32 : 24;
  const CENTER_CIRCLE_RADIUS = windowWidth > 400 ? 54 : 38;

  const [activeStep, setActiveStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      handleNextStep();
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [activeStep]);

  const handleStepPress = (idx) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setActiveStep(idx);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      handleNextStep();
    }, 4000);
  };

  const handleNextStep = () => {
    setActiveStep((prev) => (prev + 1) % STEPS.length);
  };

  // Layout positions for 4 icons, all inside the main circle, evenly spaced on the circumference
  const iconLayout = Array.from({ length: 4 }).map((_, idx) => {
    const angle = (2 * Math.PI * idx) / 4 - Math.PI / 2;
    return {
      x: MAIN_CIRCLE_RADIUS + 10 + (MAIN_CIRCLE_RADIUS - ICON_RADIUS - 12) * Math.cos(angle),
      y: MAIN_CIRCLE_RADIUS + 10 + (MAIN_CIRCLE_RADIUS - ICON_RADIUS - 12) * Math.sin(angle),
    };
  });

  const stepColor = STEP_COLORS[STEPS[activeStep].colorIdx];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        How <Text style={{ color: COLORS.primary }}>StayFindz</Text> Works
      </Text>
      <Text style={styles.subtitle}>
        Your journey from searching to staying takes just minutes
      </Text>
      <View
        style={{
          width: MAIN_CIRCLE_RADIUS * 2 + 20,
          height: MAIN_CIRCLE_RADIUS * 2 + 20,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 18,
          position: "relative",
        }}
      >
        {/* Main circle with thin border only */}
        <View
          style={{
            position: "absolute",
            left: 10,
            top: 10,
            width: MAIN_CIRCLE_RADIUS * 2,
            height: MAIN_CIRCLE_RADIUS * 2,
            borderRadius: MAIN_CIRCLE_RADIUS,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: '#e5e7eb', // light gray
            zIndex: 1,
          }}
        />
        {/* Center softly colored circle with number (bigger) */}
        <View
          style={{
            position: "absolute",
            left: MAIN_CIRCLE_RADIUS + 10 - CENTER_CIRCLE_RADIUS,
            top: MAIN_CIRCLE_RADIUS + 10 - CENTER_CIRCLE_RADIUS,
            width: CENTER_CIRCLE_RADIUS * 2,
            height: CENTER_CIRCLE_RADIUS * 2,
            borderRadius: CENTER_CIRCLE_RADIUS,
            backgroundColor: stepColor.bg,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3,
          }}
        >
          <Text
            style={{
              fontSize: windowWidth > 400 ? 32 : 22,
              fontWeight: "bold",
              color: '#222',
            }}
          >
            {activeStep + 1}
          </Text>
        </View>
        {/* Step icons, all in white circles, active has soft colored bg */}
        {STEPS.map((step, idx) => {
          const pos = iconLayout[idx];
          const isActive = idx === activeStep;
          const color = STEP_COLORS[step.colorIdx];
          return (
            <TouchableOpacity
              key={idx}
              style={[
                {
                  position: "absolute",
                  alignItems: "center",
                  justifyContent: "center",
                  width: ICON_RADIUS * 2,
                  height: ICON_RADIUS * 2,
                  borderRadius: ICON_RADIUS,
                  backgroundColor: isActive ? color.bg : "#fff",
                  shadowColor: color.text,
                  shadowOpacity: isActive ? 0.13 : 0.06,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: isActive ? 4 : 2,
                  borderWidth: 2,
                  borderColor: isActive ? color.bg : '#f3f4f6',
                  left: pos.x - ICON_RADIUS,
                  top: pos.y - ICON_RADIUS,
                  zIndex: isActive ? 2 : 1,
                  transform: [{ scale: isActive ? 1.08 : 1 }],
                },
              ]}
              activeOpacity={0.8}
              onPress={() => handleStepPress(idx)}
            >
              {step.icon(isActive ? color.text : color.text + "99", ICON_SIZE)}
            </TouchableOpacity>
          );
        })}
      </View>
      {/* Content container below animation */}
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}> 
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
            backgroundColor: stepColor.bg,
            marginRight: 10,
          }}>
            {STEPS[activeStep].icon(stepColor.text, 24)}
          </View>
          <Text style={[styles.contentTitle, { color: stepColor.text }]}>{STEPS[activeStep].title}</Text>
        </View>
        <Text style={styles.contentDesc}>{STEPS[activeStep].description}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", marginTop: 10 }}>
          <Text style={[styles.contentHighlight, { backgroundColor: stepColor.bg, color: stepColor.text }]}>{STEPS[activeStep].highlight}</Text>
          <TouchableOpacity onPress={handleNextStep} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: COLORS.primary, fontWeight: "bold", fontSize: 15, marginRight: 4 }}>Next step</Text>
            <Feather name="chevron-right" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </Animated.View>
      {/* Dots indicator */}
      <View style={styles.dotsRow}>
        {STEPS.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleStepPress(idx)}
            style={[styles.dot, idx === activeStep && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: COLORS.backgroundSecondary,
    paddingVertical: 28,
    paddingHorizontal: 0,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
    marginTop: 8,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginBottom: 18,
    textAlign: "center",
  },
  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    marginTop: 8,
    marginBottom: 10,
    width: "90%",
    alignSelf: "center",
    alignItems: "flex-start",
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  contentTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 0,
    textAlign: "left",
  },
  contentDesc: {
    color: COLORS.text,
    fontSize: 15,
    marginBottom: 8,
    textAlign: "left",
  },
  contentHighlight: {
    fontSize: 14,
    fontWeight: "600",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
    overflow: "hidden",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 2,
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary + "18",
    marginHorizontal: 3,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
});
