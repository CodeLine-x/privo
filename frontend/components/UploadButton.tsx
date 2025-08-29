import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface UploadButtonProps {
  onPress: () => void;
}

export function UploadButton({ onPress }: UploadButtonProps) {
  return (
    <TouchableOpacity style={styles.uploadButton} onPress={onPress}>
      <Text style={styles.uploadButtonText}>Upload</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});