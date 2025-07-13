import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { Calendar } from "react-native-calendars";

const { width } = Dimensions.get("window");

export default function CustomDatePickerModal({
  visible,
  onClose,
  onSelect,
  type = "checkIn",
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={30}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={styles.modalOverlay}>
            <BlurView
              intensity={-10}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.androidFrosted} />
          </View>
        )}
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select {type === "checkIn" ? "Check-in" : "Check-out"} Date
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          <Calendar
            onDayPress={(day) => onSelect(new Date(day.dateString))}
            minDate={new Date().toISOString().split("T")[0]}
            style={{ borderRadius: 12 }}
            theme={{
              selectedDayBackgroundColor: COLORS.primary,
              todayTextColor: COLORS.primary,
              arrowColor: COLORS.primary,
              textSectionTitleColor: COLORS.text,
              monthTextColor: COLORS.primary,
              textDayFontWeight: "500",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "bold",
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  androidFrosted: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0)",
    borderColor: "rgba(0, 0, 0, 0.1)",
    borderWidth: 0.5,
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: width > 400 ? 400 : "80%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: 8,
  },
});
