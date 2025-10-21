#!/usr/bin/env node

/**
 * CUPIDO AUTO-INITIALIZATION SYSTEM v1.0
 * =======================================
 * Automatically detects Cupido directory and loads context
 * Provides seamless Claude Code integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CupidoAutoInit {
  constructor() {
    this.cupidoIdentifiers = [
      'CLAUDE.md',
      'init.sh',
      'prompt-analytics-engine.js',
      'cupido-analytics-dashboard.html',
      'server.js'
    ];
  }

  isCupidoDirectory(dirPath) {
    try {
      // Check if directory contains Cupido identifier files
      const requiredFiles = ['CLAUDE.md', 'init.sh'];
      const optionalFiles = this.cupidoIdentifiers.slice(2);
      
      const hasRequired = requiredFiles.every(file => 
        fs.existsSync(path.join(dirPath, file))
      );
      
      const hasOptional = optionalFiles.some(file =>
        fs.existsSync(path.join(dirPath, file))
      );
      
      // Also check if directory name contains 'cupido' (case insensitive)
      const dirName = path.basename(dirPath).toLowerCase();
      const nameMatch = dirName.includes('cupido');
      
      return hasRequired && (hasOptional || nameMatch);
    } catch (error) {
      return false;
    }
  }

  findCupidoDirectory(startPath = process.cwd()) {
    let currentPath = path.resolve(startPath);
    const root = path.parse(currentPath).root;
    
    while (currentPath !== root) {
      if (this.isCupidoDirectory(currentPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }
    
    return null;
  }

  autoInitialize() {
    console.log('🔍 Scanning for Cupido project directory...');
    
    const cupidoPath = this.findCupidoDirectory();
    
    if (cupidoPath) {
      console.log(`🎯 Found Cupido project at: ${cupidoPath}`);
      
      // Change to Cupido directory
      process.chdir(cupidoPath);
      
      // Run initialization
      console.log('🚀 Auto-initializing Cupido context...');
      
      try {
        // Start session logging
        execSync('node session-logger.js start', { stdio: 'inherit' });
        
        // Load context
        execSync('node init-context.js', { stdio: 'inherit' });
        
        console.log('\n✅ AUTO-INITIALIZATION COMPLETE!');
        console.log('🎉 Cupido context loaded automatically!');
        
        return true;
      } catch (error) {
        console.error('❌ Auto-initialization failed:', error.message);
        return false;
      }
    } else {
      console.log('❌ No Cupido project found in current directory tree');
      console.log('💡 Make sure you\'re in or near a Cupido project directory');
      return false;
    }
  }

  createWatchScript() {
    const watchScript = `#!/bin/bash

# CUPIDO DIRECTORY WATCHER
# Automatically runs when entering Cupido directory

CUPIDO_MARKER=".cupido-auto-init"

# Check if we're in a Cupido directory
if [[ -f "CLAUDE.md" && -f "init.sh" ]]; then
    # Check if we've already auto-initialized this session
    if [[ ! -f "$CUPIDO_MARKER" ]]; then
        echo "🎯 Cupido directory detected!"
        echo "🚀 Auto-initializing..."
        
        # Create marker to prevent repeated initialization
        touch "$CUPIDO_MARKER"
        
        # Run auto-initialization
        node auto-init.js
        
        echo "✅ Ready for co-founder level development!"
    fi
fi
`;

    fs.writeFileSync(path.join(__dirname, 'watch-cupido.sh'), watchScript);
    execSync(`chmod +x ${path.join(__dirname, 'watch-cupido.sh')}`);
    
    console.log('📁 Created watch-cupido.sh for directory monitoring');
  }

  setupBashProfile() {
    const homeDir = require('os').homedir();
    const bashProfile = path.join(homeDir, '.bash_profile');
    const zshrc = path.join(homeDir, '.zshrc');
    
    const cupidoWatchFunction = `
# CUPIDO AUTO-INITIALIZATION
cupido_check() {
    if [[ -f "CLAUDE.md" && -f "init.sh" && ! -f ".cupido-auto-init" ]]; then
        echo "🎯 Cupido project detected!"
        node auto-init.js 2>/dev/null || echo "💡 Run ./init.sh to load Cupido context"
        touch .cupido-auto-init
    fi
}

# Auto-check when changing directories
cd() {
    builtin cd "$@" && cupido_check
}
`;

    try {
      // Add to .bash_profile if it exists
      if (fs.existsSync(bashProfile)) {
        const content = fs.readFileSync(bashProfile, 'utf8');
        if (!content.includes('cupido_check')) {
          fs.appendFileSync(bashProfile, cupidoWatchFunction);
          console.log('✅ Added Cupido auto-detection to .bash_profile');
        }
      }
      
      // Add to .zshrc if it exists (for macOS default)
      if (fs.existsSync(zshrc)) {
        const content = fs.readFileSync(zshrc, 'utf8');
        if (!content.includes('cupido_check')) {
          fs.appendFileSync(zshrc, cupidoWatchFunction);
          console.log('✅ Added Cupido auto-detection to .zshrc');
        }
      }
    } catch (error) {
      console.error('⚠️  Could not setup bash profile integration:', error.message);
    }
  }

  run() {
    const command = process.argv[2];
    
    switch (command) {
      case 'auto':
        this.autoInitialize();
        break;
      case 'setup':
        this.createWatchScript();
        this.setupBashProfile();
        console.log('\n🎉 SETUP COMPLETE!');
        console.log('💡 Now Cupido will auto-initialize when you cd into the directory');
        break;
      case 'check':
        const cupidoPath = this.findCupidoDirectory();
        if (cupidoPath) {
          console.log(`✅ Cupido project found at: ${cupidoPath}`);
        } else {
          console.log('❌ No Cupido project found');
        }
        break;
      default:
        console.log('CUPIDO AUTO-INITIALIZATION SYSTEM');
        console.log('Usage:');
        console.log('  node auto-init.js auto   - Auto-initialize if in Cupido directory');
        console.log('  node auto-init.js setup  - Setup automatic directory detection');
        console.log('  node auto-init.js check  - Check if current directory is Cupido');
    }
  }
}

// Execute if run directly
if (require.main === module) {
  const autoInit = new CupidoAutoInit();
  autoInit.run();
}

module.exports = CupidoAutoInit;