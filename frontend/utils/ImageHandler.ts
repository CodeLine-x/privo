import { Alert, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";

export class ImageHandler {
  async handleImageUri(uri: string): Promise<string | null> {
    if (Platform.OS === "ios" && uri.startsWith("ph://")) {
      try {
        const filename = `image_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}.jpg`;
        const destinationUri = FileSystem.documentDirectory + filename;

        await FileSystem.copyAsync({
          from: uri,
          to: destinationUri,
        });

        return destinationUri;
      } catch (error) {
        console.error("Error copying image:", error);
        return null;
      }
    }
    return uri;
  }

  isValidImageUri(uri: string | null): boolean {
    if (!uri) return false;
    if (Platform.OS === "ios") {
      return (
        uri.startsWith("file://") ||
        uri.startsWith(FileSystem.documentDirectory || "")
      );
    }
    return true;
  }

  async takePhoto(): Promise<string[]> {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant camera permission to take photos."
      );
      return [];
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets) {
      const processedImages = await Promise.all(
        result.assets.map(
          async (asset: any) => await this.handleImageUri(asset.uri)
        )
      );
      return processedImages.filter((uri): uri is string => uri !== null);
    }

    return [];
  }

  async pickFromGallery(): Promise<string[]> {
    const { status: mediaLibraryStatus } =
      await MediaLibrary.requestPermissionsAsync();
    if (mediaLibraryStatus !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant media library permission to upload images."
      );
      return [];
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets) {
      const processedImages = await Promise.all(
        result.assets.map(
          async (asset: any) => await this.handleImageUri(asset.uri)
        )
      );
      return processedImages.filter((uri): uri is string => uri !== null);
    }

    return [];
  }
}