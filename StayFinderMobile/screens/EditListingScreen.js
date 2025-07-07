import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { COLORS } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import * as ImagePicker from "expo-image-picker";
import { useToast } from '../context/ToastContext';

const categories = [
  "Beach",
  "Mountain",
  "City",
  "Countryside",
  "Luxury",
  "Budget",
  "Historical",
  "Adventure",
];

const defaultAmenities = {
  wifi: false,
  kitchen: false,
  parking: false,
  tv: false,
  fireplace: false,
  balcony: false,
  heating: false,
  bbq: false,
};

const defaultHouseRules = {
  smoking: false,
  pets: false,
  parties: false,
  checkInTime: "15:00",
  checkOutTime: "11:00",
};

export default function EditListingScreen({ navigation, route }) {
  const { id } = route.params;
  const { token, user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    guests: "",
    category: "",
    bedrooms: "",
    bathrooms: "",
    latitude: "",
    longitude: "",
    amenities: {
      wifi: false,
      kitchen: false,
      parking: false,
      tv: false,
      fireplace: false,
      balcony: false,
      heating: false,
      bbq: false,
    },
    houseRules: {
      smoking: false,
      pets: false,
      parties: false,
      checkInTime: "15:00",
      checkOutTime: "11:00",
    },
  });
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await api.get(`/api/listings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const listing = response.data.listing;
        setFormData({
          title: listing.title,
          description: listing.description,
          location: listing.location,
          latitude:
            listing.latitude !== undefined && listing.latitude !== null
              ? listing.latitude.toString()
              : "",
          longitude:
            listing.longitude !== undefined && listing.longitude !== null
              ? listing.longitude.toString()
              : "",
          price: listing.price.toString(),
          guests: listing.guests.toString(),
          bedrooms: listing.bedrooms.toString(),
          bathrooms: listing.bathrooms.toString(),
          category: listing.category || "",
          amenities: listing.amenities || formData.amenities,
          houseRules: listing.houseRules || formData.houseRules,
        });
        setExistingImages(listing.images || []);
      }
    } catch (err) {
      console.error("Error fetching listing:", err);
      setError("Failed to load listing data");
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAmenityToggle = (key) => {
    setFormData({
      ...formData,
      amenities: { ...formData.amenities, [key]: !formData.amenities[key] },
    });
  };

  const handleHouseRuleToggle = (key) => {
    setFormData({
      ...formData,
      houseRules: { ...formData.houseRules, [key]: !formData.houseRules[key] },
    });
  };

  const handleImagePick = async () => {
    if (images.length >= 5) {
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5 - images.length,
    });
    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({ uri: asset.uri }));
      setImages([...images, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const removeExistingImage = (index) => {
    const newExistingImages = [...existingImages];
    newExistingImages.splice(index, 1);
    setExistingImages(newExistingImages);
  };

  const isValidCoordinate = (value, min, max) => {
    const num = parseFloat(value);
    return !isNaN(num) && num >= min && num <= max;
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (
      !formData.title ||
      !formData.description ||
      !formData.location ||
      !formData.price ||
      !formData.guests ||
      !formData.category ||
      !formData.bedrooms ||
      !formData.bathrooms
    ) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }
    if (existingImages.length === 0 && images.length === 0) {
      setError("Please upload at least one image.");
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "amenities" || key === "houseRules") {
          Object.keys(formData[key]).forEach((subKey) => {
            formDataToSend.append(`${key}.${subKey}`, formData[key][subKey]);
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      existingImages.forEach((imageUrl) => {
        formDataToSend.append("existingImages", imageUrl);
      });

      images.forEach((img, idx) => {
        formDataToSend.append("images", {
          uri: img.uri,
          name: `image${idx}.jpg`,
          type: "image/jpeg",
        });
      });

      const response = await api.put(
        `/api/listings/edit-listing/${id}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        toast.showToast("Listing updated successfully!", "success");
        setTimeout(() => {
          navigation.navigate("HostMain");
        }, 400);
      } else {
        const errorMessage = response.data.message || "Failed to update listing";
        setError(errorMessage);
        toast.showToast(errorMessage, "error");
      }
    } catch (err) {
      console.error("Error updating listing:", err);
      const errorMessage = err.response?.data?.message || "Failed to update listing. Please try again.";
      setError(errorMessage);
      toast.showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading listing data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Edit Listing" />
      <View style={{ height: 90 }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Edit Listing</Text>
        <Text style={styles.subtitle}>Update your property information</Text>

        <View style={styles.formContainer}>
          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Property Title *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => handleChange("title", text)}
                placeholder="Give your place a descriptive title"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => handleChange("description", text)}
                placeholder="Describe your property in detail..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.row}>
              <View
                style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
              >
                <Text style={styles.label}>Category *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.category}
                  placeholder="Select a category"
                  placeholderTextColor={COLORS.textMuted}
                  onFocus={() =>
                    console.log("Category", "Please type a category from: " + categories.join(", "))
                  }
                  onChangeText={(text) => handleChange("category", text)}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Location *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(text) => handleChange("location", text)}
                  placeholder="City, State or City, Country"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View
                style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
              >
                <Text style={styles.label}>Price per night ($) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price}
                  onChangeText={(text) => handleChange("price", text)}
                  placeholder="$"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Bedrooms *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bedrooms}
                  onChangeText={(text) => handleChange("bedrooms", text)}
                  placeholder="Number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View
                style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
              >
                <Text style={styles.label}>Bathrooms *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.bathrooms}
                  onChangeText={(text) => handleChange("bathrooms", text)}
                  placeholder="Number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Max Guests *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.guests}
                  onChangeText={(text) => handleChange("guests", text)}
                  placeholder="Number"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Images</Text>
            <Text style={styles.sectionSubtitle}>
              Upload new images or remove existing ones
            </Text>

            {existingImages.length > 0 && (
              <View style={styles.imageSection}>
                <Text style={styles.imageSectionTitle}>Current Images</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                >
                  {existingImages.map((imageUrl, index) => (
                    <View
                      key={`existing-${index}`}
                      style={styles.imageContainer}
                    >
                      <Image source={{ uri: imageUrl }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeExistingImage(index)}
                      >
                        <Feather name="x" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.imageSection}>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleImagePick}
              >
                <Feather name="upload" size={24} color={COLORS.primary} />
                <Text style={styles.uploadText}>Add New Images</Text>
                <Text style={styles.uploadSubtext}>Tap to select images</Text>
              </TouchableOpacity>

              {images.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imageScroll}
                >
                  {images.map((img, index) => (
                    <View key={`new-${index}`} style={styles.imageContainer}>
                      <Image source={{ uri: img.uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Feather name="x" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Amenities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {Object.keys(formData.amenities).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.amenityToggle,
                    formData.amenities[key] && styles.amenityToggleSelected,
                  ]}
                  onPress={() => handleAmenityToggle(key)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={
                      key === "wifi"
                        ? "wifi"
                        : key === "kitchen"
                          ? "coffee"
                          : key === "parking"
                            ? "map-pin"
                            : key === "tv"
                              ? "tv"
                              : key === "fireplace"
                                ? "zap"
                                : key === "balcony"
                                  ? "home"
                                  : key === "heating"
                                    ? "thermometer"
                                    : key === "bbq"
                                      ? "sun"
                                      : "check"
                    }
                    size={16}
                    color={
                      formData.amenities[key]
                        ? COLORS.primary
                        : COLORS.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.amenityText,
                      formData.amenities[key] && styles.amenityTextSelected,
                    ]}
                  >
                    {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* House Rules */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>House Rules</Text>
            <View style={styles.amenitiesGrid}>
              {["smoking", "pets", "parties"].map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.amenityToggle,
                    formData.houseRules[key] && styles.amenityToggleSelected,
                  ]}
                  onPress={() => handleHouseRuleToggle(key)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={
                      key === "smoking"
                        ? "x"
                        : key === "pets"
                          ? "heart"
                          : "users"
                    }
                    size={16}
                    color={
                      formData.houseRules[key]
                        ? COLORS.primary
                        : COLORS.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.amenityText,
                      formData.houseRules[key] && styles.amenityTextSelected,
                    ]}
                  >
                    Allow {key}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.row}>
              <View
                style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
              >
                <Text style={styles.label}>Check-in Time</Text>
                <TextInput
                  style={styles.input}
                  value={formData.houseRules.checkInTime}
                  onChangeText={(text) =>
                    handleChange("houseRules", {
                      ...formData.houseRules,
                      checkInTime: text,
                    })
                  }
                  placeholder="15:00"
                  placeholderTextColor={COLORS.textMuted}
                  onFocus={() =>
                    console.log("Check-in Time", "Please type a time in format HH:MM (e.g., 15:00)")
                  }
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Check-out Time</Text>
                <TextInput
                  style={styles.input}
                  value={formData.houseRules.checkOutTime}
                  onChangeText={(text) =>
                    handleChange("houseRules", {
                      ...formData.houseRules,
                      checkOutTime: text,
                    })
                  }
                  placeholder="11:00"
                  placeholderTextColor={COLORS.textMuted}
                  onFocus={() =>
                    console.log("Check-out Time", "Please type a time in format HH:MM (e.g., 11:00)")
                  }
                />
              </View>
            </View>
          </View>

          {/* Submit Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.navigate("HostMain")}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Update Listing</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginBottom: 24,
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    marginLeft: 8,
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    color: COLORS.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  amenityToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  amenityToggleSelected: {
    backgroundColor: COLORS.primary + "11",
    borderColor: COLORS.primary,
  },
  amenityText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 6,
    textTransform: "capitalize",
  },
  amenityTextSelected: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  imageSection: {
    marginBottom: 20,
  },
  imageSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  imageScroll: {
    marginHorizontal: -4,
  },
  imageContainer: {
    position: "relative",
    marginHorizontal: 4,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
