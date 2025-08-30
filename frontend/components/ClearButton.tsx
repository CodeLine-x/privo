import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

interface ClearButtonProps {
  onPress: () => void;
}

export function ClearButton({ onPress }: ClearButtonProps) {
  return (
    <TouchableOpacity style={styles.clearButton} onPress={onPress}>
      <Text style={styles.clearButtonText}>Clear</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  clearButton: {
    backgroundColor: "#F78231",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#F78231",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});