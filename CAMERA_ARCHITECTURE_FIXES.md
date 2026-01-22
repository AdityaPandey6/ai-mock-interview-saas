# Camera Stream Architecture Fixes

## Problems Fixed

### 1. ✅ Video Feed Not Displaying
**Root Cause**: `<video>` element was conditionally rendered, so the DOM element didn't exist when `getUserMedia` stream was attached.

**Fix**: Always render `<video>` element, use CSS opacity for visibility:
```tsx
<video
  ref={videoRef}
  className={`w-full h-full object-cover transition-opacity ${
    cameraReady && cameraEnabled ? 'opacity-100' : 'opacity-0'
  }`}
/>
{!(cameraReady && cameraEnabled) && <placeholder/>}
```

### 2. ✅ Camera Toggle Breaking Stream
**Root Cause**: Conditional rendering destroyed and recreated the video element on toggle.

**Fix**: Video element always mounted, only visibility changes via opacity.

### 3. ✅ LED Stays ON After Close/Finish
**Root Cause**: Incomplete cleanup in `stopCamera()`.

**Fix**: Updated `stopCamera()` to:
```tsx
const stopCamera = () => {
  if (videoRef.current) {
    // 1. Stop all tracks
    if (videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    // 2. Pause video playback
    videoRef.current.pause();
    // 3. Clear the source
    videoRef.current.srcObject = null;
  }
  setCameraReady(false);
};
```

### 4. ✅ Multiple Camera Streams Starting
**Root Cause**: `startCameraStream()` had no duplicate prevention.

**Fix**: Added guard at start of function:
```tsx
if (videoRef.current?.srcObject) {
  console.log('Camera stream already active, skipping');
  return;
}
```

### 5. ✅ Frame Capture Effect Breaking
**Root Cause**: Dependency `videoRef.current.srcObject` is unstable object reference, also breaks on toggle.

**Fix**: Changed to use stable `cameraReady` boolean:
```tsx
useEffect(() => {
  if (!cameraReady) return;  // Only start when truly ready
  
  frameIntervalRef.current = setInterval(() => {
    captureFrame();
  }, 5000);

  return () => clearInterval(frameIntervalRef.current);
}, [cameraReady]);  // Stable dependency
```

## Architecture

### Video Element Lifecycle
1. Always mounted in DOM
2. Stream attached via `startCameraStream()`
3. Visible via opacity when `cameraReady && cameraEnabled`
4. Completely stopped via `stopCamera()`

### State Machine
```
Initial: cameraEnabled=true, cameraReady=false, opacity-0
↓
Loading stream: cameraEnabled=true, cameraReady=false, opacity-0
↓
Ready: cameraEnabled=true, cameraReady=true, opacity-100 ✓
↓
User toggles OFF: cameraEnabled=false, cameraReady=false, opacity-0
↓
User toggles ON: cameraEnabled=true, cameraReady=false → true, opacity-0 → 100
↓
User closes: stopCamera() → cameraReady=false, opacity-0
```

### Frame Capture Flow
```
cameraReady: false → no interval
cameraReady: true → start 5-second interval
cameraReady: false → stop interval
```

## Key Functions

```typescript
// Guard against duplicates
startCameraStream() {
  if (videoRef.current?.srcObject) return;
  // ... get stream, attach, wait for metadata, play, setCameraReady(true)
}

// Complete cleanup
stopCamera() {
  // 1. Stop all tracks
  // 2. Pause playback
  // 3. Clear srcObject
  // 4. Reset ready state
}

// Only uses stable dependency
useEffect(() => {
  if (!cameraReady) return;
  // Start frame capture interval
}, [cameraReady]);  // Not videoRef.current.srcObject
```

## No Breaking Changes ✅
- QuestionPanel untouched
- Behavior metrics still working
- Submit flow unchanged
- Interview logic intact
- UI layout preserved
