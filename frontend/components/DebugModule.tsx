import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { NativeModules } from "react-native";

export function DebugModule() {
  const [moduleInfo, setModuleInfo] = useState<string>("Loading...");

  useEffect(() => {
    const debugInfo = `
=== Native Module Debug Info ===
Platform: ${require("react-native").Platform.OS}
Available Modules: ${Object.keys(NativeModules).join(", ")}
Total Modules: ${Object.keys(NativeModules).length}

All NativeModules:
${JSON.stringify(NativeModules, null, 2)}

Module Details:
${Object.keys(NativeModules)
  .map((key) => {
    const module = NativeModules[key];
    return `${key}: ${module ? "Found" : "null"} (${typeof module})`;
  })
  .join("\n")}
    `;

    setModuleInfo(debugInfo);
    console.log(debugInfo);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Native Module Debug Info</Text>
      <Text style={styles.info}>{moduleInfo}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  info: {
    fontSize: 12,
    fontFamily: "monospace",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
  },
});
