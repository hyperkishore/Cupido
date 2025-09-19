# Cupido Feedback System

A comprehensive feedback collection and management system for the Cupido app that allows users to select UI elements and provide contextual feedback.

## Database Name
**`cupido_feedback.db`** - This is the SQLite database where all feedback is stored.

## Features

### 1. **Keyboard Shortcut Activation**
- **Ctrl+Q**: Toggle feedback mode on/off
- Works across all screens in the app
- Visual indicator shows when feedback mode is active

### 2. **Element Selection**
- Click and drag to select any area on the screen
- Visual selection overlay with dashed border
- Captures exact element bounds (x, y, width, height)
- Records component ID, type, and screen name

### 3. **Feedback Form**
- **Categories**: UI, UX, Bug, Feature, Content, Performance, Accessibility, General
- **Priorities**: Low, Medium, High, Critical
- Rich text feedback input
- Automatic device info capture
- Timestamp recording

### 4. **Feedback Management**
- View all feedback entries
- Filter by status, priority, category
- Search functionality
- Update feedback status with resolution notes
- Export feedback data as JSON

## Usage Instructions

### For Providing Feedback:
1. **Activate feedback mode**: Press `Ctrl+Q` or click the 🛠 icon in the header
2. **Select element**: Click "Select Element" and drag to select the area you want to provide feedback on
3. **Fill feedback form**: Choose category, priority, and write your feedback
4. **Submit**: Click "Submit Feedback" to save to database

### For Managing Feedback:
1. **Access management**: Long press the 🛠 icon in the header
2. **View feedback**: Browse all feedback entries with filtering options
3. **Update status**: Click on any feedback item to view details and update status
4. **Export data**: Use the "Export Data" button to download feedback as JSON

## Database Schema

### Main Tables:
- **`feedback`**: Main feedback entries with all details
- **`feedback_comments`**: Comments/notes on feedback items
- **`feedback_attachments`**: File attachments (for future use)

### Key Fields:
- `screen_name`: Which screen the feedback was given on
- `component_id`: Unique identifier for the selected element
- `element_bounds`: JSON with exact position and size
- `feedback_text`: The actual feedback content
- `priority`: low/medium/high/critical
- `category`: ui/ux/bug/feature/content/performance/accessibility/general
- `status`: pending/in_progress/completed/rejected/archived
- `timestamp`: When feedback was submitted
- `device_info`: Device and platform information

## Technical Implementation

### Components:
- **`FeedbackOverlay`**: Main overlay component for element selection
- **`FeedbackProvider`**: Context provider for feedback state management
- **`withFeedback`**: HOC that wraps screens with feedback capability
- **`FeedbackManagementScreen`**: Admin screen for managing feedback

### Services:
- **`feedbackDatabase.ts`**: SQLite database operations
- **`FeedbackContext.tsx`**: React context for feedback state

### Integration:
- All main screens are wrapped with `withFeedback` HOC
- Feedback mode is globally managed through React Context
- Database operations are handled through a service layer

## Data Export

Feedback data can be exported as JSON with the following structure:
```json
{
  "exported_at": "2024-01-XX-XXXXX",
  "version": "1.0",
  "data": [
    {
      "id": 1,
      "timestamp": "2024-01-XX-XXXXX",
      "screen_name": "HomeScreen",
      "component_id": "questionCard_1",
      "element_bounds": "{\"x\": 20, \"y\": 100, \"width\": 350, \"height\": 200}",
      "feedback_text": "The spacing could be improved",
      "priority": "medium",
      "category": "ui",
      "status": "pending"
    }
  ]
}
```

## Future Enhancements

1. **Screenshots**: Automatic screenshot capture when feedback is submitted
2. **Real-time sync**: Sync feedback to cloud database
3. **Team collaboration**: Multiple users can comment on feedback
4. **Analytics**: Dashboard with feedback statistics and trends
5. **Native keyboard shortcuts**: Better keyboard shortcut support for mobile platforms

## Notes

- The feedback system is designed to be non-intrusive to normal app usage
- All feedback is stored locally in SQLite database
- The system captures detailed context about where feedback was given
- Feedback mode provides visual indicators to avoid confusion
- The database name is `cupido_feedback.db` for easy reference