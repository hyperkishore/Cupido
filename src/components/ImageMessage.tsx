import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createDataUrl, formatFileSize, extractImageMetadata, ImageMetadata } from '../utils/imageUtils';
import { ImageAttachment, chatDatabase } from '../services/chatDatabase';

interface ImageMessageProps {
  imageAttachment: ImageAttachment;
  isFromUser: boolean;
  message?: string;
  timestamp?: string;
  onImagePress?: (imageAttachment: ImageAttachment) => void;
  showMetadata?: boolean;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  imageAttachment,
  isFromUser,
  message,
  timestamp,
  onImagePress,
  showMetadata = false
}) => {
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [actualImageData, setActualImageData] = useState<ImageAttachment | null>(null);

  const { width: screenWidth } = Dimensions.get('window');
  const maxImageWidth = screenWidth * 0.7; // 70% of screen width
  const maxImageHeight = 300;

  // Check if this is a placeholder that needs lazy loading
  const isPlaceholder = imageAttachment.metadata?.isPlaceholder;

  // Load actual image data when component mounts (lazy loading)
  useEffect(() => {
    if (isPlaceholder && !actualImageData) {
      const loadImageData = async () => {
        try {
          setImageLoading(true);
          const attachmentId = imageAttachment.metadata?.attachmentId;
          const messageId = imageAttachment.metadata?.messageId;
          
          let loadedImage: ImageAttachment | null = null;
          
          if (attachmentId) {
            loadedImage = await chatDatabase.getImageAttachment(attachmentId);
          } else if (messageId) {
            const messageImages = await chatDatabase.getMessageImages(messageId);
            loadedImage = messageImages[0] || null;
          }
          
          if (loadedImage) {
            setActualImageData(loadedImage);
            console.log('🖼️ Lazy loaded image:', loadedImage.id);
          } else {
            setImageError(true);
            console.error('❌ Failed to lazy load image for placeholder:', imageAttachment.id);
          }
        } catch (error) {
          console.error('❌ Error during lazy loading:', error);
          setImageError(true);
        } finally {
          setImageLoading(false);
        }
      };
      
      loadImageData();
    } else if (!isPlaceholder) {
      // Not a placeholder, use image data directly
      setActualImageData(imageAttachment);
      setImageLoading(false);
    }
  }, [isPlaceholder, imageAttachment, actualImageData]);

  // Use actual image data if available, otherwise fall back to placeholder
  const displayImage = actualImageData || imageAttachment;
  
  // Create data URL for display (only if we have actual image data)
  const imageDataUrl = displayImage.image_data ? 
    createDataUrl(displayImage.image_data, displayImage.mime_type) : null;

  // Calculate display dimensions
  const aspectRatio = imageAttachment.width && imageAttachment.height 
    ? imageAttachment.width / imageAttachment.height 
    : 1;

  let displayWidth = maxImageWidth;
  let displayHeight = displayWidth / aspectRatio;

  if (displayHeight > maxImageHeight) {
    displayHeight = maxImageHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  const handleImagePress = () => {
    if (onImagePress) {
      onImagePress(imageAttachment);
    } else {
      setShowFullScreen(true);
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('❌ Failed to load image:', imageAttachment.id);
  };

  const formatTimestamp = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const renderImageContent = () => {
    if (imageError) {
      return (
        <View style={[styles.imagePlaceholder, { width: displayWidth, height: displayHeight }]}>
          <Feather name="image" size={24} color="#C7C7CC" />
          <Text style={styles.errorText}>Failed to load image</Text>
        </View>
      );
    }

    // Show loading placeholder for lazy loading or missing image data
    if (imageLoading || !imageDataUrl) {
      return (
        <View style={[styles.imagePlaceholder, { width: displayWidth, height: displayHeight }]}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>
            {isPlaceholder ? 'Loading image...' : 'Processing...'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <TouchableOpacity
          onPress={handleImagePress}
          activeOpacity={0.8}
          style={styles.imageWrapper}
        >
          <Image
            source={{ uri: imageDataUrl }}
            style={[styles.image, { width: displayWidth, height: displayHeight }]}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay}>
            <Feather name="maximize-2" size={16} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMetadata = () => {
    if (!showMetadata || !imageAttachment.width || !imageAttachment.height) return null;

    return (
      <View style={styles.metadataContainer}>
        <Text style={styles.metadataText}>
          {imageAttachment.width}×{imageAttachment.height}
          {imageAttachment.file_size && ` • ${formatFileSize(imageAttachment.file_size)}`}
        </Text>
      </View>
    );
  };

  const renderFullScreenModal = () => (
    <Modal
      visible={showFullScreen}
      animationType="fade"
      onRequestClose={() => setShowFullScreen(false)}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.fullScreenContainer}>
        <View style={styles.fullScreenHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowFullScreen(false)}
            activeOpacity={0.7}
          >
            <Feather name="x" size={24} color="white" />
          </TouchableOpacity>
          
          {imageAttachment.ai_analysis && (
            <TouchableOpacity style={styles.infoButton} activeOpacity={0.7}>
              <Feather name="info" size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.fullScreenContent}
          maximumZoomScale={3}
          minimumZoomScale={1}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Image
            source={{ uri: imageDataUrl }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </ScrollView>

        {imageAttachment.ai_analysis && (
          <View style={styles.analysisContainer}>
            <Text style={styles.analysisTitle}>AI Analysis</Text>
            <Text style={styles.analysisText}>{imageAttachment.ai_analysis}</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={[styles.container, isFromUser ? styles.userMessage : styles.botMessage]}>
      <View style={[styles.messageContent, isFromUser ? styles.userContent : styles.botContent]}>
        {renderImageContent()}
        
        {message && (
          <Text style={[styles.messageText, isFromUser ? styles.userText : styles.botText]}>
            {message}
          </Text>
        )}
        
        {renderMetadata()}
        
        <View style={styles.messageFooter}>
          {timestamp && (
            <Text style={styles.timestamp}>
              {formatTimestamp(timestamp)}
            </Text>
          )}
          
          {imageAttachment.ai_analysis && (
            <View style={styles.aiIndicator}>
              <Feather name="eye" size={12} color="#007AFF" />
              <Text style={styles.aiText}>Analyzed</Text>
            </View>
          )}
        </View>
      </View>
      
      {renderFullScreenModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageContent: {
    maxWidth: '80%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  userContent: {
    backgroundColor: '#007AFF',
  },
  botContent: {
    backgroundColor: '#F2F2F7',
  },
  imageContainer: {
    position: 'relative',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 4,
  },
  imagePlaceholder: {
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#C7C7CC',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    padding: 12,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#000000',
  },
  metadataContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  metadataText: {
    fontSize: 11,
    color: '#8E8E93',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#8E8E93',
  },
  aiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  // Full screen modal styles
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  analysisContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    maxHeight: 200,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 20,
  },
});

export default ImageMessage;