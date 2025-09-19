import React from 'react';
import { FeedbackSystem } from './FeedbackSystem';
import { useFeedback } from '../contexts/FeedbackContext';

export function withSimpleFeedback<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  screenName: string
) {
  const WithSimpleFeedbackComponent: React.FC<T> = (props) => {
    const { setCurrentScreen } = useFeedback();

    React.useEffect(() => {
      setCurrentScreen(screenName);
    }, [setCurrentScreen]);

    return (
      <FeedbackSystem screenName={screenName}>
        <WrappedComponent {...props} />
      </FeedbackSystem>
    );
  };

  WithSimpleFeedbackComponent.displayName = `withSimpleFeedback(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithSimpleFeedbackComponent;
}