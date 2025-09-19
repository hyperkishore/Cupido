-- Cupido Feedback Database Schema
-- Database Name: cupido_feedback.db

CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    screen_name TEXT NOT NULL,
    component_id TEXT NOT NULL,
    component_type TEXT NOT NULL,
    element_bounds TEXT NOT NULL, -- JSON string with {x, y, width, height}
    feedback_text TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
    category TEXT DEFAULT 'general' CHECK(category IN ('ui', 'ux', 'bug', 'feature', 'content', 'performance', 'accessibility', 'general')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'rejected', 'archived')),
    user_agent TEXT,
    device_info TEXT, -- JSON string with device details
    screenshot_path TEXT,
    assigned_to TEXT,
    resolution_notes TEXT,
    resolved_at DATETIME,
    created_by TEXT DEFAULT 'user',
    tags TEXT, -- Comma-separated tags
    votes INTEGER DEFAULT 0,
    implementation_effort TEXT CHECK(implementation_effort IN ('low', 'medium', 'high')) -- Estimated effort
);

CREATE TABLE IF NOT EXISTS feedback_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    author TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_screen ON feedback(screen_name);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);

-- Initial data for testing
INSERT OR IGNORE INTO feedback (screen_name, component_id, component_type, element_bounds, feedback_text, priority, category, status) 
VALUES 
('HomeScreen', 'questionCard_1', 'View', '{"x": 20, "y": 100, "width": 350, "height": 200}', 'The question cards could use more padding between elements', 'medium', 'ui', 'pending'),
('ReflectScreen', 'textInput_main', 'TextInput', '{"x": 20, "y": 300, "width": 350, "height": 150}', 'Text input should have better placeholder text', 'low', 'ux', 'pending');