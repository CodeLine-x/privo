import { NativeModules, Platform, Alert } from "react-native";

const { SensitiveScan } = NativeModules;

console.log("NativeBridge: Available modules:", Object.keys(NativeModules));
console.log("NativeBridge: SensitiveScan module:", SensitiveScan);
console.log("NativeBridge: Platform:", Platform.OS);
console.log(
  "NativeBridge: All NativeModules keys:",
  Object.keys(NativeModules)
);
console.log("NativeBridge: NativeModules object:", NativeModules);

// Check if SensitiveScan exists
if (SensitiveScan) {
  console.log("NativeBridge: SensitiveScan module found!");
  console.log(
    "NativeBridge: SensitiveScan methods:",
    Object.keys(SensitiveScan)
  );
} else {
  console.log("NativeBridge: SensitiveScan module NOT found!");
  console.log("NativeBridge: Available modules that might be related:");
  Object.keys(NativeModules).forEach((key) => {
    if (
      key.toLowerCase().includes("sensitive") ||
      key.toLowerCase().includes("scan") ||
      key.toLowerCase().includes("face")
    ) {
      console.log(
        "NativeBridge: Found related module:",
        key,
        NativeModules[key]
      );
    }
  });
}

export interface FaceCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface FaceDetectionResult {
  hasFaces: boolean;
  faceCount: number;
  message: string;
  faces?: FaceCoordinate[];
}

export interface BlurResult {
  success: boolean;
  blurredImagePath: string;
  facesBlurred: number;
  message: string;
}

export class NativeBridge {
  static async detectFaces(imagePath: string): Promise<FaceDetectionResult> {
    console.log("NativeBridge: detectFaces called with path:", imagePath);
    console.log("NativeBridge: Platform is:", Platform.OS);

    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      // Return mock result for unsupported platforms
      return {
        hasFaces: false,
        faceCount: 0,
        message: "Face detection only available on iOS and Android",
      };
    }

    if (!SensitiveScan) {
      console.error("NativeBridge: SensitiveScan module is not available!");
      throw new Error("SensitiveScan module is not available");
    }

    try {
      console.log("NativeBridge: Calling SensitiveScan.detectFaces...");
      const result = await SensitiveScan.detectFaces(imagePath);
      console.log("NativeBridge: detectFaces result:", result);
      return result;
    } catch (error) {
      console.error("NativeBridge: Error detecting faces:", error);
      throw error;
    }
  }

  static async blurFacesInImage(imagePath: string): Promise<BlurResult> {
    console.log("NativeBridge: blurFacesInImage called with path:", imagePath);

    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      // Return mock result for unsupported platforms
      return {
        success: false,
        blurredImagePath: imagePath,
        facesBlurred: 0,
        message: "Face blurring only available on iOS and Android",
      };
    }

    if (!SensitiveScan) {
      console.error("NativeBridge: SensitiveScan module is not available!");
      throw new Error("SensitiveScan module is not available");
    }

    try {
      console.log("NativeBridge: Calling SensitiveScan.blurFacesInImage...");
      const result = await SensitiveScan.blurFacesInImage(imagePath);
      console.log("NativeBridge: blurFacesInImage result:", result);
      return result;
    } catch (error) {
      console.error("NativeBridge: Error blurring faces:", error);
      throw error;
    }
  }

  static async scanImageAndOfferBlur(
    imagePath: string,
    onBlurComplete?: (blurredPath: string) => void
  ): Promise<void> {
    try {
      const result = await this.detectFaces(imagePath);

      if (result.hasFaces) {
        Alert.alert(
          "Sensitive Content Detected",
          `Found ${result.faceCount} face(s) in the image. This content contains privacy-sensitive information.`,
          [
            { text: "Keep Original", style: "cancel" },
            {
              text: "Blur Faces",
              style: "default",
              onPress: async () => {
                try {
                  const blurResult = await this.blurFacesInImage(imagePath);

                  if (blurResult.success && onBlurComplete) {
                    onBlurComplete(blurResult.blurredImagePath);
                  }
                  Alert.alert("Faces Blurred", blurResult.message, [
                    { text: "OK", style: "default" },
                  ]);
                } catch (error) {
                  console.error("Error blurring faces:", error);
                  Alert.alert(
                    "Blur Error",
                    "Failed to blur faces. Please try again.",
                    [{ text: "OK", style: "default" }]
                  );
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "No Sensitive Content",
          "No faces detected in this image. Content appears safe to share.",
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

  static async scanImageAndAlert(imagePath: string): Promise<void> {
    try {
      const result = await this.detectFaces(imagePath);

      if (result.hasFaces) {
        Alert.alert(
          "Sensitive Content Detected",
          `Found ${result.faceCount} face(s) in the image. This content contains privacy-sensitive information.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        Alert.alert(
          "No Sensitive Content",
          "No faces detected in this image. Content appears safe to share.",
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
