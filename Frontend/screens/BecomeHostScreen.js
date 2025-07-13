import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import { LinearGradient } from "expo-linear-gradient";
import { useToast } from '../context/ToastContext';

export default function BecomeHostScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    propertyType: "",
    propertyAddress: "",
    numberOfRooms: "",
    experience: "",
    motivation: "",
    availability: "",
  });
  const toast = useToast();

  const handleChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async () => {
    // Validation
    const requiredFields = [
      "fullName",
      "email",
      "phone",
      "propertyType",
      "propertyAddress",
      "numberOfRooms",
    ];
    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        toast.showToast(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, "error");
        setLoading(false);
        return;
      }
    }

    if (!user || !token) {
      toast.showToast("Please sign in to submit your application", "error");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/api/user/request-host-access",
        {
          ...formData,
          userId: user._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        toast.showToast("Host application submitted successfully!", "success");
        setTimeout(() => {
          navigation.navigate("MainTabs");
        }, 1500);
      } else {
        const errorMessage = response.data.message || "Failed to submit application";
        toast.showToast(errorMessage, "error");
      }
    } catch (error) {
      console.error("Host application error:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit application. Please try again.";
      toast.showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <AppHeader title="Become a Host" showBack={true} />
      <View style={{ height: 90 }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={["#667eea", "#764ba2"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerSection}>
            <View style={styles.headerIconContainer}>
              <Feather name="home" size={32} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>Join Our Host Community</Text>
            <Text style={styles.headerSubtitle}>
              Share your space with travelers and start earning extra income.
              Complete the form below to get started.
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4M+</Text>
                <Text style={styles.statLabel}>Active Hosts</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>$924</Text>
                <Text style={styles.statLabel}>Avg. Monthly</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>150+</Text>
                <Text style={styles.statLabel}>Countries</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Form Section */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <View style={styles.formIconContainer}>
              <Feather name="file-text" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.formTitle}>Host Application Form</Text>
            <Text style={styles.formSubtitle}>
              Tell us about yourself and your property
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="user" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="user"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) => handleChange("fullName", text)}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="mail"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => handleChange("email", text)}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="phone"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(text) => handleChange("phone", text)}
                  placeholder="Enter your phone number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Property Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="home" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Property Information</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Property Type *</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="home"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.propertyType}
                  onChangeText={(text) => handleChange("propertyType", text)}
                  placeholder="Property Type"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Property Address *</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="map-pin"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.propertyAddress}
                  onChangeText={(text) => handleChange("propertyAddress", text)}
                  placeholder="Property Address"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Number of Rooms *</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="layers"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.numberOfRooms}
                  onChangeText={(text) => handleChange("numberOfRooms", text)}
                  placeholder="Number of Rooms"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Additional Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Additional Information</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Hosting Experience</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="award"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.experience}
                  onChangeText={(text) => handleChange("experience", text)}
                  placeholder="Hosting Experience"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Why do you want to become a host?
              </Text>
              <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.motivation}
                  onChangeText={(text) => handleChange("motivation", text)}
                  placeholder="Motivation"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Availability</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="calendar"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.availability}
                  onChangeText={(text) => handleChange("availability", text)}
                  placeholder="Availability"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, "#4f46e5"]}
              style={styles.submitButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather
                    name="send"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitButtonText}>
                    Submit Application
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.disclaimerContainer}>
            <Feather name="info" size={16} color={COLORS.textMuted} />
            <Text style={styles.disclaimer}>
              * Required fields. We will review your application and contact you
              within 2-3 business days.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  headerSection: {
    alignItems: "center",

    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  headerIconContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 8,
  },
  formContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  formHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  formIconContainer: {
    backgroundColor: COLORS.primary + "15",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  formSubtitle: {
    fontSize: 15,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginBottom: 32,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  textAreaWrapper: {
    alignItems: "flex-start",
    minHeight: 100,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    borderRadius: 16,
    marginTop: 16,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 18,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  disclaimerContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
  },
  disclaimer: {
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
  },
});
