import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export const TestModule: React.FC = () => {
  const [testResult, setTestResult] = useState<string>("");

  const checkModules = () => {
    const { NativeModules } = require("react-native");
    console.log("=== Manual module check ===");
    console.log("NativeModules:", NativeModules);
    console.log("NativeModules keys:", Object.keys(NativeModules));
    console.log("NativeModules count:", Object.keys(NativeModules).length);

    if (NativeModules.SensitiveScan) {
      console.log("SensitiveScan found:", NativeModules.SensitiveScan);
      console.log(
        "SensitiveScan methods:",
        Object.keys(NativeModules.SensitiveScan)
      );
      setTestResult("SensitiveScan module found in NativeModules");
    } else {
      console.log("SensitiveScan NOT found in NativeModules");
      setTestResult("SensitiveScan module NOT found in NativeModules");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Module Test</Text>

      <TouchableOpacity style={styles.button} onPress={checkModules}>
        <Text style={styles.buttonText}>Check Native Modules</Text>
      </TouchableOpacity>

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Result:</Text>
        <Text style={styles.resultText}>{testResult}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "monospace",
  },
});
