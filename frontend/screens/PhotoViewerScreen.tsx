import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  const [showControls, setShowControls] = useState(true); // Always show controls
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockedImages, setUnlockedImages] = useState<Set<number>>(new Set());
  const [authenticatedImages, setAuthenticatedImages] = useState<Set<number>>(
    new Set()
  );
  const [showInfo, setShowInfo] = useState(false);
  const [imageMetadata, setImageMetadata] = useState<ImageData[]>([]);

  // Animation values - start with controls visible
  const headerAnimation = useRef(new Animated.Value(1)).current;
  const footerAnimation = useRef(new Animated.Value(1)).current;

  const storageManager = new StorageManager();

  useEffect(() => {
    loadImageMetadata();
  }, []);

  const loadImageMetadata = async () => {
    const metadata = await storageManager.loadImageMetadata();
    setImageMetadata(metadata);
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
      const metadata = imageMetadata.find(
        (item) => item.originalPath === images[index] || item.blurredPath === images[index]
      );
      return metadata?.originalPath || images[index];
    }
    return images[index];
  };

  const getCurrentImageMetadata = (): ImageData | null => {
    if (
      !images ||
      images.length === 0 ||
      currentIndex < 0 ||
      currentIndex >= images.length
    ) {
      return null;
    }

    const currentImagePath = images[currentIndex];
    // Look for metadata by both originalPath and blurredPath
    const metadata = imageMetadata.find(
      (item) => item.originalPath === currentImagePath || item.blurredPath === currentImagePath
    );
    return metadata || null;
  };

  const renderInfoContent = () => {
    const metadata = getCurrentImageMetadata();
    if (!metadata) {
      return <Text style={styles.infoPanelText}>No metadata available</Text>;
    }

    return (
      <>
        {/* Summary section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Summary</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Faces detected:</Text>
            <Text style={styles.infoValue}>{metadata.faceCount || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PII items:</Text>
            <Text style={styles.infoValue}>{metadata.piiCount || 0}</Text>
          </View>
        </View>

        {/* PII Data section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Detected Information</Text>
          {metadata.piiTexts && Array.isArray(metadata.piiTexts) && metadata.piiTexts.length > 0 ? (
            <View style={styles.piiList}>
              {metadata.piiTexts
                .filter((piiText) => piiText && String(piiText).trim() !== "")
                .map((piiText, index) => {
                  const displayText = String(piiText).trim();
                  return (
                    <View key={index} style={styles.piiItem}>
                      <Text style={styles.piiText}>{displayText}</Text>
                    </View>
                  );
                })}
            </View>
          ) : (
            <Text style={styles.infoPanelText}>No sensitive information found</Text>
          )}
        </View>

        {/* Status section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoSectionTitle}>Status</Text>
          <Text style={styles.infoPanelText}>
            {(metadata.faceCount && metadata.faceCount > 0) || 
             (metadata.piiCount && metadata.piiCount > 0) 
              ? "Content has been protected for privacy" 
              : "No sensitive content detected"}
          </Text>
        </View>
      </>
    );
  };

  // --- Swipe down handler ---
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only allow swipe down when info panel is not visible
        if (showInfo) return false;
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          onBack(); // swipe down closes viewer
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* Main Image Layer */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!showInfo}
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
        {...(showInfo ? {} : panResponder.panHandlers)}
      >
        {images.map((imageUri, index) => (
          <View key={index} style={styles.imagePage}>
            <View style={styles.imageContainer}>
                              <Image
                  source={{ uri: getImageToDisplay(index) }}
                  style={styles.image}
                  resizeMode="contain"
                />
              </View>
          </View>
        ))}
      </ScrollView>

      {/* Header Overlay */}
      <Animated.View
        style={[
          styles.headerOverlay,
          {
            opacity: headerAnimation,
            transform: [
              {
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-120, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showControls ? "auto" : "none"}
      >
        <TouchableOpacity onPress={onBack} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.imageCounter}>
          {currentIndex + 1} / {images.length}
        </Text>

        <TouchableOpacity onPress={handleInfoPress} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Info</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Footer Overlay */}
      <Animated.View
        style={[
          styles.footerOverlay,
          {
            opacity: footerAnimation,
            transform: [
              {
                translateY: footerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [120, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showControls ? "auto" : "none"}
      >
        {/* Lock/Unlock button */}
        <TouchableOpacity
          style={styles.lockButton}
          onPress={() => {
            if (authenticatedImages.has(currentIndex)) {
              if (unlockedImages.has(currentIndex)) {
                setUnlockedImages((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(currentIndex);
                  return newSet;
                });
              } else {
                setUnlockedImages((prev) => new Set([...prev, currentIndex]));
              }
            } else {
              handleEnterPassword();
            }
          }}
        >
          <Ionicons name="lock-closed-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {/* Info Panel - Slides up from bottom */}
      {authenticatedImages.has(currentIndex) && showInfo && (
        <View style={styles.infoPanelContainer}>
          <TouchableOpacity
            style={styles.infoPanelOverlay}
            onPress={handleInfoTap}
            activeOpacity={1}
          />
          <View style={styles.infoPanel}>
            <View style={styles.infoPanelHeader}>
              <View style={styles.infoPanelHandle} />
              <Text style={styles.infoPanelTitle}>Privacy Information</Text>
            </View>
            <ScrollView
              style={styles.infoPanelScroll}
              contentContainerStyle={styles.infoPanelContent}
              showsVerticalScrollIndicator={false}
            >
              {renderInfoContent()}
            </ScrollView>
          </View>
        </View>
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
  // 🔥 keep all your styles here unchanged (except lockButtonIcon removed)
  container: { flex: 1, backgroundColor: "#000000" },
  scrollView: {
    flex: 1,
    height: screenHeight,
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
    backgroundColor: "#000000",
  },
  image: { width: "100%", height: "100%" },
  // New Info Panel Styles
  infoPanelContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3000,
  },
  infoPanelOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    minHeight: "40%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  infoPanelHeader: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoPanelHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 12,
  },
  infoPanelTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C2C2E",
    letterSpacing: -0.2,
  },
  infoPanelScroll: {
    flex: 1,
  },
  infoPanelContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoPanelText: {
    fontSize: 15,
    color: "#2C2C2E",
    lineHeight: 22,
    fontWeight: "400",
  },
  infoSection: {
    marginBottom: 24,
  },
  infoSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2E",
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F8F8F8",
  },
  infoLabel: {
    fontSize: 15,
    color: "#6C6C70",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#2C2C2E",
    fontWeight: "600",
  },
  piiList: {
    marginTop: 8,
  },
  piiItem: {
    backgroundColor: "#F8F8F8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  piiText: {
    fontSize: 14,
    color: "#2C2C2E",
    lineHeight: 20,
    fontWeight: "500",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 54,
    backgroundColor: "#F7F7F7",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E7",
    zIndex: 1000,
  },
  headerButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerButtonText: { color: "#2C2C2E", fontSize: 18, fontWeight: "600" },
  imageCounter: {
    color: "#2C2C2E",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  footerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 50,
    backgroundColor: "#F7F7F7",
    borderTopWidth: 0.5,
    borderTopColor: "#E5E5E7",
    zIndex: 1000,
  },
  footerButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  footerButtonText: {
    color: "#2C2C2E",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  lockButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F78231",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
    shadowColor: "#F78231",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingTop: 250, // Move modal higher up
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    color: "#2C2C2E",
    letterSpacing: -0.3,
  },
  passwordInput: {
    width: "100%",
    height: 52,
    borderColor: "#E5E5E7",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    fontSize: 16,
    color: "#2C2C2E",
    backgroundColor: "#F7F7F7",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#8E8E93", borderWidth: 0 },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  submitButton: { backgroundColor: "#F78231", borderWidth: 0 },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});
