# Interview Confidence Score - Testing Guide

## Prerequisites

Before testing, ensure:
1. Apply the SQL migration to Supabase:
   ```sql
   -- Run SUPABASE_ADD_CONFIDENCE_SCORE.sql in Supabase SQL editor
   ```
2. Deploy the updated code to your environment
3. Clear browser cache and reload the application

## Test Scenarios

### Scenario 1: Normal Flow - Full Feature Test
**Objective:** Verify complete confidence score calculation with all metrics

**Steps:**
1. Navigate to Mock Interview page
2. Ensure camera is enabled and MediaPipe is detecting face
3. Answer questions using voice input (speak for ~70-80% of question time)
4. Complete all 5 questions
5. Observe the result page

**Expected Results:**
- Console shows "Speaking started" when voice input begins
- Console shows "Speaking stopped, accumulated time: X" when voice input ends
- After completion, console shows:
  - "Speaking metrics: {speakingTime, durationMs, speaking_score}"
  - "Confidence score calculated: X"
- Result page displays:
  - Confidence score card between Summary and Behavior Summary
  - Score value as percentage
  - Appropriate color coding (Green/Blue/Amber)
  - Matching label (Excellent/Good/Needs Improvement)
  - Emoji indicator (🌟/👍/📈)

**Success Criteria:**
- Confidence score between 70-95%
- Green or Blue color coding
- All console logs present
- Database record contains confidence_score value

---

### Scenario 2: Limited Speaking - Low Speaking Score
**Objective:** Test default speaking score when user speaks minimally

**Steps:**
1. Start Mock Interview
2. Type answers instead of using voice input
3. Complete interview
4. Check result page

**Expected Results:**
- Console shows speaking_score near 50 (default)
- Confidence score calculated primarily from behavior metrics
- Appropriate color coding based on final score

---

### Scenario 3: Camera Disabled - No Behavior Metrics
**Objective:** Test fallback calculation without MediaPipe data

**Steps:**
1. Start Mock Interview
2. Disable camera or ensure poor lighting (no face detection)
3. Answer questions using voice input
4. Complete interview

**Expected Results:**
- Console shows "⚠️ No behavior summary to save (insufficient frame data)"
- Console shows "Confidence score calculated (no behavior data): X"
- Fallback formula used: `speaking_score * 0.5 + 50 * 0.5`
- Result page may not show Behavior Summary card
- Confidence score card still displays with appropriate score

---

### Scenario 4: Excellent Performance
**Objective:** Achieve highest confidence score

**Setup:**
- Good lighting
- Face centered on camera
- Minimal head movement
- Speak frequently (70-80% of time)

**Expected Results:**
- All behavior metrics > 80%
- Speaking score > 80%
- Confidence score > 85%
- Green color coding
- "Excellent Presence" label
- 🌟 emoji

---

### Scenario 5: Edge Case - Interview Interrupted
**Objective:** Test graceful handling of incomplete sessions

**Steps:**
1. Start Mock Interview
2. Begin speaking (recognition active)
3. Complete interview while still speaking

**Expected Results:**
- Console shows accumulation of remaining speaking time
- No errors in console
- Confidence score calculated correctly
- speaking_score doesn't exceed 100

---

### Scenario 6: Database Verification
**Objective:** Verify data persistence

**Steps:**
1. Complete a mock interview
2. Query Supabase directly:
   ```sql
   SELECT 
     id, 
     confidence_score, 
     behavior_summary,
     started_at,
     ended_at
   FROM mock_sessions
   ORDER BY created_at DESC
   LIMIT 5;
   ```

**Expected Results:**
- `confidence_score` column exists
- Value is between 0 and 100
- Value is an integer
- `started_at` is populated
- `ended_at` is populated when status = 'completed'

---

## Validation Checklist

### Visual Validation
- [ ] Confidence score card renders correctly
- [ ] Color coding matches score range
- [ ] Badge text is readable
- [ ] Emoji displays properly
- [ ] Card is positioned between Summary and Behavior Summary
- [ ] Responsive design works on mobile

### Functional Validation
- [ ] Speaking time accumulates correctly
- [ ] Formula produces values between 0-100
- [ ] Rounding works correctly
- [ ] Default values applied when data missing
- [ ] No NaN values appear
- [ ] No console errors

### Data Validation
- [ ] confidence_score saved to database
- [ ] started_at timestamp recorded
- [ ] ended_at timestamp recorded
- [ ] Values respect CHECK constraint (0-100)

### Console Logging
- [ ] "Speaking started" appears on voice input
- [ ] "Speaking stopped, accumulated time: X" shows accumulated time
- [ ] "Speaking metrics: {...}" shows calculation details
- [ ] "Confidence score calculated: X" shows final score

---

## Test Data Examples

### Example 1: High Performer
```javascript
{
  face_presence: 95,
  attention_score: 90,
  stability_score: 85,
  speaking_score: 96,
  confidence_score: 92
}
```

### Example 2: Average Performer
```javascript
{
  face_presence: 75,
  attention_score: 70,
  stability_score: 65,
  speaking_score: 60,
  confidence_score: 69
}
```

### Example 3: Needs Improvement
```javascript
{
  face_presence: 55,
  attention_score: 50,
  stability_score: 45,
  speaking_score: 40,
  confidence_score: 49
}
```

---

## Troubleshooting

### Issue: Confidence score is NaN
**Solution:** Check console for errors, ensure all values are clamped

### Issue: Speaking time always 0
**Solution:** Verify speech recognition is working, check browser permissions

### Issue: Confidence score not saving
**Solution:** Verify SQL migration was applied, check Supabase logs

### Issue: Card not displaying
**Solution:** Ensure confidence_score is not null/undefined in session data

### Issue: Wrong color coding
**Solution:** Verify score thresholds: >80 green, 60-80 blue, <60 amber

---

## Browser Compatibility

Test on:
- [x] Chrome/Edge (Recommended - best Web Speech API support)
- [x] Firefox (Limited speech recognition support)
- [x] Safari (May require user gesture for speech)

---

## Performance Notes

- Speaking time tracking adds minimal overhead (~2 lines per recognition event)
- Confidence calculation runs once at interview completion
- No impact on MediaPipe performance
- Database write adds ~50ms to completion time

---

## Security Validation

- [x] No sensitive data logged to console (only metrics)
- [x] Database constraint prevents invalid scores
- [x] No SQL injection risks (using parameterized queries)
- [x] No XSS risks (React auto-escapes content)
