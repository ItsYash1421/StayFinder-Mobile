import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
  TextInput,
  FlatList,
  Image,
} from "react-native";
import { COLORS, getHeaderHeight, getResponsiveSize } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AdminHeader, { ADMIN_HEADER_HEIGHT } from "../components/AdminHeader";
import { useToast } from '../context/ToastContext';

const ANDROID_EXTRA_TOP = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;
const HEADER_HEIGHT = getHeaderHeight() + ANDROID_EXTRA_TOP;

export default function AdminPropertyManagementScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [properties, setProperties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/properties");
      setProperties(response.data.properties || []);
    } catch (error) {
      console.error("Error fetching properties:", error);
      toast.showToast("Failed to load properties", "error");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handlePropertyAction = (propertyId, action) => {
    const actionText = action === "approve" ? "approve" : action === "reject" ? "reject" : action === "pause" ? "pause" : "activate";
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${actionText} this property?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: actionText.charAt(0).toUpperCase() + actionText.slice(1), 
          style: action === "reject" ? "destructive" : "default",
          onPress: () => performPropertyAction(propertyId, action)
        },
      ]
    );
  };

  const performPropertyAction = async (propertyId, action) => {
    try {
      const response = await api.put(`/api/admin/properties/${propertyId}/${action}`);
      if (response.data.success) {
        toast.showToast(`Property ${action}ed successfully`, "success");
        fetchProperties();
      }
    } catch (error) {
      console.error(`Error ${action}ing property:`, error);
      toast.showToast(`Failed to ${action} property`, "error");
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || property.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const PropertyCard = ({ property }) => (
    <View style={styles.propertyCard}>
      <View style={styles.propertyImage}>
        {property.images && property.images.length > 0 ? (
          <Image source={{ uri: property.images[0] }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Feather name="home" size={24} color={COLORS.textMuted} />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(property.status) }]}>
          <Text style={styles.statusText}>{property.status}</Text>
        </View>
      </View>
      
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyTitle}>{property.title}</Text>
        <Text style={styles.propertyLocation}>{property.location}</Text>
        <View style={styles.propertyMeta}>
          <Text style={styles.propertyPrice}>${property.price}/night</Text>
          <View style={styles.propertyStats}>
            <Feather name="eye" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{property.views || 0}</Text>
            <Feather name="star" size={14} color={COLORS.textMuted} />
            <Text style={styles.statText}>{property.rating || 0}</Text>
          </View>
        </View>
        <Text style={styles.propertyHost}>Host: {property.hostName || "Unknown"}</Text>
      </View>

      <View style={styles.propertyActions}>
        {property.status === "pending" && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#10B981" }]}
              onPress={() => handlePropertyAction(property._id, "approve")}
            >
              <Feather name="check" size={16} color="white" />
              <Text style={styles.actionText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
              onPress={() => handlePropertyAction(property._id, "reject")}
            >
              <Feather name="x" size={16} color="white" />
              <Text style={styles.actionText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {property.status === "live" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}
            onPress={() => handlePropertyAction(property._id, "pause")}
          >
            <Feather name="pause" size={16} color="white" />
            <Text style={styles.actionText}>Pause</Text>
          </TouchableOpacity>
        )}
        {property.status === "paused" && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#10B981" }]}
            onPress={() => handlePropertyAction(property._id, "activate")}
          >
            <Feather name="play" size={16} color="white" />
            <Text style={styles.actionText}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "live": return "#10B981";
      case "pending": return "#F59E0B";
      case "paused": return "#6B7280";
      case "rejected": return "#EF4444";
      default: return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="Property Management"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        style={[styles.scrollView, { marginTop: 40 }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search and Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search properties..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          
          <View style={styles.filterButtons}>
            {["all", "live", "pending", "paused", "rejected"].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  filterStatus === status && styles.filterButtonActive
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterStatus === status && styles.filterButtonTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Properties List */}
        <View style={styles.propertiesSection}>
          <Text style={styles.sectionTitle}>
            Properties ({filteredProperties.length})
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredProperties.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="home" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No properties found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProperties}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <PropertyCard property={item} />}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: getResponsiveSize(14, 15, 16, 17),
    color: COLORS.text,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 2,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  propertiesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: getResponsiveSize(18, 19, 20, 21),
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 15,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    color: COLORS.textMuted,
    marginTop: 10,
  },
  propertyCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  propertyImage: {
    position: "relative",
    height: 120,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    fontWeight: "500",
    color: "white",
  },
  propertyInfo: {
    padding: 16,
  },
  propertyTitle: {
    fontSize: getResponsiveSize(16, 17, 18, 19),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: getResponsiveSize(13, 14, 15, 16),
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  propertyMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  propertyPrice: {
    fontSize: getResponsiveSize(14, 15, 16, 17),
    fontWeight: "bold",
    color: COLORS.primary,
  },
  propertyStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
    marginLeft: 4,
    marginRight: 8,
  },
  propertyHost: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
  },
  propertyActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: "white",
    fontWeight: "500",
    marginLeft: 4,
  },
}); 