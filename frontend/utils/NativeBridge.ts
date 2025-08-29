import { NativeModules, Platform, Alert } from "react-native";

const { SensitiveScan } = NativeModules;

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
    if (Platform.OS !== "ios") {
      // Return mock result for non-iOS platforms
      return {
        hasFaces: false,
        faceCount: 0,
        message: "Face detection only available on iOS"
      };
    }

    try {
      const result = await SensitiveScan.detectFaces(imagePath);
      return result;
    } catch (error) {
      console.error("Error detecting faces:", error);
      throw error;
    }
  }

  static async blurFacesInImage(imagePath: string): Promise<BlurResult> {
    if (Platform.OS !== "ios") {
      // Return mock result for non-iOS platforms
      return {
        success: false,
        blurredImagePath: imagePath,
        facesBlurred: 0,
        message: "Face blurring only available on iOS"
      };
    }

    try {
      const result = await SensitiveScan.blurFacesInImage(imagePath);
      return result;
    } catch (error) {
      console.error("Error blurring faces:", error);
      throw error;
    }
  }

  static async scanImageAndOfferBlur(imagePath: string, onBlurComplete?: (blurredPath: string) => void): Promise<void> {
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
                  Alert.alert(
                    "Faces Blurred",
                    blurResult.message,
                    [{ text: "OK", style: "default" }]
                  );
                } catch (error) {
                  console.error("Error blurring faces:", error);
                  Alert.alert(
                    "Blur Error",
                    "Failed to blur faces. Please try again.",
                    [{ text: "OK", style: "default" }]
                  );
                }
              }
            }
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