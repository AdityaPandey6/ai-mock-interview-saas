# Quick Reference: Webcam Presence Analysis

## What It Does
✅ Captures one snapshot every 5 seconds during answers  
✅ Generates behavior metrics (frame count, attention score, stability)  
✅ Attaches metrics to submit payload  
✅ Displays live camera feed in VideoPreview  
✅ Stores frames in memory only (no uploads)  
✅ Handles permission denial gracefully  

## Key Functions

### Start Camera
```typescript
// Automatic when interview loads
useEffect(() => {
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };
  // runs when loading && questions.length > 0
}, [loading, questions.length]);
```

### Capture Frame (every 5 seconds)
```typescript
const captureFrame = () => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoRef.current, 0, 0);
  const imageData = canvas.toDataURL('image/jpeg', 0.6);
  capturedFramesRef.current.push(imageData);
};
```

### Generate Metrics
```typescript
const generateBehaviorMetrics = (): BehaviorMetrics => {
  const frameCount = capturedFramesRef.current.length;
  return {
    frame_count: frameCount,
    attention_score: Math.min(frameCount * 20, 100),
    stability: frameCount > 3 ? 'stable' : 'low',
  };
};
```

### Submit with Metrics
```typescript
const behaviorMetrics = generateBehaviorMetrics();

const { data, error } = await supabase.functions.invoke('evaluate-answer', {
  body: {
    session_id: sessionId,
    question_id: questions[currentQuestionIndex].id,
    user_answer: userAnswer,
    behavior_metrics: behaviorMetrics,  // ← Attached here
  },
});

clearCapturedFrames();  // Reset for next question
```

## Refs Used
```typescript
const videoRef = useRef<HTMLVideoElement | null>(null);      // Video stream
const canvasRef = useRef<HTMLCanvasElement | null>(null);    // Frame capture
const capturedFramesRef = useRef<string[]>([]);               // Frame storage
const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Cleanup
```

## JSX Changes
```tsx
{/* Hidden canvas for frame capture */}
<canvas ref={canvasRef} className="hidden" />

{/* VideoPreview now shows live feed */}
<VideoPreview
  userName={user?.email?.split('@')[0] || 'User'}
  isRecording={!submitting}
  videoRef={videoRef}  // ← Pass video ref
/>
```

## Behavior Metrics Structure
```typescript
interface BehaviorMetrics {
  frame_count: number;        // 0-12 frames (5 second intervals, ~60s limit)
  attention_score: number;    // 0-100 (frame_count * 20, capped)
  stability: 'stable' | 'low' // 'stable' if > 3 frames
}
```

## Example Payload
```json
{
  "session_id": "uuid",
  "question_id": "uuid",
  "user_answer": "The answer is...",
  "behavior_metrics": {
    "frame_count": 8,
    "attention_score": 100,
    "stability": "stable"
  }
}
```

## Error Handling
```typescript
// Camera permission denied → Logged, interview continues
try {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
} catch (err) {
  console.error('Camera permission denied or unavailable:', err);
  // Interview proceeds with empty frames
}
```

## Cleanup (Automatic)
- Camera stream stopped when component unmounts
- Frame capture interval cleared when component unmounts
- Frames cleared after each successful submit
- No memory leaks or dangling intervals

## No Changes to:
- ❌ QuestionPanel component
- ❌ Existing submit logic (only adding field)
- ❌ Voice recognition
- ❌ Timer system
- ❌ Navigation

## For Edge Function Update

Add this type to evaluate-answer function:
```typescript
interface BehaviorMetrics {
  frame_count: number;
  attention_score: number;
  stability: 'stable' | 'low';
}

interface EvaluateAnswerRequest {
  session_id: string;
  question_id: string;
  user_answer: string;
  behavior_metrics?: BehaviorMetrics;  // Add this
}
```

Then process the metrics as needed (store, analyze, etc.)
