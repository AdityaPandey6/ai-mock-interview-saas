import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface Question {
  id: string;
  question_text: string;
  topic: string;
  difficulty: string;
  answer: string;
  created_at: string;
}

// Type for Web Speech API
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
}

// Behavior metrics type
interface BehaviorMetrics {
  frame_count: number;
  attention_score: number;
  stability: 'stable' | 'low';
}

/* ==================== VIDEO PREVIEW COMPONENT ==================== */
interface VideoPreviewProps {
  userName: string;
  isRecording: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  cameraReady?: boolean;
  cameraEnabled?: boolean;
  onToggleCamera?: () => void;
}

function VideoPreview({ userName, isRecording, videoRef, cameraReady, cameraEnabled, onToggleCamera }: VideoPreviewProps) {
  return (
    <div className="relative h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Live Camera Feed - Always Rendered */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          cameraReady && cameraEnabled ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Placeholder UI - Visible when camera is OFF */}
      {!(cameraReady && cameraEnabled) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold shadow-lg shadow-blue-500/30">
              {userName.charAt(0).toUpperCase()}
            </div>
            <p className="text-gray-400 text-sm">Camera preview would appear here</p>
            <p className="text-gray-500 text-xs mt-1">Your responses are being recorded</p>
          </div>
        </div>
      )}

      {/* User Name Label */}
      <div className="absolute bottom-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg border border-white/10">
        <p className="text-white text-sm font-medium">{userName}</p>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 px-3 py-2 bg-red-500/90 backdrop-blur-sm rounded-lg flex items-center gap-2 shadow-lg shadow-red-500/30">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-white text-xs font-semibold">RECORDING</span>
        </div>
      )}

      {/* Camera Toggle Button */}
      {onToggleCamera && (
        <button
          onClick={onToggleCamera}
          className="absolute top-4 left-4 px-3 py-2 bg-blue-500/90 backdrop-blur-sm rounded-lg flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:bg-blue-600/90 transition-colors"
        >
          {cameraEnabled ? (
            <>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14 0H4v8h12V6z" />
              </svg>
              <span className="text-white text-xs font-semibold">Camera Off</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A2 2 0 0015 13.414V9a2 2 0 00-2-2h-.5l-1 1H13V9H7v4h1.5l1 1H5a2 2 0 01-2-2V9a2 2 0 012-2h.5l1-1H5a2 2 0 00-2 2v4a2 2 0 002 2h10a2 2 0 001.293-.293l-1.473-1.473z" clipRule="evenodd" />
              </svg>
              <span className="text-white text-xs font-semibold">Camera On</span>
            </>
          )}
        </button>
      )}

      {/* Audio Visualizer Bars (decorative) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-end gap-1 opacity-40">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              height: `${Math.random() * 20 + 10}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ==================== QUESTION PANEL COMPONENT ==================== */
interface QuestionPanelProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  userAnswer: string;
  listening: boolean;
  speechSupported: boolean;
  submitting: boolean;
  error: string | null;
  onAnswerChange: (value: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onSkip: () => void;
}

function QuestionPanel({
  question,
  currentIndex,
  totalQuestions,
  timeRemaining,
  userAnswer,
  listening,
  speechSupported,
  submitting,
  error,
  onAnswerChange,
  onStartListening,
  onStopListening,
  onSubmit,
  onSkip,
}: QuestionPanelProps) {
  // Timer color states based on time remaining
  const getTimerState = () => {
    if (timeRemaining > 20) {
      return {
        gradientId: 'gradientBlue',
        textColor: 'text-blue-600',
        animate: false,
      };
    } else if (timeRemaining > 10) {
      return {
        gradientId: 'gradientAmber',
        textColor: 'text-amber-600',
        animate: false,
      };
    } else {
      return {
        gradientId: 'gradientRed',
        textColor: 'text-red-600',
        animate: true,
      };
    }
  };

  const timerState = getTimerState();

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center justify-between mb-4">
          {/* Question Counter */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              {currentIndex + 1}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Question</p>
              <p className="text-sm font-bold text-gray-900">
                {currentIndex + 1} of {totalQuestions}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div className={`relative w-20 h-20 transition-transform duration-300 ${timerState.animate ? 'animate-pulse' : ''}`}>
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke={`url(#${timerState.gradientId})`}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(timeRemaining / 60) * 213.6} 213.6`}
                className="transition-all duration-300 ease-in-out"
              />
              <defs>
                {/* Blue gradient for >20s */}
                <linearGradient id="gradientBlue" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                {/* Amber gradient for 10-20s */}
                <linearGradient id="gradientAmber" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
                {/* Red gradient for <10s */}
                <linearGradient id="gradientRed" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold transition-colors duration-300 ${timerState.textColor}`}>
                {timeRemaining}s
              </span>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
              {question.topic}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              question.difficulty === 'easy'
                ? 'bg-green-100 text-green-700'
                : question.difficulty === 'medium'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {question.difficulty}
            </span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 leading-relaxed">
            {question.question_text}
          </h2>
        </div>
      </div>

      {/* Answer Section */}
      <div className="flex-1 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
        <label className="text-sm font-semibold text-gray-700 mb-3">Your Answer</label>
        
        {/* Textarea */}
        <textarea
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Type your answer here or speak using the microphone..."
          className="flex-1 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-gray-900 placeholder-gray-400"
          disabled={submitting}
        />

        {/* Voice Controls */}
        {speechSupported && (
          <div className="mt-4 flex items-center gap-3">
            {!listening ? (
              <button
                type="button"
                onClick={onStartListening}
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
                Start Speaking
              </button>
            ) : (
              <button
                type="button"
                onClick={onStopListening}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 animate-pulse"
              >
                <span className="w-2 h-2 bg-white rounded-full" />
                Stop Recording
              </button>
            )}
            {listening && (
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
                Listening...
              </span>
            )}
          </div>
        )}

        {!speechSupported && (
          <p className="mt-3 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
            Voice input is not supported in your browser. Please type your answer.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <form onSubmit={onSubmit} className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Answer'
          )}
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={submitting}
          className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Skip
        </button>
      </form>

      {/* Inline Error Display */}
      {error && (
        <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}

/* ==================== MAIN COMPONENT ==================== */
export default function MockInterview() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const capturedFramesRef = useRef<string[]>([]);
  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // MediaPipe Face Mesh references
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const faceMetricsRef = useRef({
    total: 0,
    faceDetected: 0,
    centered: 0,
    stable: 0,
    lastNoseX: null as number | null,
    lastNoseY: null as number | null,
  });

  const [sessionId, setSessionId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questionStartTimeRef = useRef<number>(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  
  // Speaking time tracking refs
  const speakingTimeRef = useRef<number>(0);
  const speakingStartRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!cameraReady) return;

    frameIntervalRef.current = setInterval(() => {
      captureFrame();
    }, 5000);

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [cameraReady]);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Guard against invalid video dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', 0.6);
    capturedFramesRef.current.push(imageData);

    // Note: Behavior metrics are now updated by MediaPipe FaceMesh onResults callback
    // This function primarily handles frame capture for video archiving
  };

  const generateBehaviorMetrics = (): BehaviorMetrics => {
    const frameCount = capturedFramesRef.current.length;
    const attentionScore = Math.min(frameCount * 20, 100);
    const stability = frameCount > 3 ? 'stable' : 'low';

    return {
      frame_count: frameCount,
      attention_score: attentionScore,
      stability,
    };
  };

  const generateFaceSummary = () => {
    const { total, faceDetected, centered, stable } = faceMetricsRef.current;

    // Safety check: insufficient face data
    if (total < 5 || faceDetected === 0) {
      console.warn(`⚠️ Insufficient face data: total=${total}, faceDetected=${faceDetected}`);
      return null;
    }

    // Calculate percentages based on real face detection
    const facePresence = Math.round((faceDetected / total) * 100);
    const attentionScore = Math.round((centered / faceDetected) * 100);
    const stabilityScore = Math.round((stable / faceDetected) * 100);

    const summary = {
      face_presence: facePresence,
      attention_score: attentionScore,
      stability_score: stabilityScore,
    };

    console.log('✓ generateFaceSummary computed from MediaPipe:', {
      totalFramesUsed: total,
      faceDetected,
      centered,
      stable,
      summary,
    });

    return summary;
  };

  const clearCapturedFrames = () => {
    capturedFramesRef.current = [];
  };

  const resetMetricCounters = () => {
    faceMetricsRef.current = {
      total: 0,
      faceDetected: 0,
      centered: 0,
      stable: 0,
      lastNoseX: null,
      lastNoseY: null,
    };
    console.log('✓ Session metric counters reset');
  };

  const stopCameraStream = () => {
    try {
      // Stop MediaPipe camera
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (err) {
          console.warn('Error stopping MediaPipe camera:', err);
        }
        cameraRef.current = null;
      }

      // Close FaceMesh and clean up MediaPipe resources
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (err) {
          console.warn('Error closing FaceMesh:', err);
        }
        faceMeshRef.current = null;
      }

      console.log('MediaPipe resources cleaned');

      // Stop all MediaStream tracks
      if (videoRef.current) {
        try {
          if (videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach((track) => {
              try {
                track.stop();
              } catch (err) {
                console.warn('Error stopping track:', err);
              }
            });
          }
          // Pause video playback
          videoRef.current.pause();
          // Clear the source
          videoRef.current.srcObject = null;
        } catch (err) {
          console.warn('Error stopping video stream:', err);
        }
      }

      console.log('Camera stream stopped');
      setCameraReady(false);
    } catch (err) {
      console.error('Error in stopCameraStream:', err);
    }
  };

  const startCameraStream = async () => {
    // Guard against duplicate streams
    if (videoRef.current?.srcObject) {
      console.log('Camera stream already active, skipping duplicate initialization');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false,
      });

      if (!videoRef.current) {
        console.error('Video element not available');
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      // Assign stream to video element
      videoRef.current.srcObject = stream;

      // Wait for metadata to load before playing
      const onLoadedMetadata = async () => {
        if (!videoRef.current) return;

        try {
          await videoRef.current.play();

          // Initialize MediaPipe FaceMesh after video is playing
          const faceMesh = new FaceMesh({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });

          faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });

          // Set up onResults callback
          faceMesh.onResults((results: any) => {
            const metrics = faceMetricsRef.current;
            metrics.total += 1;

            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              const landmarks = results.multiFaceLandmarks[0];
              metrics.faceDetected += 1;

              // Extract nose tip landmark (index 1)
              const noseTip = landmarks[1];
              const noseX = noseTip.x;
              const noseY = noseTip.y;

              // Check if face is centered (realistic webcam framing: noseX 0.35-0.65, noseY 0.45-0.75)
              if (noseX >= 0.35 && noseX <= 0.65 && noseY >= 0.45 && noseY <= 0.75) {
                metrics.centered += 1;
              }

              // Check stability based on nose movement delta (tightened to 0.008)
              if (metrics.lastNoseX !== null && metrics.lastNoseY !== null) {
                const deltaX = Math.abs(noseX - metrics.lastNoseX);
                const deltaY = Math.abs(noseY - metrics.lastNoseY);
                const deltaDist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (deltaDist < 0.008) {
                  metrics.stable += 1;
                }
              }

              metrics.lastNoseX = noseX;
              metrics.lastNoseY = noseY;

              // Debug: log nose position every 50 frames
              if (metrics.total % 50 === 0) {
                console.log('Nose position:', {
                  x: noseX.toFixed(3),
                  y: noseY.toFixed(3),
                });
              }

              // Debug: log every 20 frames
              if (metrics.total % 20 === 0) {
                console.log('Face metrics (every 20 frames):', metrics);
              }
            }
          });

          faceMeshRef.current = faceMesh;

          // Initialize camera with MediaPipe
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current) {
                await faceMesh.send({ image: videoRef.current });
              }
            },
          });

          cameraRef.current = camera;
          camera.start();
          setCameraReady(true);
        } catch (err) {
          console.error('Error initializing MediaPipe or playing video:', err);
          setCameraReady(false);
        }

        videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
      };

      videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
    } catch (err) {
      console.error('Camera permission denied or unavailable:', err);
      setCameraReady(false);
    }
  };

  useEffect(() => {
    if (!loading && questions.length > 0 && cameraEnabled) {
      startCameraStream();
    }

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, [loading, questions.length, cameraEnabled]);


  useEffect(() => {
    if (user) {
      startMockSession();
    }
  }, [user]);

  const startMockSession = async () => {
    try {
      if (!user) return;

      // Record session start time
      const startTime = new Date().toISOString();
      sessionStartTimeRef.current = Date.now();

      const { data: sessionData, error: sessionError } = await supabase
        .from('mock_sessions')
        .insert({
          user_id: user.id,
          status: 'active',
          total_score: 0,
          total_questions: 5,
          started_at: startTime,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(sessionData.id);

      await fetchRandomQuestions();
    } catch (err) {
      console.error('Mock session error:', err);
      setError('Failed to start mock interview');
    }
  };

  // Initialize Web Speech API
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      if (!recognition) {
        setSpeechSupported(false);
        return;
      }

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
        // Save current timestamp when speaking starts
        speakingStartRef.current = Date.now();
        console.log("Speaking started");
      };

      recognition.onend = () => {
        setListening(false);
        // If speakingStartRef exists, accumulate speaking time
        if (speakingStartRef.current !== null) {
          const speakingDuration = Date.now() - speakingStartRef.current;
          speakingTimeRef.current += speakingDuration;
          speakingStartRef.current = null;
          console.log("Speaking stopped, accumulated time:", speakingTimeRef.current);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          setUserAnswer((prev) => (prev + finalTranscript).trim());
        }
      };

      setSpeechSupported(true);

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      };
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setSpeechSupported(false);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (!loading && questions.length > 0) {
      setTimeRemaining(60);
      questionStartTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentQuestionIndex, loading, questions.length]);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleToggleCamera = () => {
    if (cameraEnabled) {
      stopCameraStream();
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting || !sessionId) return;

    setSubmitting(true);
    stopListening();

    // Clear timer to prevent race condition
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const behaviorMetrics = generateBehaviorMetrics();

      const { data, error } = await supabase.functions.invoke('evaluate-answer', {
        body: {
          session_id: sessionId,
          question_id: questions[currentQuestionIndex].id,
          user_answer: userAnswer,
          behavior_metrics: behaviorMetrics,
        },
      });

      if (error) {
        console.error('Auto-submit error:', error);
        setError('Auto-submission failed. Please try again.');
        setSubmitting(false);
        return;
      }

      console.log('Auto Evaluation:', data);

      // Clear any previous errors
      setError(null);
      clearCapturedFrames();

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUserAnswer('');
      } else {
        await finishMockInterview();
      }
    } catch (err) {
      console.error(err);
      setError('Auto-submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !sessionId) return;

    setSubmitting(true);
    stopListening();

    // Clear timer to prevent race condition with auto-submit
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const behaviorMetrics = generateBehaviorMetrics();

      const { data, error } = await supabase.functions.invoke('evaluate-answer', {
        body: {
          session_id: sessionId,
          question_id: questions[currentQuestionIndex].id,
          user_answer: userAnswer,
          behavior_metrics: behaviorMetrics,
        },
      });

      if (error) {
        console.error('Function error:', error);
        setError('Evaluation failed. Please try again.');
        setSubmitting(false);
        return;
      }

      // Log evaluation result for debugging
      console.log('Evaluation Result:', data);

      // Clear any previous errors
      setError(null);
      clearCapturedFrames();

      // Automatically move to next question (smooth flow, no popup)
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUserAnswer('');
      } else {
        await finishMockInterview();
      }
    } catch (err) {
      console.error(err);
      setError('Evaluation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const finishMockInterview = async () => {
    try {
      // Log face metrics before generating summary
      console.log('Face metrics at interview end:', faceMetricsRef.current);

      // Generate behavior summary before stopping camera
      const behaviorSummary = generateFaceSummary();

      if (!sessionId) return;

      // Safety check: warn if no face was detected
      if (faceMetricsRef.current.total === 0) {
        console.warn('⚠️ No frames were processed during interview');
      }

      // Calculate speaking score
      const endTime = Date.now();
      const startTime = sessionStartTimeRef.current || endTime;
      const durationMs = endTime - startTime;
      
      // Accumulate any remaining speaking time if still recording
      if (speakingStartRef.current !== null) {
        speakingTimeRef.current += (endTime - speakingStartRef.current);
        speakingStartRef.current = null;
      }
      
      const speakingTime = speakingTimeRef.current;
      let speaking_score = 50; // Default if no duration or speaking time
      
      if (durationMs > 0 && speakingTime > 0) {
        const speakingRatio = speakingTime / durationMs;
        speaking_score = Math.min(speakingRatio * 120, 100);
      }
      
      // Clamp speaking_score between 0 and 100
      speaking_score = Math.max(0, Math.min(100, speaking_score));
      
      console.log('Speaking metrics:', {
        speakingTime,
        durationMs,
        speaking_score: speaking_score.toFixed(2),
      });

      // Calculate confidence score
      let confidence_score = 50; // Default if no behavior summary
      
      if (behaviorSummary) {
        const face_presence = behaviorSummary.face_presence;
        const attention_score = behaviorSummary.attention_score;
        const stability_score = behaviorSummary.stability_score;
        
        confidence_score = 
          (face_presence * 0.3) +
          (attention_score * 0.3) +
          (stability_score * 0.2) +
          (speaking_score * 0.2);
        
        // Clamp confidence_score between 0 and 100
        confidence_score = Math.max(0, Math.min(100, confidence_score));
        
        // Round to integer
        confidence_score = Math.round(confidence_score);
        
        console.log('Confidence score calculated:', confidence_score);
      } else {
        // If no behavior summary, use speaking score only
        confidence_score = Math.round(speaking_score * 0.5 + 50 * 0.5);
        console.log('Confidence score calculated (no behavior data):', confidence_score);
      }

      // Prepare update object
      const updateData: Record<string, unknown> = {
        status: 'completed',
        ended_at: new Date().toISOString(),
        confidence_score: confidence_score,
      };

      // Only add behavior_summary if it was successfully generated
      if (behaviorSummary) {
        console.log('📊 Saving behavior summary to Supabase:', behaviorSummary);
        updateData.behavior_summary = behaviorSummary;
      } else {
        console.log('⚠️ No behavior summary to save (insufficient frame data)');
      }

      // Save session update to Supabase
      await supabase
        .from('mock_sessions')
        .update(updateData)
        .eq('id', sessionId);

      console.log('✓ Session updated successfully');

      // Stop camera stream and MediaPipe
      stopCameraStream();

      // Clear captured frames
      clearCapturedFrames();

      // Reset metric counters
      resetMetricCounters();

      // Navigate to result page
      navigate(`/mock-result/${sessionId}`);
    } catch (err) {
      console.error('❌ Error finishing interview:', err);
    }
  };

  const fetchRandomQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setError('No questions available');
        setQuestions([]);
        return;
      }

      const shuffled = data.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(5, shuffled.length));

      setQuestions(selected);
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-lg font-semibold text-gray-900">Loading Interview...</p>
            <p className="text-sm text-gray-500">Preparing your questions</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-12 border border-red-100 shadow-sm max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Error</h2>
            <p className="text-gray-600 text-center">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No Questions State
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">
              📝
            </div>
            <h2 className="text-xl font-bold text-gray-900">No Questions Available</h2>
            <p className="text-gray-600 text-center">
              There are no questions available for the mock interview
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Interview Interface
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              🎯
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mock Interview</h1>
              <p className="text-sm text-gray-500">AI-Powered Interview Session</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              navigate('/dashboard');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="grid lg:grid-cols-[1.6fr,1fr] gap-6 h-[calc(100vh-140px)]">
          {/* Left Panel - Video Preview */}
          <div className="min-h-[400px] lg:min-h-0">
            <VideoPreview
              userName={user?.email?.split('@')[0] || 'User'}
              isRecording={!submitting}
              videoRef={videoRef}
              cameraReady={cameraReady}
              cameraEnabled={cameraEnabled}
              onToggleCamera={handleToggleCamera}
            />
          </div>

          {/* Right Panel - Question & Controls */}
          <div className="min-h-[600px] lg:min-h-0">
            <QuestionPanel
              question={questions[currentQuestionIndex]}
              currentIndex={currentQuestionIndex}
              totalQuestions={questions.length}
              timeRemaining={timeRemaining}
              userAnswer={userAnswer}
              listening={listening}
              speechSupported={speechSupported}
              submitting={submitting}
              error={error}
              onAnswerChange={setUserAnswer}
              onStartListening={startListening}
              onStopListening={stopListening}
              onSubmit={handleSubmitAnswer}
              onSkip={handleAutoSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
