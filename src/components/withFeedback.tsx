import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FeedbackOverlay } from './FeedbackOverlay';
import { useFeedback } from '../contexts/FeedbackContext';

interface WithFeedbackProps {
  screenName: string;
}

export function withFeedback<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  screenName: string
) {
  const WithFeedbackComponent: React.FC<T> = (props) => {
    const { feedbackMode, setCurrentScreen } = useFeedback();

    React.useEffect(() => {
      setCurrentScreen(screenName);
    }, [setCurrentScreen]);

    return (
      <View style={styles.container}>
        <FeedbackOverlay
          visible={feedbackMode}
          onClose={() => {}}
          screenName={screenName}
        >
          <WrappedComponent {...props} />
        </FeedbackOverlay>
      </View>
    );
  };

  WithFeedbackComponent.displayName = `withFeedback(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithFeedbackComponent;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});