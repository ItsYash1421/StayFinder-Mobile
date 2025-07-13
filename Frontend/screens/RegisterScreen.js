import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { COLORS, getHeaderHeight } from "../constants/theme";
import { Feather } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { api } from "../constants/api";
import AppHeader from "../components/AppHeader";
import { useToast } from '../context/ToastContext';
import GoogleLoginButton from "../components/GoogleLoginButton";

const ANDROID_EXTRA_TOP =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;
const HEADER_HEIGHT = getHeaderHeight() + ANDROID_EXTRA_TOP;

export default function RegisterScreen({ navigation }) {
  const { login } = useContext(AuthContext);
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleGenderChange = (gender) => {
    setFormData({ ...formData, gender });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.role
    ) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    try {
      const response = await api.post("/api/user/register", formData);
      if (response.data.success) {
        toast.showToast("Account created successfully!", "success");
        login(response.data.user, response.data.token);
        navigation.replace("MainTabs");
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred. Please try again.";
      setError(errorMessage);
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
     
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>
              Join our community of travelers and hosts
            </Text>
          </View>
          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            {/* Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full name</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="user"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => handleChange("name", text)}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email address</Text>
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
                  autoCorrect={false}
                />
              </View>
            </View>
            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone number</Text>
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
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Feather
                  name="lock"
                  size={20}
                  color={COLORS.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(text) => handleChange("password", text)}
                  placeholder="Create a password"
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>
            {/* Role */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Role</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === "user" && styles.roleOptionSelected,
                  ]}
                  onPress={() => handleChange("role", "user")}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="user"
                    size={16}
                    color={
                      formData.role === "user"
                        ? COLORS.primary
                        : COLORS.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.roleText,
                      formData.role === "user" && styles.roleTextSelected,
                    ]}
                  >
                    User
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    formData.role === "host" && styles.roleOptionSelected,
                  ]}
                  onPress={() => handleChange("role", "host")}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="home"
                    size={16}
                    color={
                      formData.role === "host"
                        ? COLORS.primary
                        : COLORS.textMuted
                    }
                  />
                  <Text
                    style={[
                      styles.roleText,
                      formData.role === "host" && styles.roleTextSelected,
                    ]}
                  >
                    Host
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                loading && styles.registerButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.registerButtonText}>Create account</Text>
              )}
            </TouchableOpacity>

            {/* Google Sign Up Button */}
            <GoogleLoginButton
              buttonText="Sign up with Google"
              onSuccess={({ user, token }) => {
                login(user, token);
                toast.showToast("Account created!", "success");
                navigation.replace("MainTabs");
              }}
              style={{ marginTop: 8, marginBottom: 8 }}
            />

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text
                  style={styles.loginLink}
                  onPress={() => navigation.navigate("Login")}
                >
                  Sign in
                </Text>
              </Text>
            </View>
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
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  inputIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeButton: {
    padding: 12,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: COLORS.background,
  },
  roleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "11",
  },
  roleText: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  roleTextSelected: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: -5,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    alignItems: "center",
    marginTop: 12,
  },
  loginText: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: "600",
  },
});
