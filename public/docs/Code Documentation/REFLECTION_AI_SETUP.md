# AI-Powered Reflection Tab Setup

## Overview
The reflection tab now features dynamic question generation with AI-like capabilities and skip functionality.

## Features Added

### 1. Dynamic Question Generation
- Questions are generated dynamically based on context
- Considers previously asked questions to avoid repetition
- Adapts based on skip reasons (e.g., if user finds questions too personal)
- Generates follow-up questions based on user responses

### 2. Skip Functionality
- Users can skip questions with a reason
- Skip reasons include:
  - "Too personal right now"
  - "Need more time to think"
  - "Not relevant to me"
  - "Want a different topic"
  - "Feeling uncomfortable"
- The AI adapts future questions based on skip reasons

### 3. Enhanced User Experience
- Loading states while generating questions
- Real-time authenticity scoring
- Session management (continue answering or complete at any time)
- Beautiful modal for skip reason selection

## Technical Implementation

### Files Created/Modified

1. **`src/services/claudeAI.service.js`**
   - Mock AI service that simulates Claude AI functionality
   - Generates contextual questions based on user interaction
   - Analyzes response authenticity with keyword matching
   - In production, can be connected to actual Anthropic API

2. **`src/components/ReflectionScreen.jsx`**
   - Complete rewrite of the reflection screen
   - Manages question generation and skip functionality
   - Handles loading states and user interactions
   - Beautiful UI with smooth animations

3. **`App.tsx`**
   - Updated to use the new AI-powered ReflectionScreen
   - Maintains compatibility with existing app structure

## How It Works

1. **Question Generation**
   - Pool of diverse reflection questions across categories
   - Filters out previously asked questions
   - Adapts based on skip reasons (lighter topics if uncomfortable)
   - Generates contextual follow-ups based on response keywords

2. **Authenticity Scoring**
   - Analyzes response for:
     - Personal pronouns (I, me, my)
     - Emotion words (happy, sad, grateful, etc.)
     - Specific details (numbers, when, because)
     - Vulnerability indicators
   - Score affects points earned

3. **Skip Logic**
   - Modal appears when skip is pressed
   - User selects reason
   - Next question adapts based on reason
   - Ensures better user experience

## Production Setup

To connect to real Claude AI API:

1. Get API key from https://console.anthropic.com/
2. Add to `.env`: `REACT_APP_ANTHROPIC_API_KEY=your_key`
3. Install SDK: `npm install @anthropic-ai/sdk`
4. Update `claudeAI.service.js` to use real API calls instead of mock

## Demo Mode

Currently runs in demo mode with:
- Pre-defined question pool
- Keyword-based follow-ups
- Pattern-based authenticity scoring
- No external API required

This provides a fully functional experience without API costs.