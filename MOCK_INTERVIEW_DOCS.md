## Mock Interview Feature - Implementation Summary

### Overview
The Mock Interview feature provides users with a timed, interactive interview practice experience with progress tracking and session recording.

### Database Integration

#### Attempts Table
When users submit answers during the mock interview, each response is saved to the `attempts` table:
- `user_id` - User who took the attempt
- `question_id` - Question being answered
- `is_correct` - Currently set to `false` (can be implemented with scoring logic later)
- `time_taken` - Seconds spent on the question
- `answer_text` - User's complete answer text
- `created_at` - Timestamp of the attempt

#### Mock Sessions Table
When users complete a mock interview, a session record is created in `mock_sessions`:
- `user_id` - User who completed the session
- `total_questions` - Number of questions in the session (currently fixed at 5)
- `score` - Number of questions answered (not blank)
- `created_at` - Timestamp of session completion

### Features

#### Question Loading
- Fetches all questions from the `questions` table on component load
- Randomly shuffles questions and selects 5 for the mock interview
- Shows topic and difficulty tags for each question

#### Timer System
- 60-second countdown per question
- Displays elapsed time in a circular progress indicator
- Auto-advances to next question when timer reaches 0
- Changes to red and pulses when time ≤ 10 seconds
- Manual skip option available anytime

#### Voice Input
- Reuses Web Speech API from Practice.tsx
- Start/Stop listening buttons
- Real-time transcript appending to answer field
- Graceful fallback for unsupported browsers
- Shows recording indicator while listening

#### Answer Submission
- Users can submit answers via:
  1. **Submit Answer Button** - Records the answer and auto-advances
  2. **Skip Question Button** - Skips without recording
  3. **Auto-submit** - When 60-second timer expires
  
- Each submission saves attempt data to Supabase
- Button includes loading state during submission

#### Results Screen
After completing all 5 questions, users see:
- **Percentage Score** - Visual circular progress indicator
- **Statistics** - Total answered vs skipped questions
- **Answer Review** - Complete list of all questions with user's answers
- **Action Buttons**:
  - Return to Dashboard
  - Start New Mock Interview

#### Progress Tracking
- Question counter (e.g., "Question 1 of 5")
- Progress bar showing completion percentage
- Visual feedback throughout the session

### UI Components

#### MockInterview.tsx
Main component managing the interview flow with states for:
- Questions array
- Current question index
- User answers array
- Timer countdown
- Voice recording status
- Results display

#### MockInterview.css
Comprehensive styling including:
- Gradient backgrounds (purple/blue theme)
- Responsive timer circle animation
- Voice control button styling
- Answer textarea with focus states
- Results screen layout with score card
- Mobile-responsive design

#### Routes
- **Path**: `/mock-interview`
- **Protection**: Requires authentication (ProtectedRoute)
- **Access**: From Dashboard or direct URL

### Data Flow

1. **Session Start**
   ```
   Load Component → Fetch 5 Random Questions → Initialize Timer & Voice → Display Question 1
   ```

2. **Answer Submission**
   ```
   User Submits → Save to attempts table → Validate question index → 
   If more questions: Move to next → Reset timer, clear answer
   If last question: Show results screen
   ```

3. **Session Completion**
   ```
   Last question submitted → Calculate score → Save to mock_sessions → Show results
   ```

4. **Post-Results**
   ```
   User can: Return to Dashboard (navigate('/dashboard')) 
   OR Start New Interview (reset state & fetch new questions)
   ```

### Scoring
Currently, score is calculated as the count of non-empty answers:
```typescript
score = answers.filter((ans) => ans.trim().length > 0).length
```

Future enhancement: Implement proper answer validation based on correctness.

### Error Handling
- Handles missing questions gracefully
- Speech API unsupported browser fallback
- Database save failures show error messages
- Network issues are caught and logged

### Performance Optimizations
- Uses refs for timer and recognition instances to prevent memory leaks
- Cleanup functions on component unmount
- Efficient state updates
- Lazy renders for results screen

### Browser Compatibility
- Modern browsers with React 19 support
- Optional Web Speech API (graceful fallback)
- Supabase connection required
- Tested on Chrome, Firefox, Safari
