import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";

interface BottomNavBarProps {
  onUploadPress?: () => void;
}

export function BottomNavBar({
  onUploadPress,
}: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      {/* Upload Button */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={onUploadPress || (() => {})}
      >
        <Text style={styles.uploadButtonText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E7",
    zIndex: 100,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    flex: 1,
    minHeight: 48,
  },
  activeNavItem: {
    backgroundColor: "#FAEDE4",
  },
  navLabel: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  activeNavLabel: {
    color: "#F78231",
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#F78231",
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    shadowColor: "#F78231",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "300",
    lineHeight: 26,
  },
});
