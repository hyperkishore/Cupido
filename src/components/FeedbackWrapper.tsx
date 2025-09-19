import React, { useState, useRef } from 'react';
import { TouchableOpacity, View, Platform } from 'react-native';
import { useFeedback } from '../contexts/FeedbackContext';
import { FeedbackCapture } from './FeedbackCapture';

interface FeedbackWrapperProps {
  children: React.ReactNode;
  componentId: string;
  componentType: string;
  screenName?: string;
  disabled?: boolean;
}

export const FeedbackWrapper: React.FC<FeedbackWrapperProps> = ({
  children,
  componentId,
  componentType,
  screenName,
  disabled = false,
}) => {
  const { feedbackMode, currentScreen } = useFeedback();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [elementBounds, setElementBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const viewRef = useRef<View>(null);

  const handleLongPress = () => {
    if (!feedbackMode || disabled) return;

    // Measure the element bounds
    viewRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setElementBounds({ x: pageX, y: pageY, width, height });
      setShowFeedbackModal(true);
    });
  };

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false);
  };

  // If feedback mode is disabled, render children normally
  if (!feedbackMode) {
    return <>{children}</>;
  }

  return (
    <>
      <TouchableOpacity
        ref={viewRef}
        onLongPress={handleLongPress}
        delayLongPress={800} // 800ms long press
        activeOpacity={0.8}
        style={feedbackMode ? {
          borderWidth: 1,
          borderColor: 'rgba(0, 122, 255, 0.3)',
          borderStyle: 'dashed',
        } : undefined}
      >
        {children}
      </TouchableOpacity>

      <FeedbackCapture
        visible={showFeedbackModal}
        onClose={handleCloseFeedback}
        elementInfo={{
          componentId,
          componentType,
          bounds: elementBounds,
          screenName: screenName || currentScreen,
        }}
      />
    </>
  );
};

// Higher-order component for easier usage
export function withElementFeedback<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentType: string,
  componentId?: string
) {
  const WithElementFeedbackComponent: React.FC<T> = (props) => {
    const id = componentId || WrappedComponent.displayName || WrappedComponent.name || 'Unknown';
    
    return (
      <FeedbackWrapper
        componentId={id}
        componentType={componentType}
      >
        <WrappedComponent {...props} />
      </FeedbackWrapper>
    );
  };

  WithElementFeedbackComponent.displayName = `withElementFeedback(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithElementFeedbackComponent;
}