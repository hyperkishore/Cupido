#!/bin/bash

# Cupido Version Control Script
# This script helps manage version backups for App.tsx

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
VERSION_FILE="./version-history.log"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to create a backup
backup_app() {
    local comment="$1"
    local backup_file="$BACKUP_DIR/App.tsx.backup-$TIMESTAMP"
    
    # Copy current App.tsx to backup
    cp App.tsx "$backup_file"
    
    # Log the backup
    echo "[$TIMESTAMP] Backup created: $backup_file - Comment: $comment" >> "$VERSION_FILE"
    echo "✅ Backup created: $backup_file"
}

# Function to list all backups
list_backups() {
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/App.tsx.backup-* 2>/dev/null | awk '{print $9}' | sort -r
}

# Function to restore a specific backup
restore_backup() {
    local backup_file="$1"
    
    if [ -f "$backup_file" ]; then
        # Create a backup of current version before restoring
        backup_app "Pre-restore backup"
        
        # Restore the selected backup
        cp "$backup_file" App.tsx
        echo "✅ Restored from: $backup_file"
    else
        echo "❌ Backup file not found: $backup_file"
    fi
}

# Function to show version history
show_history() {
    if [ -f "$VERSION_FILE" ]; then
        echo "Version History:"
        cat "$VERSION_FILE"
    else
        echo "No version history found."
    fi
}

# Main script logic
case "$1" in
    "backup")
        backup_app "${2:-No comment provided}"
        ;;
    "list")
        list_backups
        ;;
    "restore")
        if [ -z "$2" ]; then
            echo "Usage: ./version-control.sh restore <backup-file>"
            list_backups
        else
            restore_backup "$2"
        fi
        ;;
    "history")
        show_history
        ;;
    *)
        echo "Cupido Version Control System"
        echo ""
        echo "Usage:"
        echo "  ./version-control.sh backup [comment]     - Create a backup with optional comment"
        echo "  ./version-control.sh list                 - List all available backups"
        echo "  ./version-control.sh restore <file>       - Restore a specific backup"
        echo "  ./version-control.sh history              - Show version history log"
        echo ""
        echo "Example:"
        echo "  ./version-control.sh backup 'Before adding new feature'"
        echo "  ./version-control.sh restore ./backups/App.tsx.backup-20250124-143022"
        ;;
esac