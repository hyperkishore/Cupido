import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { TermsScreen } from '../screens/TermsScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';

interface ConsentStepProps {
  onAccept: () => void;
  onDecline: () => void;
}

type Tab = 'terms' | 'privacy';

const CONTENT_WIDTH = Math.min(Dimensions.get('window').width, 420);

export const ConsentStep: React.FC<ConsentStepProps> = ({ onAccept, onDecline }) => {
  const [activeTab, setActiveTab] = useState<Tab>('terms');
  const [checked, setChecked] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review & Accept</Text>
        <Text style={styles.headerSubtitle}>Please review our terms before continuing</Text>
      </View>

      {/* Tab toggle */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
            Terms of Service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {activeTab === 'terms' ? (
          <TermsScreen showActions={false} />
        ) : (
          <PrivacyScreen showActions={false} />
        )}
      </View>

      {/* Sticky bottom */}
      <View style={styles.bottomArea}>
        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setChecked(!checked)}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>{'✓'}</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            I have read and agree to the Terms of Service and Privacy Policy
          </Text>
        </TouchableOpacity>

        {/* Accept button */}
        <TouchableOpacity
          style={[styles.acceptButton, !checked && styles.acceptButtonDisabled]}
          onPress={onAccept}
          disabled={!checked}
        >
          <Text style={[styles.acceptButtonText, !checked && styles.acceptButtonTextDisabled]}>
            I Accept
          </Text>
        </TouchableOpacity>

        {/* Decline link */}
        <TouchableOpacity style={styles.declineLink} onPress={onDecline}>
          <Text style={styles.declineLinkText}>I don't agree</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  contentArea: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    maxWidth: CONTENT_WIDTH - 40,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C6C6C8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 16,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#1C1C1E',
  },
  acceptButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignSelf: 'stretch',
    maxWidth: CONTENT_WIDTH - 40,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  acceptButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptButtonTextDisabled: {
    color: '#8E8E93',
  },
  declineLink: {
    marginTop: 12,
    paddingVertical: 8,
  },
  declineLinkText: {
    fontSize: 14,
    color: '#8E8E93',
  },
});

export default ConsentStep;
