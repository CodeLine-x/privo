import { NativeModules, Platform, Alert } from "react-native";

const { SensitiveScan } = NativeModules;

console.log("=== NativeBridge Initialization ===");
console.log("Platform:", Platform.OS);
console.log("NativeModules:", NativeModules);
console.log("Available modules:", Object.keys(NativeModules));
console.log("Total modules count:", Object.keys(NativeModules).length);

// Log all available modules with their details
Object.keys(NativeModules).forEach((moduleName) => {
  const module = NativeModules[moduleName];
  console.log(`Module: ${moduleName}`);
  console.log(`  - Type: ${typeof module}`);
  console.log(
    `  - Methods: ${
      module && typeof module === "object" ? Object.keys(module) : "N/A"
    }`
  );
});

console.log("SensitiveScan module:", SensitiveScan);
console.log("SensitiveScan type:", typeof SensitiveScan);
if (SensitiveScan) {
  console.log("SensitiveScan methods:", Object.keys(SensitiveScan));
}

export interface SensitiveCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  textContent?: string;
}

export interface SensitiveScanResult {
  success: boolean;
  blurredImagePath: string;
  sensitiveItemsFound: number;
  sensitiveItemsBlurred: number;
  message: string;
  coordinates?: SensitiveCoordinate[];
  debugDetectedTexts?: string;
  faceCount?: number;
  textCount?: number;
  piiCount?: number;
  detectedTexts?: string[];
  piiTexts?: string[];
}

export class NativeBridge {
  static async scanAndBlurSensitiveContent(
    imagePath: string
  ): Promise<SensitiveScanResult> {
    console.log("=== scanAndBlurSensitiveContent called ===");
    console.log("Platform:", Platform.OS);
    console.log("Image path:", imagePath);
    console.log("SensitiveScan available:", !!SensitiveScan);

    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      console.log("Platform not supported:", Platform.OS);
      return {
        success: false,
        blurredImagePath: imagePath,
        sensitiveItemsFound: 0,
        sensitiveItemsBlurred: 0,
        message: "Sensitive content scanning only available on iOS and Android",
      };
    }

    if (!SensitiveScan) {
      console.error("SensitiveScan module not available!");
      throw new Error("SensitiveScan module not available");
    }

    try {
      console.log("Calling SensitiveScan.scanAndBlurSensitiveContent...");
      const result = await SensitiveScan.scanAndBlurSensitiveContent(imagePath);
      console.log("Scan result:", result);
      return result;
    } catch (error) {
      console.error("Error scanning and blurring sensitive content:", error);
      throw error;
    }
  }

  static async scanImageAndOfferBlur(
    imagePath: string,
    onBlurComplete?: (blurredPath: string) => void
  ): Promise<void> {
    try {
      const result = await this.scanAndBlurSensitiveContent(imagePath);

      if (
        result.success &&
        result.sensitiveItemsBlurred > 0 &&
        onBlurComplete
      ) {
        onBlurComplete(result.blurredImagePath);
      }
    } catch (error) {
      console.error("Error scanning and blurring sensitive content:", error);
      Alert.alert(
        "Scan Error",
        "Failed to scan and blur sensitive content. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    }
  }

  static async scanImageAndAlert(imagePath: string): Promise<void> {
    try {
      const result = await this.scanAndBlurSensitiveContent(imagePath);

      if (result.sensitiveItemsFound > 0) {
        Alert.alert(
          "Sensitive Content Detected",
          `Found ${result.sensitiveItemsFound} sensitive item(s) in the image. Content has been automatically blurred for privacy.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        Alert.alert(
          "No Sensitive Content",
          "No sensitive content detected in this image. Content appears safe to share.",
          [{ text: "OK", style: "default" }]
        );
      }
    } catch (error) {
      console.error("Error scanning image:", error);
      Alert.alert(
        "Scan Error",
        "Unable to scan image for sensitive content. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    }
  }
}
