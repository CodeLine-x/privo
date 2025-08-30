import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { StorageManager } from "../utils/StorageManager";

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: "original" | "blurred" | "thumbnail";
  uri: string;
}

export function FileSystemViewer() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const storageManager = new StorageManager();

  useEffect(() => {
    loadFileSystem();
  }, []);

  const loadFileSystem = async () => {
    try {
      console.log("=== Loading File System ===");

      // Get cache directory
      const cacheDir = FileSystem.cacheDirectory;
      console.log("Cache directory:", cacheDir);

      // Get document directory
      const documentDir = FileSystem.documentDirectory;
      console.log("Document directory:", documentDir);

      // List all files in cache directory
      const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);
      console.log("Cache files:", cacheFiles);

      // List all files in document directory
      const documentFiles = await FileSystem.readDirectoryAsync(documentDir);
      console.log("Document files:", documentFiles);

      const allFiles: FileInfo[] = [];

      // Process cache files
      for (const fileName of cacheFiles) {
        if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const filePath = `${cacheDir}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists) {
            let type: "original" | "blurred" | "thumbnail" = "original";
            if (fileName.includes("_blurred_thumb")) {
              type = "thumbnail";
            } else if (fileName.includes("_blurred")) {
              type = "blurred";
            }

            allFiles.push({
              name: fileName,
              path: filePath,
              size: fileInfo.size || 0,
              type,
              uri: `file://${filePath}`,
            });
          }
        }
      }

      // Process document files
      for (const fileName of documentFiles) {
        if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const filePath = `${documentDir}${fileName}`;
          const fileInfo = await FileSystem.getInfoAsync(filePath);

          if (fileInfo.exists) {
            let type: "original" | "blurred" | "thumbnail" = "original";
            if (fileName.includes("_blurred_thumb")) {
              type = "thumbnail";
            } else if (fileName.includes("_blurred")) {
              type = "blurred";
            }

            allFiles.push({
              name: fileName,
              path: filePath,
              size: fileInfo.size || 0,
              type,
              uri: `file://${filePath}`,
            });
          }
        }
      }

      // Sort files by name for better organization
      allFiles.sort((a, b) => a.name.localeCompare(b.name));

      console.log("All image files found:", allFiles);
      setFiles(allFiles);
    } catch (error) {
      console.error("Error loading file system:", error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "original":
        return "#007AFF";
      case "blurred":
        return "#FF3B30";
      case "thumbnail":
        return "#34C759";
      default:
        return "#8E8E93";
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case "original":
        return "📷";
      case "blurred":
        return "🔒";
      case "thumbnail":
        return "🖼️";
      default:
        return "📄";
    }
  };

  const handleFilePress = (file: FileInfo) => {
    setSelectedFile(file);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedFile(null);
  };

  const refreshFiles = () => {
    loadFileSystem();
  };

  const clearAllFiles = async () => {
    try {
      console.log("=== Clearing all image files ===");

      // Get cache directory
      const cacheDir = FileSystem.cacheDirectory;
      const documentDir = FileSystem.documentDirectory;

      // List all files in cache directory
      const cacheFiles = await FileSystem.readDirectoryAsync(cacheDir);

      // List all files in document directory
      const documentFiles = await FileSystem.readDirectoryAsync(documentDir);

      let deletedCount = 0;

      // Delete cache image files
      for (const fileName of cacheFiles) {
        if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const filePath = `${cacheDir}${fileName}`;
          try {
            await FileSystem.deleteAsync(filePath);
            console.log(`Deleted cache file: ${fileName}`);
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete cache file ${fileName}:`, error);
          }
        }
      }

      // Delete document image files
      for (const fileName of documentFiles) {
        if (fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
          const filePath = `${documentDir}${fileName}`;
          try {
            await FileSystem.deleteAsync(filePath);
            console.log(`Deleted document file: ${fileName}`);
            deletedCount++;
          } catch (error) {
            console.error(`Failed to delete document file ${fileName}:`, error);
          }
        }
      }

      console.log(`Deleted ${deletedCount} image files`);

      // Refresh the file list
      await loadFileSystem();

      Alert.alert(
        "Files Cleared",
        `Successfully deleted ${deletedCount} image files.`
      );
    } catch (error) {
      console.error("Error clearing files:", error);
      Alert.alert("Error", "Failed to clear some files. Please try again.");
    }
  };

  if (!isExpanded) {
    return (
      <View style={styles.collapsedContainer}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(true)}
        >
          <Text style={styles.expandButtonText}>
            📁 Show File System ({files.length} files)
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📁 File System</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshFiles}>
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={clearAllFiles}>
            <Text style={styles.clearButtonText}>🗑️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsExpanded(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.fileList} showsVerticalScrollIndicator={false}>
        {files.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No image files found</Text>
            <Text style={styles.emptySubtext}>
              Upload some images to see them here
            </Text>
          </View>
        ) : (
          files.map((file, index) => (
            <TouchableOpacity
              key={index}
              style={styles.fileItem}
              onPress={() => handleFilePress(file)}
            >
              <View style={styles.fileInfo}>
                <Text style={styles.fileIcon}>{getTypeIcon(file.type)}</Text>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {formatFileSize(file.size)}
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getTypeColor(file.type) },
                ]}
              >
                <Text style={styles.typeText}>{file.type}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedFile?.name}</Text>
              <TouchableOpacity onPress={closeModal}>
                <Text style={styles.modalCloseButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedFile && (
              <View style={styles.modalBody}>
                <Image
                  source={{ uri: selectedFile.uri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                  onError={() => {
                    Alert.alert("Error", "Failed to load image");
                  }}
                />
                <View style={styles.modalInfo}>
                  <Text style={styles.modalInfoText}>
                    <Text style={styles.modalInfoLabel}>Type:</Text>{" "}
                    {selectedFile.type}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    <Text style={styles.modalInfoLabel}>Size:</Text>{" "}
                    {formatFileSize(selectedFile.size)}
                  </Text>
                  <Text style={styles.modalInfoText}>
                    <Text style={styles.modalInfoLabel}>Path:</Text>{" "}
                    {selectedFile.path}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  collapsedContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  expandButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
  },
  expandButtonText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  container: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    maxHeight: 300,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  refreshButton: {
    padding: 4,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#FF3B30",
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6c757d",
  },
  fileList: {
    maxHeight: 200,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  emptySubtext: {
    fontSize: 12,
    color: "#adb5bd",
    marginTop: 4,
  },
  fileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fileIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    margin: 20,
    maxWidth: "90%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    flex: 1,
  },
  modalCloseButton: {
    fontSize: 18,
    color: "#6c757d",
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  modalImage: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalInfo: {
    gap: 8,
  },
  modalInfoText: {
    fontSize: 14,
    color: "#212529",
  },
  modalInfoLabel: {
    fontWeight: "600",
  },
});
