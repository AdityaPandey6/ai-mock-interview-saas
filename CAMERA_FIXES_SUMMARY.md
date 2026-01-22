# Camera Feed & Cleanup Fixes - Summary

## Issues Fixed

### 1. ✅ Camera Feed NOT Displaying
**Problem**: LED was ON but no video appeared on screen
**Solution**: 
- Added `cameraReady` state that waits for `onloadedmetadata` event
- Only renders `<video>` when BOTH `cameraReady && cameraEnabled` are true
- Calls `video.play()` after metadata loads
- Removed reliance on `videoRef.current.srcObject` for UI decision

```tsx
// Before: Checked srcObject directly (unreliable)
{videoRef?.current?.srcObject ? <video/> : <placeholder/>}

// After: Uses cameraReady state
{cameraReady && cameraEnabled ? <video/> : <placeholder/>}
```

### 2. ✅ Camera Stream NOT Stopping
**Problem**: LED stayed ON when leaving interview; stream continued running
**Solution**:
- Created `stopCamera()` function that:
  - Stops all MediaStream tracks
  - Sets `videoRef.current.srcObject = null`
  - Resets `setCameraReady(false)`
- Called in three places:
  1. Close button (`onClick` handler)
  2. Interview finish (`finishMockInterview`)
  3. Component unmount (automatic via useEffect)

```tsx
const stopCamera = () => {
  if (videoRef.current?.srcObject) {
    const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
    tracks.forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  }
  setCameraReady(false);
};

// Called when closing
onClick={() => {
  stopCamera();
  navigate('/dashboard');
}}
```

### 3. ✅ Added Camera ON/OFF Toggle
**New Feature**: Users can toggle camera on/off with a button
- Toggle button appears in top-left of VideoPreview (blue button)
- Shows "Camera Off" when ON (click to turn OFF)
- Shows "Camera On" when OFF (click to turn ON)
- When toggled OFF: calls `stopCamera()` immediately
- When toggled ON: triggers `cameraEnabled` state change → effect re-runs `startCameraStream()`

```tsx
const handleToggleCamera = () => {
  if (cameraEnabled) {
    stopCamera();
    setCameraEnabled(false);
  } else {
    setCameraEnabled(true);
  }
};
```

---

## Architecture Changes

### State Added
```typescript
const [cameraReady, setCameraReady] = useState(false);      // Video metadata loaded
const [cameraEnabled, setCameraEnabled] = useState(true);   // User toggle state
```

### Functions Added/Refactored
```typescript
stopCamera()              // Stops stream, nullifies ref, resets state
startCameraStream()       // Gets stream + waits for onloadedmetadata
handleToggleCamera()      // Toggle handler
```

### VideoPreview Props Updated
```tsx
interface VideoPreviewProps {
  userName: string;
  isRecording: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  cameraReady?: boolean;           // NEW
  cameraEnabled?: boolean;         // NEW
  onToggleCamera?: () => void;     // NEW
}
```

### Camera Initialization Flow
```
1. Questions loaded & cameraEnabled=true
2. startCameraStream() called
3. getUserMedia stream acquired
4. Stream assigned to videoRef.srcObject
5. Wait for onloadedmetadata event
6. Call video.play()
7. Set cameraReady(true) → Video renders
```

---

## Cleanup Points

| Trigger | Action |
|---------|--------|
| Component unmount | useEffect cleanup runs (frame interval stopped) |
| User clicks close | stopCamera() called, then navigate |
| Interview finishes | stopCamera() called before navigation |
| User toggles camera OFF | stopCamera() called immediately |

---

## No Breaking Changes ✅
- QuestionPanel untouched
- Submission logic unchanged
- Voice recognition unaffected
- Behavior metrics still attached to payload
- Interview flow preserved

---

## Testing Checklist

- [ ] Camera LED turns ON when interview starts
- [ ] Video feed displays in VideoPreview component
- [ ] Camera toggle button appears in top-left
- [ ] Clicking "Camera Off" stops stream and LED turns OFF
- [ ] Clicking "Camera On" restarts stream and LED turns ON
- [ ] Closing interview stops camera (LED turns OFF)
- [ ] Finishing interview stops camera (LED turns OFF)
- [ ] Frame capture continues working (frames still collected)
- [ ] Permission denial handled gracefully (interview continues)
- [ ] No console errors
