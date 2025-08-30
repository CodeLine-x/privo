import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";

interface PasswordPromptProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PasswordPrompt({
  visible,
  onClose,
  onSuccess,
}: PasswordPromptProps) {
  const [password, setPassword] = useState("");
  const CORRECT_PASSWORD = "1234";

  const handleSubmit = () => {
    if (password === CORRECT_PASSWORD) {
      setPassword("");
      onSuccess();
    } else {
      Alert.alert("Incorrect Password", "Please try again.");
      setPassword("");
    }
  };

  const handleCancel = () => {
    setPassword("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>🔒 Enter Password</Text>
          <Text style={styles.hint}>Hint: The password is 1234</Text>

          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter password"
            secureTextEntry={true}
            keyboardType="numeric"
            maxLength={4}
            autoFocus={true}
            onSubmitEditing={handleSubmit}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    backgroundColor: "#6c757d",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  submitButton: {
    flex: 1,
    height: 44,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});
