import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { theme } from '../design-system/tokens';
import { feedbackDatabase, FeedbackEntry } from '../services/feedbackDatabase';

export const FeedbackManagementScreen = () => {
  const [feedback, setFeedback] = useState<FeedbackEntry[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<FeedbackEntry[]>([]);
  const [stats, setStats] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadFeedback();
    loadStats();
  }, []);

  useEffect(() => {
    filterFeedback();
  }, [feedback, searchQuery, selectedStatus, selectedPriority]);

  const loadFeedback = async () => {
    try {
      const allFeedback = await feedbackDatabase.getAllFeedback();
      setFeedback(allFeedback);
    } catch (error) {
      console.error('Error loading feedback:', error);
      Alert.alert('Error', 'Failed to load feedback data');
    }
  };

  const loadStats = async () => {
    try {
      const feedbackStats = await feedbackDatabase.getFeedbackStats();
      setStats(feedbackStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterFeedback = () => {
    let filtered = feedback;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.feedback_text.toLowerCase().includes(query) ||
          item.screen_name.toLowerCase().includes(query) ||
          item.component_id.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    // Filter by priority
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === selectedPriority);
    }

    setFilteredFeedback(filtered);
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await feedbackDatabase.updateFeedbackStatus(id, newStatus, resolutionNotes);
      loadFeedback();
      loadStats();
      setShowDetails(false);
      setResolutionNotes('');
      Alert.alert('Success', 'Feedback status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Error', 'Failed to update feedback status');
    }
  };

  const handleExportData = async () => {
    try {
      const filePath = await feedbackDatabase.exportFeedbackData();
      Alert.alert(
        'Export Complete',
        `Feedback data exported to: ${filePath}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export feedback data');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return theme.colors.error;
      case 'high': return theme.colors.warning;
      case 'medium': return theme.colors.primary;
      case 'low': return theme.colors.success;
      default: return theme.colors.gray400;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return theme.colors.success;
      case 'in_progress': return theme.colors.warning;
      case 'pending': return theme.colors.primary;
      case 'rejected': return theme.colors.error;
      case 'archived': return theme.colors.gray400;
      default: return theme.colors.gray400;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderFeedbackCard = (item: FeedbackEntry) => (
    <TouchableOpacity
      key={item.id}
      style={styles.feedbackCard}
      onPress={() => {
        setSelectedFeedback(item);
        setShowDetails(true);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={styles.screenName}>{item.screen_name}</Text>
          <Text style={styles.componentId}>{item.component_id}</Text>
        </View>
        <View style={styles.badges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority || 'medium') }]}>
            <Text style={styles.badgeText}>{item.priority?.toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'pending') }]}>
            <Text style={styles.badgeText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.feedbackText} numberOfLines={3}>
        {item.feedback_text}
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
        <Text style={styles.timestamp}>{formatDate(item.timestamp!)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Feedback Management</Text>
          <TouchableOpacity style={styles.exportButton} onPress={handleExportData}>
            <Text style={styles.exportButtonText}>Export Data</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total || 0}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.pending || 0}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.in_progress || 0}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.completed || 0}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search feedback..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Status:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', 'pending', 'in_progress', 'completed', 'rejected', 'archived'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.filterButton,
                      selectedStatus === status && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedStatus(status)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedStatus === status && styles.filterButtonTextActive,
                      ]}
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Priority:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['all', 'low', 'medium', 'high', 'critical'].map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.filterButton,
                      selectedPriority === priority && styles.filterButtonActive,
                    ]}
                    onPress={() => setSelectedPriority(priority)}
                  >
                    <Text
                      style={[
                        styles.filterButtonText,
                        selectedPriority === priority && styles.filterButtonTextActive,
                      ]}
                    >
                      {priority.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Feedback List */}
        <View style={styles.feedbackList}>
          {filteredFeedback.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No feedback found matching your criteria</Text>
            </View>
          ) : (
            filteredFeedback.map(renderFeedbackCard)
          )}
        </View>
      </ScrollView>

      {/* Feedback Details Modal */}
      <Modal visible={showDetails} animationType="slide" onRequestClose={() => setShowDetails(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Feedback Details</Text>
            <TouchableOpacity onPress={() => setShowDetails(false)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedFeedback && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Screen:</Text>
                <Text style={styles.detailValue}>{selectedFeedback.screen_name}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Component:</Text>
                <Text style={styles.detailValue}>{selectedFeedback.component_id}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Element Bounds:</Text>
                <Text style={styles.detailValue}>{selectedFeedback.element_bounds}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Feedback:</Text>
                <Text style={styles.detailValue}>{selectedFeedback.feedback_text}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Priority:</Text>
                <Text style={[styles.detailValue, { color: getPriorityColor(selectedFeedback.priority || 'medium') }]}>
                  {selectedFeedback.priority?.toUpperCase()}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>{selectedFeedback.category?.toUpperCase()}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Current Status:</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedFeedback.status || 'pending') }]}>
                  {selectedFeedback.status?.toUpperCase()}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Submitted:</Text>
                <Text style={styles.detailValue}>{formatDate(selectedFeedback.timestamp!)}</Text>
              </View>

              {selectedFeedback.resolution_notes && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Resolution Notes:</Text>
                  <Text style={styles.detailValue}>{selectedFeedback.resolution_notes}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Update Status:</Text>
                <View style={styles.statusUpdateContainer}>
                  <TextInput
                    style={styles.resolutionInput}
                    placeholder="Add resolution notes..."
                    multiline
                    value={resolutionNotes}
                    onChangeText={setResolutionNotes}
                  />
                  <View style={styles.statusButtons}>
                    {['pending', 'in_progress', 'completed', 'rejected', 'archived'].map(status => (
                      <TouchableOpacity
                        key={status}
                        style={[styles.statusButton, { backgroundColor: getStatusColor(status) }]}
                        onPress={() => handleStatusUpdate(selectedFeedback.id!, status)}
                      >
                        <Text style={styles.statusButtonText}>{status.replace('_', ' ').toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.systemGroupedBackground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.huge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.layout.containerPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.largeTitle,
    color: theme.colors.label,
  },
  exportButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  exportButtonText: {
    ...theme.typography.footnote,
    color: theme.colors.white,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.layout.containerPadding,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  statNumber: {
    ...theme.typography.title2,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    marginTop: theme.spacing.xs,
  },
  filtersContainer: {
    paddingHorizontal: theme.layout.containerPadding,
    marginBottom: theme.spacing.lg,
  },
  searchInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  filterRow: {
    marginBottom: theme.spacing.md,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    ...theme.typography.headline,
    color: theme.colors.label,
    marginRight: theme.spacing.md,
    minWidth: 80,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.gray200,
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  feedbackList: {
    paddingHorizontal: theme.layout.containerPadding,
  },
  feedbackCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    flex: 1,
  },
  screenName: {
    ...theme.typography.headline,
    color: theme.colors.label,
    fontWeight: '600',
  },
  componentId: {
    ...theme.typography.caption1,
    color: theme.colors.secondaryLabel,
    marginTop: theme.spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    ...theme.typography.caption2,
    color: theme.colors.white,
    fontWeight: '600',
  },
  feedbackText: {
    ...theme.typography.body,
    color: theme.colors.label,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryText: {
    ...theme.typography.caption1,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  timestamp: {
    ...theme.typography.caption1,
    color: theme.colors.tertiaryLabel,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.huge,
  },
  emptyStateText: {
    ...theme.typography.body,
    color: theme.colors.secondaryLabel,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.systemGroupedBackground,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.layout.containerPadding,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.separator,
  },
  modalTitle: {
    ...theme.typography.title2,
    color: theme.colors.label,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.gray200,
    borderRadius: theme.borderRadius.full,
  },
  modalCloseText: {
    fontSize: 18,
    color: theme.colors.label,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.layout.containerPadding,
    paddingTop: theme.spacing.lg,
  },
  detailSection: {
    marginBottom: theme.spacing.lg,
  },
  detailLabel: {
    ...theme.typography.headline,
    color: theme.colors.label,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  detailValue: {
    ...theme.typography.body,
    color: theme.colors.secondaryLabel,
    lineHeight: 22,
  },
  statusUpdateContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  resolutionInput: {
    ...theme.typography.body,
    backgroundColor: theme.colors.secondarySystemBackground,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.separator,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  statusButtonText: {
    ...theme.typography.caption1,
    color: theme.colors.white,
    fontWeight: '600',
  },
});