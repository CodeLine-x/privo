import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
  Modal,
} from "react-native";
import React, { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

export default function App() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  // Storage keys
  const UPLOADED_IMAGES_KEY = "uploaded_images";

  // Handle iOS photo library URLs by copying them to app directory
  const handleImageUri = async (uri: string): Promise<string | null> => {
    if (Platform.OS === "ios" && uri.startsWith("ph://")) {
      try {
        // Generate a unique filename
        const filename = `image_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}.jpg`;
        const destinationUri = FileSystem.documentDirectory + filename;

        // Copy the image to app's document directory
        await FileSystem.copyAsync({
          from: uri,
          to: destinationUri,
        });

        return destinationUri;
      } catch (error) {
        console.error("Error copying image:", error);
        return null; // Return null instead of throwing
      }
    }
    return uri; // Return original URI for non-iOS or non-ph:// URLs
  };

  // Validate if an image URI is safe to display
  const isValidImageUri = (uri: string | null): boolean => {
    if (!uri) return false;
    if (Platform.OS === "ios") {
      // On iOS, only allow file:// URLs or our app's document directory URLs
      return (
        uri.startsWith("file://") ||
        uri.startsWith(FileSystem.documentDirectory)
      );
    }
    return true; // Allow all URIs on other platforms
  };

  // Save uploaded images to persistent storage
  const saveImagesToStorage = async (images: string[]) => {
    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + UPLOADED_IMAGES_KEY,
        JSON.stringify(images)
      );
    } catch (error) {
      console.error("Error saving images:", error);
    }
  };

  // Load uploaded images from persistent storage
  const loadImagesFromStorage = async () => {
    try {
      const fileUri = FileSystem.documentDirectory + UPLOADED_IMAGES_KEY;
      const fileExists = await FileSystem.getInfoAsync(fileUri);

      if (fileExists.exists) {
        const data = await FileSystem.readAsStringAsync(fileUri);
        const images = JSON.parse(data);

        // Filter out any problematic ph:// URLs on iOS
        const validImages =
          Platform.OS === "ios"
            ? images.filter((uri: string) => !uri.startsWith("ph://"))
            : images;

        if (validImages.length !== images.length) {
          // Save the filtered images back to storage
          await saveImagesToStorage(validImages);
        }

        setSelectedImages(validImages);
      }
    } catch (error) {
      console.error("Error loading images:", error);
      // If there's an error loading, clear the storage to prevent future issues
      try {
        await saveImagesToStorage([]);
        setSelectedImages([]);
      } catch (clearError) {
        console.error("Error clearing storage:", clearError);
      }
    }
  };

  // Load images when component mounts
  useEffect(() => {
    loadImagesFromStorage(); // Load persistent images
  }, []);

  const handleUpload = async () => {
    Alert.alert("Upload Image", "Choose an option", [
      {
        text: "Camera",
        onPress: () => takePhoto(),
      },
      {
        text: "Gallery",
        onPress: () => pickFromGallery(),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera permission to take photos."
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        const processedImages = await Promise.all(
          result.assets.map(
            async (asset: any) => await handleImageUri(asset.uri)
          )
        );
        const validImages = processedImages.filter(
          (uri): uri is string => uri !== null
        );
        const updatedImages = [...selectedImages, ...validImages];
        setSelectedImages(updatedImages);
        await saveImagesToStorage(updatedImages);
        Alert.alert("Success", "Photo taken successfully!");
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const pickFromGallery = async () => {
    try {
      // Request permissions
      const { status: mediaLibraryStatus } =
        await MediaLibrary.requestPermissionsAsync();
      if (mediaLibraryStatus !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant media library permission to upload images."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets) {
        const processedImages = await Promise.all(
          result.assets.map(
            async (asset: any) => await handleImageUri(asset.uri)
          )
        );
        const validImages = processedImages.filter(
          (uri): uri is string => uri !== null
        );
        const updatedImages = [...selectedImages, ...validImages];
        setSelectedImages(updatedImages);
        await saveImagesToStorage(updatedImages);
        Alert.alert("Success", `${result.assets.length} image(s) selected!`);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };

  const removeImage = (index: number) => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updatedImages = selectedImages.filter((_, i) => i !== index);
          setSelectedImages(updatedImages);
          await saveImagesToStorage(updatedImages);
        },
      },
    ]);
  };

  const clearAllImages = () => {
    Alert.alert(
      "Clear All Images",
      "Are you sure you want to remove all uploaded images?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setSelectedImages([]);
            await saveImagesToStorage([]);
          },
        },
      ]
    );
  };

  const openImageModal = async (imageUri: string) => {
    try {
      // Validate the URI first
      if (!isValidImageUri(imageUri)) {
        Alert.alert(
          "Error",
          "This image cannot be displayed on iOS. Please try uploading it again."
        );
        return;
      }

      // Ensure the image URI is properly handled for iOS
      const processedUri = await handleImageUri(imageUri);
      if (processedUri) {
        setSelectedImage(processedUri);
        setIsImageModalVisible(true);
      }
    } catch (error) {
      console.error("Error opening image modal:", error);
      Alert.alert("Error", "Unable to display this image. Please try again.");
    }
  };

  const closeImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Library</Text>
          {selectedImages.length > 0 && (
            <Text style={styles.imageCount}>
              {selectedImages.length} uploaded
            </Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, styles.uploadButton]}
            onPress={handleUpload}
          >
            <Text style={styles.uploadButtonText}>Upload</Text>
          </TouchableOpacity>
          {selectedImages.length > 0 && (
            <TouchableOpacity
              style={[styles.headerButton, styles.clearButton]}
              onPress={clearAllImages}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Photo Gallery */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Uploaded Images */}
        {selectedImages.length > 0 ? (
          <View style={styles.uploadedSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              {selectedImages.map((imageUri, index) => (
                <TouchableWithoutFeedback
                  key={`uploaded-${index}`}
                  onPress={() => openImageModal(imageUri)}
                  onLongPress={() => removeImage(index)}
                >
                  <View style={styles.uploadedImageContainer}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.uploadedImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.error("Image loading error:", error);
                        // Optionally remove the problematic image
                        // removeImage(index);
                      }}
                    />
                    <View style={styles.uploadedImageOverlay}>
                      <Text style={styles.uploadedImageText}>Uploaded</Text>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              ))}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No uploaded images</Text>
            <Text style={styles.emptySubtext}>
              Upload some photos to get started!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={isImageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={closeImageModal}>
            <View style={styles.modalContent}>
              {selectedImage && isValidImageUri(selectedImage) && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error("Full screen image loading error:", error);
                    closeImageModal();
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    paddingTop: 50, // Account for status bar
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  imageCount: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: "#6c757d",
  },
  refreshButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  uploadButton: {
    backgroundColor: "#007bff",
  },
  clearButton: {
    backgroundColor: "#dc3545",
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  selectedImageContainer: {
    borderWidth: 3,
    borderColor: "#007bff",
  },
  selectedIndicator: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#007bff",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIndicatorText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: "#6c757d",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: "#6c757d",
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
  },
  uploadedSection: {
    marginBottom: 20,
  },
  albumSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  horizontalScroll: {
    paddingHorizontal: 10,
  },
  uploadedImageContainer: {
    width: 120,
    height: 120,
    marginRight: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  uploadedImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 123, 255, 0.8)",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  uploadedImageText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
});
