import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import {
  processImage,
  validateImageFile,
  formatFileSize,
  ImageProcessingResult,
  isImageUploadSupported,
  IMAGE_CONFIG
} from '../utils/imageUtils';

interface ImageUploadProps {
  onImageSelected: (imageData: ImageProcessingResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  style?: any;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelected,
  onError,
  disabled = false,
  style
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelection = async (file: File) => {
    try {
      setIsProcessing(true);

      // Validate the file
      const validationError = validateImageFile(file);
      if (validationError) {
        const errorMessage = validationError.message;
        if (onError) {
          onError(errorMessage);
        } else {
          Alert.alert('Invalid Image', errorMessage);
        }
        return;
      }

      console.log('📸 Processing image:', {
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type
      });

      // Process the image
      const result = await processImage(file);
      
      console.log('✅ Image processed successfully:', {
        originalSize: formatFileSize(result.originalSize),
        compressedSize: formatFileSize(result.compressedSize),
        dimensions: `${result.width}x${result.height}`,
        compression: `${Math.round((1 - result.compressedSize / result.originalSize) * 100)}%`
      });

      onImageSelected(result);

    } catch (error) {
      console.error('❌ Image processing failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Processing Error', errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWebFileSelection = () => {
    if (Platform.OS !== 'web') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = IMAGE_CONFIG.SUPPORTED_FORMATS.join(',');
    input.multiple = false;

    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        handleImageSelection(file);
      }
    };

    input.click();
  };

  const handleNativeImageSelection = async () => {
    if (Platform.OS === 'web') return;

    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Convert to File-like object for handleImageSelection
        const imageFile = {
          uri: asset.uri,
          base64: asset.base64,
          width: asset.width,
          height: asset.height,
          type: 'image/jpeg',
          size: asset.base64 ? asset.base64.length * 0.75 : 0, // Approximate size
        };
        
        handleImageSelection(imageFile as any);
      }
    } catch (error) {
      console.error('❌ Native image picker failed:', error);
      if (onError) {
        onError('Failed to open image picker');
      }
    }
  };

  const handlePress = () => {
    if (disabled || isProcessing) return;

    if (!isImageUploadSupported()) {
      const errorMessage = 'Image upload is not supported on this platform';
      if (onError) {
        onError(errorMessage);
      } else {
        Alert.alert('Not Supported', errorMessage);
      }
      return;
    }

    if (Platform.OS === 'web') {
      handleWebFileSelection();
    } else {
      handleNativeImageSelection();
    }
  };

  const showUploadInfo = () => {
    Alert.alert(
      'Image Upload',
      `You can upload images in the following formats:\n• JPEG, PNG, WebP\n• Maximum size: ${formatFileSize(IMAGE_CONFIG.MAX_FILE_SIZE)}\n• Maximum dimensions: ${IMAGE_CONFIG.MAX_DIMENSION}px\n\nImages will be automatically compressed for optimal performance.`
    );
  };

  if (!isImageUploadSupported()) {
    return null; // Hide component if not supported
  }

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.uploadButton,
          (disabled || isProcessing) && styles.uploadButtonDisabled
        ]}
        onPress={handlePress}
        disabled={disabled || isProcessing}
        activeOpacity={0.7}
      >
        {isProcessing ? (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.processingText}>Processing...</Text>
          </View>
        ) : (
          <Feather 
            name="camera" 
            size={20} 
            color={disabled ? '#C7C7CC' : '#007AFF'} 
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  uploadTextDisabled: {
    color: '#C7C7CC',
  },
  processingText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
});

export default ImageUpload;