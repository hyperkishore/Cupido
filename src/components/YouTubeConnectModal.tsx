import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import youtubeData from '../data/youtube-sample.json';

interface YouTubeConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export const YouTubeConnectModal: React.FC<YouTubeConnectModalProps> = ({
  visible,
  onClose,
  onConnect,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{youtubeData.title}</Text>
          <TouchableOpacity onPress={onConnect} style={styles.connectButton}>
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>{youtubeData.description}</Text>

          {youtubeData.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionHeading}>{section.heading}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          {/* Sample Insights Section */}
          <View style={styles.section}>
            <Text style={styles.sectionHeading}>Sample Personality Insights</Text>
            <Text style={styles.sectionSubtext}>
              Here's an example of the insights we could generate from your YouTube activity:
            </Text>
            
            {youtubeData.sample_insights.map((insight, index) => (
              <View key={index} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={styles.insightTrait}>{insight.trait}</Text>
                  <Text style={styles.insightConfidence}>{insight.confidence}%</Text>
                </View>
                <Text style={styles.insightValue}>{insight.value}</Text>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  closeButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 22,
    marginVertical: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  sectionSubtext: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTrait: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
  insightValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 15,
    color: '#8E8E93',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});