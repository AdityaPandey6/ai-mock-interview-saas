# Interview Confidence Score Implementation

## Overview
This document describes the implementation of a production-grade interview confidence score feature that combines speaking engagement metrics with MediaPipe face detection data to provide a comprehensive assessment of interview performance.

## Implementation Details

### Part A: Speaking Time Tracking

**Location:** `src/pages/MockInterview.tsx`

**Changes:**
1. Added three new refs to track speaking time:
   - `speakingTimeRef`: Accumulates total speaking time in milliseconds
   - `speakingStartRef`: Tracks when current speaking session started
   - `sessionStartTimeRef`: Records overall interview start timestamp

2. Updated `recognition.onstart` callback:
   - Records timestamp when user starts speaking
   - Logs "Speaking started" for debugging

3. Updated `recognition.onend` callback:
   - Calculates duration of speaking session
   - Accumulates duration to total speaking time
   - Resets speaking start reference
   - Logs accumulated time for debugging

### Part B: Speaking Score Calculation

**Location:** `src/pages/MockInterview.tsx` in `finishMockInterview()` function

**Formula:**
```typescript
speakingRatio = speakingTime / durationMs
speaking_score = min(speakingRatio * 120, 100)
```

**Rationale:**
- Confident speakers typically speak 70-80% of interview time
- Multiplying by 120 means 80% speaking ratio = 96 points (excellent)
- Capped at 100 to prevent scores over maximum
- Default value of 50 if no speaking time recorded

**Safety Guards:**
- Checks if durationMs > 0 and speakingTime > 0
- Accumulates any remaining speaking time if recognition is still active
- Clamps final score between 0 and 100

### Part C: Confidence Score Calculation

**Location:** `src/pages/MockInterview.tsx` in `finishMockInterview()` function

**Formula:**
```typescript
confidence_score = 
  (face_presence * 0.3) +
  (attention_score * 0.3) +
  (stability_score * 0.2) +
  (speaking_score * 0.2)
```

**Weight Distribution:**
- Face Presence: 30% - Time user remained visible on camera
- Attention Score: 30% - Eye alignment and face centering
- Stability Score: 20% - Head movement consistency
- Speaking Score: 20% - Speaking engagement ratio

**Safety Guards:**
- Default confidence score of 50 if no behavior summary
- Alternative calculation if no behavior data: `speaking_score * 0.5 + 50 * 0.5`
- Clamps final score between 0 and 100
- Rounds to integer for clean display
- Comprehensive console logging for debugging

### Part D: Database Storage

**SQL Migration:** `SUPABASE_ADD_CONFIDENCE_SCORE.sql`

**Changes:**
1. Adds `confidence_score` INTEGER column to `mock_sessions` table
2. Adds CHECK constraint to ensure values are between 0 and 100
3. Uses safe IF NOT EXISTS checks to prevent duplicate column errors

**Update Logic:**
- `confidence_score` is calculated and saved in `finishMockInterview()`
- Stored alongside `status`, `ended_at`, and `behavior_summary`
- Session `started_at` timestamp is now set during session creation

### Part E: Result Page Display

**Location:** `src/pages/MockResult.tsx`

**Type Changes:**
- Added `confidence_score?: number` to `MockSession` interface
- Updated Supabase query to fetch `confidence_score` field

**UI Components:**
1. New helper function `getConfidenceScoreColor()`:
   - Returns background, text color, and label based on score
   - >80%: Green (Excellent Presence)
   - 60-80%: Blue (Good Presence)
   - <60%: Amber (Needs Improvement)

2. New "Interview Confidence" card:
   - Displays large confidence score percentage
   - Shows color-coded badge with performance label
   - Includes emoji indicator (🌟/👍/📈)
   - Explains metrics used in calculation
   - Only visible when `confidence_score` exists

**Placement:**
- Positioned between Summary card and Behavior Summary card
- Maintains consistent design with existing cards
- Responsive layout with gradient backgrounds

### Part F: Safety Guards

**Implemented Protections:**

1. **Missing Speaking Time:**
   - Default `speaking_score = 50` if no time recorded
   - Prevents division by zero with duration check
   - Accumulates any remaining speaking time before calculation

2. **Missing Behavior Summary:**
   - Default `confidence_score = 50` if no behavior data
   - Alternative formula using only speaking score
   - Clear console logging of which path was taken

3. **NaN Prevention:**
   - All values clamped between 0 and 100 using `Math.max(0, Math.min(100, value))`
   - Checks for valid duration before ratio calculation
   - Explicit null checks for all refs

4. **Edge Cases:**
   - Handles active speech recognition at interview end
   - Gracefully handles missing session start time
   - Type-safe with TypeScript optional chaining

## Testing Recommendations

To test this implementation:

1. **Normal Flow:**
   - Start mock interview
   - Answer questions using voice input
   - Complete all questions
   - Verify confidence score appears on result page

2. **Edge Cases:**
   - Complete interview without speaking (test default score)
   - Complete interview with camera off (test fallback calculation)
   - Start speaking but don't finish (test accumulation logic)

3. **Database:**
   - Run SQL migration on Supabase
   - Verify `confidence_score` column exists
   - Check that values are properly constrained to 0-100 range

## Console Logging

For debugging, the implementation includes comprehensive logging:

- "Speaking started" - When voice input begins
- "Speaking stopped, accumulated time: {time}" - When voice input ends
- "Speaking metrics: {speakingTime, durationMs, speaking_score}" - Final calculations
- "Confidence score calculated: {score}" - Final confidence score
- "Confidence score calculated (no behavior data): {score}" - Fallback calculation

## Important Notes

1. **No Changes to MediaPipe Logic:** All existing face detection code remains unchanged
2. **No UI Layout Modifications:** New card follows existing design patterns
3. **No Camera Cleanup Changes:** All cleanup logic preserved
4. **Behavior Summary Preserved:** Existing behavior summary card unchanged
5. **TypeScript Strict Mode:** All changes maintain strict typing

## Files Modified

1. `src/pages/MockInterview.tsx` - Speaking time tracking and confidence calculation
2. `src/pages/MockResult.tsx` - Display confidence score on results page
3. `SUPABASE_ADD_CONFIDENCE_SCORE.sql` - Database migration (new file)

## Migration Steps

1. Apply SQL migration to Supabase database
2. Deploy updated code
3. Test with new mock interview sessions
4. Monitor console logs for any issues
