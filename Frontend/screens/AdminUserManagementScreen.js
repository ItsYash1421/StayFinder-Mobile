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
} from "react-native";
import { COLORS, getHeaderHeight, getResponsiveSize } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AdminHeader, { ADMIN_HEADER_HEIGHT } from "../components/AdminHeader";
import { useToast } from '../context/ToastContext';

const ANDROID_EXTRA_TOP = Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;
const HEADER_HEIGHT = getHeaderHeight() + ANDROID_EXTRA_TOP;

export default function AdminUserManagementScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/admin/users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserAction = (userId, action) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} this user?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: action === "block" ? "Block" : "Unblock", 
          style: action === "block" ? "destructive" : "default",
          onPress: () => performUserAction(userId, action)
        },
      ]
    );
  };

  const performUserAction = async (userId, action) => {
    try {
      const response = await api.put(`/api/admin/users/${userId}/${action}`);
      if (response.data.success) {
        toast.showToast(`User ${action}ed successfully`, "success");
        fetchUsers();
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.showToast(`Failed to ${action} user`, "error");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const UserCard = ({ user }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Text style={styles.avatarText}>
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name || "Unknown User"}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.userMeta}>
            <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
              <Text style={styles.roleText}>{user.role || "user"}</Text>
            </View>
            {user.isVerified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={12} color="#10B981" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: user.isBlocked ? "#10B981" : "#EF4444" }]}
          onPress={() => handleUserAction(user._id, user.isBlocked ? "unblock" : "block")}
        >
          <Feather name={user.isBlocked ? "unlock" : "lock"} size={16} color="white" />
          <Text style={styles.actionText}>{user.isBlocked ? "Unblock" : "Block"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getRoleColor = (role) => {
    switch (role) {
      case "admin": return "#EF4444";
      case "host": return "#10B981";
      case "user": return "#3B82F6";
      default: return "#6B7280";
    }
  };

  return (
    <View style={styles.container}>
      <AdminHeader
        title="User Management"
        showBack={true}
        onBackPress={() => navigation.goBack()}
      />
      {/* Main Content with top margin to avoid overlap */}
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
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
          
          <View style={styles.filterButtons}>
            {["all", "user", "host", "admin"].map((role) => (
              <TouchableOpacity
                key={role}
                style={[
                  styles.filterButton,
                  filterRole === role && styles.filterButtonActive
                ]}
                onPress={() => setFilterRole(role)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterRole === role && styles.filterButtonTextActive
                ]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>
            Users ({filteredUsers.length})
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <UserCard user={item} />}
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
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 2,
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: "white",
  },
  usersSection: {
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
  userCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: getResponsiveSize(18, 19, 20, 21),
    fontWeight: "bold",
    color: "white",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: getResponsiveSize(16, 17, 18, 19),
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: getResponsiveSize(13, 14, 15, 16),
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  roleText: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    fontWeight: "500",
    color: "white",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifiedText: {
    fontSize: getResponsiveSize(10, 11, 12, 13),
    color: "#10B981",
    marginLeft: 4,
    fontWeight: "500",
  },
  userActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    fontSize: getResponsiveSize(12, 13, 14, 15),
    color: "white",
    fontWeight: "500",
    marginLeft: 4,
  },
  adminHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#f43f5e', // custom red border for admin
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
   shadowRadius: 8,
    elevation: 6,
  },
}); 