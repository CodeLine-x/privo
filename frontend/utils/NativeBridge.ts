import { NativeModules, Platform, Alert } from "react-native";

const { SensitiveScan } = NativeModules;


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
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      return {
        success: false,
        blurredImagePath: imagePath,
        sensitiveItemsFound: 0,
        sensitiveItemsBlurred: 0,
        message: "Sensitive content scanning only available on iOS and Android",
      };
    }

    if (!SensitiveScan) {
      throw new Error("SensitiveScan module not available");
    }

    try {
      const result = await SensitiveScan.scanAndBlurSensitiveContent(imagePath);
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
      Alert.alert(
        "Scan Error",
        "Unable to scan image for sensitive content. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    }
  }
}
