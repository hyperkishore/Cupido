/**
 * Image Analysis Service
 * Uses Claude API to analyze images uploaded by users
 */

import { resolveApiUrl } from '../utils/apiResolver';

export interface ImageAnalysisResult {
  description: string;
  mood?: string;
  themes?: string[];
  suggestedResponse?: string;
  confidence?: number;
}

class ImageAnalysisService {
  private getProxyUrl(): string {
    return resolveApiUrl('/api/chat');
  }

  /**
   * Analyze an image using Claude's vision capabilities
   * @param imageData Base64 encoded image data (with data URI prefix)
   * @param mimeType Image MIME type (e.g., 'image/jpeg')
   * @param userMessage Optional message accompanying the image
   * @returns Analysis result with description, mood, and suggested response
   */
  async analyzeImage(
    imageData: string,
    mimeType: string,
    userMessage?: string
  ): Promise<ImageAnalysisResult | null> {
    try {
      console.log('[Image Analysis] Starting analysis...');

      // Extract base64 data without data URI prefix if present
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');

      // Create the analysis prompt
      const analysisPrompt = userMessage
        ? `The user shared an image with this message: "${userMessage}"\n\nPlease analyze the image and provide:\n1. A brief description of what you see\n2. The emotional tone or mood conveyed\n3. Key themes or subjects\n4. A thoughtful, empathetic response that acknowledges both the image and their message`
        : `Please analyze this image and provide:\n1. A brief description of what you see\n2. The emotional tone or mood conveyed\n3. Key themes or subjects\n4. A thoughtful response that could help continue the conversation`;

      // Call Claude API with vision
      const response = await fetch(this.getProxyUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: analysisPrompt,
              includeImage: true,  // Signal to include image in this message
            },
          ],
          modelType: 'sonnet',  // Sonnet 4.5 has vision capabilities
          imageData: {
            base64: base64Data,
            mimeType: mimeType,
          },
        }),
      });

      if (!response.ok) {
        console.error('[Image Analysis] API call failed:', response.status);
        return null;
      }

      const data = await response.json();
      const analysisText = data.message || '';

      console.log('[Image Analysis] ✅ Analysis complete');

      // Parse the analysis into structured format
      // For now, return the full text as description
      // In the future, we could use structured output or parse the response
      return {
        description: analysisText,
        mood: this.extractMood(analysisText),
        themes: this.extractThemes(analysisText),
        suggestedResponse: analysisText,
        confidence: 0.85,  // Default confidence
      };
    } catch (error) {
      console.error('[Image Analysis] Error:', error);
      return null;
    }
  }

  /**
   * Simple mood extraction from analysis text
   * This is a basic implementation - could be enhanced with NLP
   */
  private extractMood(text: string): string | undefined {
    const lowerText = text.toLowerCase();
    const moods = ['happy', 'sad', 'peaceful', 'excited', 'thoughtful', 'calm', 'nostalgic', 'joyful', 'melancholic'];

    for (const mood of moods) {
      if (lowerText.includes(mood)) {
        return mood;
      }
    }

    return undefined;
  }

  /**
   * Simple theme extraction from analysis text
   * This is a basic implementation - could be enhanced with NLP
   */
  private extractThemes(text: string): string[] {
    const lowerText = text.toLowerCase();
    const themeKeywords = [
      'nature',
      'people',
      'art',
      'travel',
      'food',
      'architecture',
      'landscape',
      'portrait',
      'urban',
      'abstract',
      'wildlife',
      'sunset',
      'beach',
      'mountains',
    ];

    const foundThemes: string[] = [];

    for (const theme of themeKeywords) {
      if (lowerText.includes(theme)) {
        foundThemes.push(theme);
      }
    }

    return foundThemes.slice(0, 3);  // Return max 3 themes
  }

  /**
   * Quick validation of image data
   * @param imageData Base64 encoded image
   * @param mimeType MIME type to validate
   * @returns true if image appears valid
   */
  validateImageData(imageData: string, mimeType: string): boolean {
    // Check mime type
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(mimeType.toLowerCase())) {
      console.error('[Image Analysis] Invalid MIME type:', mimeType);
      return false;
    }

    // Check if base64 data exists
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    if (!base64Data || base64Data.length < 100) {
      console.error('[Image Analysis] Image data too short or empty');
      return false;
    }

    // Check file size (max 10MB)
    const sizeInBytes = (base64Data.length * 3) / 4;
    const maxSize = 10 * 1024 * 1024;  // 10MB

    if (sizeInBytes > maxSize) {
      console.error('[Image Analysis] Image too large:', (sizeInBytes / 1024 / 1024).toFixed(2), 'MB');
      return false;
    }

    return true;
  }
}

export const imageAnalysisService = new ImageAnalysisService();
