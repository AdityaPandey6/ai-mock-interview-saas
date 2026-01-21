# Speech Recognition Troubleshooting Guide

## Error: "No Speech" / "🎤 No speech detected"

This error means the speech recognition API is working, but it didn't detect any voice input.

### Quick Fixes:

#### 1. **Check Your Microphone**
- [ ] Is your microphone connected and powered on?
- [ ] Is the microphone jack/USB properly connected?
- [ ] Try testing microphone in another app (Discord, Meet, Teams)
- [ ] Go to System Settings → Sound → Microphone and adjust mic level

#### 2. **Grant Microphone Permission**
- [ ] When you first click "🎤 Start Speaking", browser should ask for permission
- [ ] Click **"Allow"** to grant microphone access
- [ ] If you accidentally clicked "Block", reset permissions:
  - **Chrome**: Click 🔒 → Site settings → Microphone → Allow
  - **Edge**: Click 🔒 → Permissions → Microphone → Allow
  - **Safari**: System Preferences → Security & Privacy → Microphone → Check your browser

#### 3. **Speak Clearly and Loudly**
- [ ] Speak clearly and at normal volume (not too soft)
- [ ] Leave a brief pause before clicking "Stop Speaking"
- [ ] Avoid background noise or loud environments
- [ ] Get closer to your microphone
- [ ] Speak complete sentences, not just single words

#### 4. **Browser Compatibility**
Your browser must support Web Speech API:

**✅ Supported Browsers:**
- Chrome/Chromium (all versions)
- Edge (all versions)
- Safari 14.1+
- Opera
- Samsung Internet

**❌ Not Supported:**
- Firefox (limited support)
- Internet Explorer
- Old Safari versions

**Solution**: Use Chrome, Edge, or Safari if possible.

#### 5. **HTTPS Requirement**
- Web Speech API only works on HTTPS or localhost
- If deployed, make sure your site uses HTTPS
- Local development (localhost:5173) is fine

#### 6. **Try These Steps:**

1. **Open Browser DevTools** (F12 or Cmd+Option+I)
2. **Go to Console tab**
3. **Click "Start Speaking"**
4. **Look for console messages:**
   - ✅ "Initializing Speech Recognition"
   - ✅ "Speech recognition started"
   - ❌ "Speech Recognition API not supported"
   - ❌ "Failed to create recognition instance"

5. **Check what error appears in console**
6. **Share the console message for more help**

## Common Errors Explained:

| Error | Cause | Solution |
|-------|-------|----------|
| `no-speech` | Microphone detected no voice | Speak louder, check mic, try again |
| `network` | Internet connection issue | Check your internet connection |
| `permission-denied` | Microphone access blocked | Allow microphone in browser settings |
| `audio-capture` | No microphone available | Connect microphone or check device |
| Not supported | Browser doesn't support API | Use Chrome, Edge, or Safari |

## Still Having Issues?

### For Developers:
1. Open Browser Console (F12)
2. Reproduce the error
3. Look for error messages with:
   - "Initializing Speech Recognition"
   - "Speech recognition error"
   - Check browser compatibility

### Check Your Setup:
```javascript
// In browser console, paste this:
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
console.log('Supported:', !!SpeechRecognition);
console.log('Browser:', navigator.userAgent);
```

### Reset Everything:
1. **Reload page**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear cache**: Browser Settings → Clear Browsing Data
3. **Refresh** and try again

## Alternative: Type Instead

If speech recognition isn't working, you can always **type your answer** directly in the textarea. The system works with both speech and typed input!

---

**Still stuck?** Check the browser console (F12) and share any error messages shown there.
