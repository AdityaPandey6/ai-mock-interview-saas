# Web Speech API Integration Guide

## Speech Recognition Features Added

### 1. Run the SQL Migration

First, add the `answer_text` column to the `attempts` table:

1. Go to Supabase SQL Editor
2. Copy and run the SQL from [SUPABASE_ADD_ANSWER_TEXT.sql](./SUPABASE_ADD_ANSWER_TEXT.sql)

```sql
ALTER TABLE attempts 
ADD COLUMN answer_text TEXT;
```

### 2. New Features in Practice Page

#### Speech Recognition Controls
- **🎤 Start Speaking** - Begins recording your voice
- **⏹️ Stop Speaking** - Stops recording

#### How It Works
1. Click **"Start Speaking"** button
2. Speak your answer clearly
3. Your speech is converted to text automatically
4. Text appears in the textarea as you speak
5. Click **"Stop Speaking"** when done
6. Click **"Submit Answer"** to save

#### Browser Support
✅ Chrome (recommended)
✅ Edge
✅ Safari
✅ Firefox (limited)
❌ Internet Explorer

### 3. Data Saved in Database

When you submit an answer, the system now saves:
- `answer_text` - Your full answer (typed or spoken)
- `is_correct` - Whether the answer was correct
- `user_id` - Your user ID
- `question_id` - The question ID
- `time_taken` - Time spent on the question

### 4. Features Implemented

✅ Speech Recognition with Web Speech API
✅ Real-time speech-to-text conversion
✅ Auto-fill textarea as you speak
✅ Visual indicator ("🎤 Listening...") when recording
✅ Start/Stop buttons for recording control
✅ Browser compatibility check
✅ Answer text saved to database
✅ Graceful degradation if speech not supported

### 5. Example Usage

```typescript
// Speech recognition automatically handles:
// 1. Converting speech to text
// 2. Updating the textarea in real-time
// 3. Saving the answer_text to database on submit

// The answer is saved as:
{
  user_id: "user-uuid",
  question_id: "question-uuid",
  is_correct: true/false,
  time_taken: 45,
  answer_text: "Your full spoken or typed answer here"
}
```

### 6. Troubleshooting

**"Speech recognition is not supported"**
- Use a supported browser (Chrome, Edge, Safari)
- Check browser microphone permissions
- Ensure HTTPS connection (required by Web Speech API)

**Speech not recognized**
- Speak clearly and at a normal pace
- Check microphone is working
- Allow microphone access in browser permissions
- Try in a quieter environment

**Answer not saving**
- Check internet connection
- Verify Supabase credentials
- Check browser console for errors

### 7. Future Enhancements

Potential features to add:
- Time tracking per question
- Speech confidence scoring
- Language selection
- Multiple attempts per question
- Playback of recorded answers
- Export transcripts
