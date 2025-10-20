import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  confirmStyle = 'default',
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.dialog}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            
            <View style={[
              styles.buttonContainer, 
              confirmStyle === 'destructive' ? styles.verticalButtons : styles.horizontalButtons
            ]}>
              {/* For destructive actions, show confirm button first (Apple pattern) */}
              {confirmStyle === 'destructive' ? (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.destructiveButton]} 
                    onPress={onConfirm}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.destructiveButtonText}>{confirmText}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={onCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]} 
                    onPress={onCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>{cancelText}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.confirmButton]} 
                    onPress={onConfirm}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmButtonText}>{confirmText}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14, // iOS standard corner radius
    paddingTop: 24,
    paddingBottom: 0,
    paddingHorizontal: 0,
    minWidth: 270, // iOS alert minimum width
    maxWidth: 320, // iOS alert maximum width
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 17, // iOS system font size for alert titles
    fontWeight: '600', // iOS semibold
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  message: {
    fontSize: 13, // iOS system font size for alert messages
    color: '#000000',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 24,
  },
  buttonContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
  },
  horizontalButtons: {
    flexDirection: 'row',
  },
  verticalButtons: {
    flexDirection: 'column',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // iOS minimum touch target
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  confirmButton: {
    backgroundColor: 'transparent',
    borderLeftWidth: 0.5,
    borderLeftColor: '#C6C6C8',
  },
  destructiveButton: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  cancelButtonText: {
    fontSize: 17, // iOS system font size for alert buttons
    fontWeight: '400', // iOS regular weight for cancel
    color: '#007AFF', // iOS system blue
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600', // iOS semibold for primary action
    color: '#007AFF',
  },
  destructiveButtonText: {
    fontSize: 17,
    fontWeight: '400', // iOS regular weight for destructive
    color: '#FF3B30', // iOS system red
  },
});