import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { NativeModules } from "react-native";
import { NativeBridge } from "../utils/NativeBridge";

const { SensitiveScan, TestModule: TestModuleNative } = NativeModules;

// Debug logging
console.log(
  "TestModule component: Available NativeModules:",
  Object.keys(NativeModules)
);
console.log("TestModule component: SensitiveScan:", SensitiveScan);
console.log("TestModule component: All NativeModules:", NativeModules);

export function TestModule() {
  const testDetectFaces = async () => {
    try {
      console.log("Testing detectFaces...");
      const result = await NativeBridge.detectFaces("test-image-path");
      console.log("detectFaces result:", result);
      Alert.alert("Test Result", `detectFaces: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error("detectFaces error:", error);
      Alert.alert("Error", `detectFaces error: ${error}`);
    }
  };

  const testBlurFaces = async () => {
    try {
      console.log("Testing blurFacesInImage...");
      const result = await NativeBridge.blurFacesInImage("test-image-path");
      console.log("blurFacesInImage result:", result);
      Alert.alert("Test Result", `blurFacesInImage: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error("blurFacesInImage error:", error);
      Alert.alert("Error", `blurFacesInImage error: ${error}`);
    }
  };

  const testSensitiveScanModule = async () => {
    try {
      console.log("Testing SensitiveScan module...");
      console.log("SensitiveScan available:", SensitiveScan);
      console.log("All available modules:", Object.keys(NativeModules));

      if (SensitiveScan) {
        console.log("SensitiveScan methods:", Object.keys(SensitiveScan));
        // Test if the module has the expected methods
        if (SensitiveScan.detectFaces && SensitiveScan.blurFacesInImage) {
          Alert.alert(
            "Success",
            "SensitiveScan module found with expected methods!"
          );
        } else {
          Alert.alert(
            "Warning",
            "SensitiveScan module found but missing expected methods"
          );
        }
      } else {
        console.log("SensitiveScan not found in NativeModules");
        Alert.alert("Error", "SensitiveScan module not found");
      }
    } catch (error) {
      console.error("SensitiveScan module error:", error);
      Alert.alert("Error", `SensitiveScan module error: ${error}`);
    }
  };

  const testSimpleModule = async () => {
    try {
      console.log("Testing TestModule...");
      console.log("TestModule available:", TestModuleNative);

      if (TestModuleNative) {
        console.log("TestModule methods:", Object.keys(TestModuleNative));
        const result = await TestModuleNative.testMethod();
        console.log("TestModule result:", result);
        Alert.alert("Test Result", `TestModule: ${result}`);
      } else {
        console.log("TestModule not found in NativeModules");
        Alert.alert("Error", "TestModule not found");
      }
    } catch (error) {
      console.error("TestModule error:", error);
      Alert.alert("Error", `TestModule error: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Android Native Modules Test</Text>
      <TouchableOpacity style={styles.button} onPress={testSimpleModule}>
        <Text style={styles.buttonText}>Test Simple Module</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={testSensitiveScanModule}>
        <Text style={styles.buttonText}>Test SensitiveScan Module</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={testDetectFaces}>
        <Text style={styles.buttonText}>Test detectFaces</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={testBlurFaces}>
        <Text style={styles.buttonText}>Test blurFacesInImage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f0f0f0",
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
    fontWeight: "600",
  },
});
