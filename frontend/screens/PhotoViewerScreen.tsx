import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { StorageManager, ImageData } from "../utils/StorageManager";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface PhotoViewerScreenProps {
  images: string[];
  initialIndex: number;
  onBack: () => void;
}

export function PhotoViewerScreen({
  images,
  initialIndex,
  onBack,
}: PhotoViewerScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showControls, setShowControls] = useState(true);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockedImages, setUnlockedImages] = useState<Set<number>>(new Set());
  const [authenticatedImages, setAuthenticatedImages] = useState<Set<number>>(
    new Set()
  );
  const [showInfo, setShowInfo] = useState(false);
  const [imageMetadata, setImageMetadata] = useState<ImageData[]>([]);

  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, []);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.loadImageMetadata();
    setImageMetadata(metadata);
  };

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const handleEnterPassword = () => {
    setIsPasswordModalVisible(true);
  };

  const handlePasswordSubmit = () => {
    if (password === "1234") {
      setUnlockedImages((prev) => new Set([...prev, currentIndex]));
      setAuthenticatedImages((prev) => new Set([...prev, currentIndex]));
      setIsPasswordModalVisible(false);
      setPassword("");
      setShowInfo(false);
    } else {
      Alert.alert("Incorrect Password", "Please try again.");
      setPassword("");
    }
  };

  const handleInfoPress = () => {
    if (authenticatedImages.has(currentIndex)) {
      setShowInfo(!showInfo);
    } else {
      handleEnterPassword();
    }
  };

  const handleInfoTap = () => {
    setShowInfo(false);
  };

  const getImageToDisplay = (index: number): string => {
    if (unlockedImages.has(index)) {
      // Show original image if unlocked
      const metadata = imageMetadata.find(
        (item) => item.blurredPath === images[index]
      );
      return metadata?.originalPath || images[index];
    }
    // Show blurred image
    return images[index];
  };

  const getCurrentImageMetadata = (): ImageData | null => {
    const metadata = imageMetadata.find(
      (item) => item.blurredPath === images[currentIndex]
    );
    return metadata || null;
  };

  return (
    <View style={styles.container}>
      {/* Main Image Layer - Full Screen */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!showInfo} // Disable swipe when info popup is active
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / screenWidth
          );
          if (
            newIndex !== currentIndex &&
            newIndex >= 0 &&
            newIndex < images.length
          ) {
            setCurrentIndex(newIndex);
            setShowInfo(false);
          }
        }}
        contentOffset={{ x: currentIndex * screenWidth, y: 0 }}
        style={styles.scrollView}
      >
        {images.map((imageUri, index) => (
          <View key={index} style={styles.imagePage}>
            <TouchableOpacity
              style={[
                styles.imageContainer,
                { backgroundColor: showControls ? "#ffffff" : "#000000" },
              ]}
              onPress={toggleControls}
              activeOpacity={1}
            >
              <Image
                source={{ uri: getImageToDisplay(index) }}
                style={styles.image}
                resizeMode="contain"
              />

              {/* Enter Password Button - Always show if not authenticated */}
              {!authenticatedImages.has(index) && (
                <View style={styles.passwordButtonContainer}>
                  <TouchableOpacity
                    style={styles.passwordButton}
                    onPress={handleEnterPassword}
                  >
                    <Text style={styles.passwordButtonText}>
                      Enter Password
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Header Overlay Layer */}
      {showControls && (
        <View style={styles.headerOverlay}>
          <TouchableOpacity onPress={onBack} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>

          <Text style={styles.imageCounter}>
            {currentIndex + 1} / {images.length}
          </Text>

          <TouchableOpacity
            onPress={handleInfoPress}
            style={styles.headerButton}
          >
            <Text style={styles.headerButtonText}>ⓘ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Footer Overlay Layer */}
      {showControls && (
        <View style={styles.footerOverlay}>
          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonIcon}>📤</Text>
            <Text style={styles.footerButtonText}>Share</Text>
          </TouchableOpacity>

          {/* Show/Hide button - only visible after password is entered */}
          {authenticatedImages.has(currentIndex) && (
            <TouchableOpacity
              style={styles.footerButton}
              onPress={() => {
                // Toggle between showing blurred and original image
                if (unlockedImages.has(currentIndex)) {
                  setUnlockedImages((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(currentIndex);
                    return newSet;
                  });
                } else {
                  setUnlockedImages((prev) => new Set([...prev, currentIndex]));
                }
              }}
            >
              <Text style={styles.footerButtonIcon}>
                {unlockedImages.has(currentIndex) ? "🙈" : "👁️"}
              </Text>
              <Text style={styles.footerButtonText}>
                {unlockedImages.has(currentIndex) ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonIcon}>🗑️</Text>
            <Text style={styles.footerButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Info Display Modal - Only show if unlocked and showInfo is true */}
      {authenticatedImages.has(currentIndex) && showInfo && (
        <TouchableOpacity
          style={styles.infoContainer}
          onPress={handleInfoTap}
          activeOpacity={1}
        >
          <ScrollView
            style={styles.infoScrollView}
            contentContainerStyle={styles.infoScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Image Information</Text>
              {(() => {
                const metadata = getCurrentImageMetadata();
                return (
                  <>
                    <Text style={styles.infoText}>
                      Faces detected: {metadata?.faceCount || 0}
                    </Text>
                    <Text style={styles.infoText}>
                      Text detected: {metadata?.textCount || 0}
                    </Text>
                    <Text style={styles.infoText}>
                      PII detected: {metadata?.piiCount || 0}
                    </Text>
                    {metadata?.detectedTexts &&
                      metadata.detectedTexts.length > 0 && (
                        <Text style={styles.infoText}>
                          Detected text: {metadata.detectedTexts.join(", ")}
                        </Text>
                      )}
                    {metadata?.piiTexts && metadata.piiTexts.length > 0 && (
                      <Text style={styles.infoText}>
                        PII text: {metadata.piiTexts.join(", ")}
                      </Text>
                    )}
                  </>
                );
              })()}
            </View>
          </ScrollView>
        </TouchableOpacity>
      )}

      {/* Password Modal */}
      <Modal
        visible={isPasswordModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Password</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsPasswordModalVisible(false);
                  setPassword("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handlePasswordSubmit}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
    height: screenHeight, // Full screen minus header (100) + footer (160)
    marginTop: 120,
    marginBottom: 120,
  },
  imagePage: {
    width: screenWidth,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  passwordButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  passwordButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffffff",
  },
  passwordButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 3000, // Higher than header/footer (1000) and covers entire screen
  },
  infoScrollView: {
    width: "100%",
    height: "100%",
  },
  infoScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#000000",
  },
  infoText: {
    fontSize: 16,
    color: "#000000",
    marginBottom: 5,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120, // Fixed header height
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0", // Light grey border bottom
    zIndex: 1000,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  imageCounter: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
  },
  footerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120, // Fixed footer height with extra padding
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 50, // Increased margin for Android popups
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0", // Light grey border top
    zIndex: 1000,
  },
  footerButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  footerButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  footerButtonText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#000000",
  },
  passwordInput: {
    width: "100%",
    height: 50,
    borderColor: "#e0e0e0",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontSize: 18,
    color: "#000000",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#dc3545",
    borderWidth: 1,
    borderColor: "#dc3545",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#28a745",
    borderWidth: 1,
    borderColor: "#28a745",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
