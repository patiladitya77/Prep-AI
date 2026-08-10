import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * useInterviewMonitoring - A comprehensive React hook for monitoring interview integrity
 *
 * This hook provides real-time monitoring for online interviews by:
 * 1. Detecting tab switches and window focus changes
 * 2. Monitoring camera feed for face detection and eye tracking
 * 3. Detecting multiple faces in the camera view
 * 4. Blocking restricted keyboard shortcuts and actions
 * 5. Enforcing fullscreen mode throughout the interview
 *
 * @example
 * ```tsx
 * const InterviewPage = () => {
 *   const {
 *     warningCount,
 *     isMonitoring,
 *     detectionStatus,
 *     videoRef,
 *     startCameraMonitoring,
 *     stopCameraMonitoring,
 *     hasStream,
 *     isCalibrating
 *   } = useInterviewMonitoring({
 *     onWarning: (type, count) => {
 *       console.log(`Warning: ${type}, Count: ${count}`);
 *     },
 *     onInterviewTerminated: () => {
 *       router.push('/interview/terminated');
 *     },
 *     maxWarnings: 3,
 *     enabled: true,
 *     continuousLookAwayThresholdMs: 60000
 *   });
 *
 *   useEffect(() => {
 *     startCameraMonitoring();
 *     return () => stopCameraMonitoring();
 *   }, []);
 *
 *   return (
 *     <div>
 *       <video ref={videoRef} style={{ display: 'none' }} />
 *       <p>Warnings: {warningCount}/3</p>
 *       <p>Face detected: {detectionStatus.faceDetected ? 'Yes' : 'No'}</p>
 *     </div>
 *   );
 * };
 * ```
 */

/**
 * Configuration options for the interview monitoring hook
 */
interface MonitoringOptions {
  /**
   * Callback triggered when a monitoring violation occurs
   * @param type - The type of violation: "tab-switch", "camera-look-away", or "multiple-faces"
   * @param count - The total warning count after this violation
   */
  onWarning: (
    type: "tab-switch" | "camera-look-away" | "multiple-faces",
    count: number,
  ) => void;

  /**
   * Callback triggered when the interview is terminated due to too many warnings
   * Use this to redirect the user or clean up resources
   */
  onInterviewTerminated: () => void;

  /**
   * Maximum number of warnings allowed before automatic termination
   * @default 3
   */
  maxWarnings?: number;

  /**
   * Whether monitoring is enabled. Set to false to disable all monitoring features
   * @default true
   */
  enabled?: boolean;

  /**
   * Time in milliseconds that a user can continuously look away before triggering a warning
   * This helps distinguish between brief glances and sustained inattention
   * @default 60000 (1 minute)
   */
  continuousLookAwayThresholdMs?: number;
}

export const useInterviewMonitoring = ({
  onWarning,
  onInterviewTerminated,
  maxWarnings = 3,
  enabled = true,
  continuousLookAwayThresholdMs = 60 * 1000,
}: MonitoringOptions) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  /**
   * Total count of warnings accumulated during the interview
   * When this reaches maxWarnings, onInterviewTerminated is called
   */
  const [warningCount, setWarningCount] = useState(0);

  /**
   * Whether camera monitoring is currently active
   * True when camera stream is running and face detection is active
   */
  const [isMonitoring, setIsMonitoring] = useState(false);

  /**
   * Whether the camera stream has been successfully initialized
   * Use this to show camera status indicators in your UI
   */
  const [hasStream, setHasStream] = useState(false);

  /**
   * Whether the system is in calibration mode (first 5 seconds)
   * During calibration, no warnings are issued to allow the user to settle in
   */
  const [isCalibrating, setIsCalibrating] = useState(true);

  /**
   * Real-time face detection status information
   * - faceDetected: True if at least one face is visible in the camera
   * - eyesDetected: True if open eyes are detected (helps determine if user is looking)
   * - lookingAtCamera: True if the user appears to be looking at the camera
   * - faceCount: Number of faces detected (warning if > 1)
   */
  const [detectionStatus, setDetectionStatus] = useState({
    faceDetected: false,
    eyesDetected: false,
    lookingAtCamera: false,
    faceCount: 0,
  });

  // ========================================
  // REFS FOR CAMERA AND DETECTION
  // ========================================

  /**
   * Reference to the video element that displays the camera feed
   * Attach this to a <video> element in your component
   */
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Reference to a canvas element for drawing detection overlays (optional)
   * Can be used to visualize face landmarks if needed
   */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Reference to the MediaStream object from getUserMedia
   * Used to stop the camera when monitoring ends
   */
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Reference to the MediaPipe FaceMesh instance
   * This is the AI model that detects faces and facial landmarks
   */
  const faceMeshRef = useRef<any>(null);

  /**
   * Reference to the MediaPipe Camera utility
   * Manages frame processing from the video stream
   */
  const cameraRef = useRef<any>(null);

  /**
   * Reference to cleanup function for unload events
   * Ensures camera resources are released when the page closes
   */
  const unloadCleanupRef = useRef<(() => void) | null>(null);

  // ========================================
  // DETECTION SMOOTHING AND TIMING REFS
  // ========================================

  /**
   * Confidence counter for "looking at camera" detection
   * Prevents flickering by requiring consistent detection over multiple frames
   * Range: 0-5, threshold: 2
   */
  const lookAtConfidenceRef = useRef<number>(0);

  /**
   * Timeout for triggering "look away" warnings
   * Different delays based on what's not detected:
   * - No face: 8 seconds
   * - No eyes: 12 seconds
   * - Not looking: 15 seconds
   */
  const lookAwayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Timeout for triggering "multiple faces" warnings
   * 10-second cooldown between warnings of this type
   */
  const multipleFacesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Map of last toast notification times per warning type
   * Prevents duplicate toasts of the same type within 3 seconds
   * Key: warning type, Value: timestamp
   */
  const lastToastMapRef = useRef<Record<string, number>>({});

  /**
   * Timestamp of the last time MediaPipe produced results
   * Used by watchdog to detect if face detection stops working
   */
  const lastResultTimeRef = useRef<number | null>(null);

  /**
   * Whether the watchdog has already warned about no results
   * Prevents repeated warnings about the same issue
   */
  const noResultsWarnedRef = useRef<boolean>(false);

  /**
   * Timestamp when the user last switched tabs or lost focus
   * Used to calculate duration of tab-away time
   */
  const tabSwitchTimeRef = useRef<number>(Date.now());

  /**
   * Whether the user is currently on a different tab
   * Tracked to avoid duplicate tab-switch warnings
   */
  const isTabAwayRef = useRef<boolean>(false);

  /**
   * Start time of continuous look-away period
   * Null when the user is looking at the camera
   * Used to detect sustained inattention (default: 60 seconds)
   */
  const continuousLookAwayStartRef = useRef<number | null>(null);

  /**
   * Whether a warning has been issued for the current continuous look-away
   * Reset when the user looks back at the camera
   */
  const continuousLookAwayWarnedRef = useRef<boolean>(false);

  // ========================================
  // STATE SYNCHRONIZATION REFS
  // ========================================

  /**
   * Synchronized copy of isMonitoring state in a ref
   * Prevents unnecessary re-renders when checking monitoring status
   */
  const isMonitoringRef = useRef<boolean>(false);

  /**
   * Synchronized copy of hasStream state in a ref
   * Used for quick checks without triggering re-renders
   */
  const hasStreamRef = useRef<boolean>(false);

  /**
   * Flag to prevent multiple simultaneous stop operations
   * Ensures cleanup happens only once
   */
  const isStoppingRef = useRef<boolean>(false);

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  /**
   * Force-stops all video streams on the page
   * This is a defensive cleanup mechanism to prevent camera access issues
   * when the page reloads or the component unmounts unexpectedly
   */
  const forceReleaseAllVideoStreams = useCallback(() => {
    try {
      if (typeof window === "undefined" || !document) return;
      const videos = Array.from(
        document.querySelectorAll("video"),
      ) as HTMLVideoElement[];
      videos.forEach((video) => {
        try {
          const so = video.srcObject as MediaStream | null;
          if (so) {
            try {
              so.getTracks().forEach((t) => {
                try {
                  t.stop();
                } catch (e) {
                  /* ignore */
                }
              });
            } catch (e) {
              /* ignore */
            }
            try {
              video.srcObject = null;
            } catch (e) {
              /* ignore */
            }
          }
        } catch (err) {
          /* ignore per-video errors */
        }
      });
    } catch (err) {
      console.warn("forceReleaseAllVideoStreams failed", err);
    }
  }, []);

  /**
   * Adds a warning and triggers callbacks
   *
   * This function:
   * 1. Prevents duplicate warnings of the same type within 3 seconds
   * 2. Increments the warning counter
   * 3. Calls the onWarning callback with the warning type and new count
   * 4. Triggers onInterviewTerminated if maxWarnings is reached
   *
   * @param type - The type of violation that occurred
   */
  const addWarning = useCallback(
    (type: "tab-switch" | "camera-look-away" | "multiple-faces") => {
      // Prevent duplicate warnings of the same type within a short window
      const now = Date.now();
      const last = lastToastMapRef.current[type];
      if (last && now - last < 3000) return;

      lastToastMapRef.current[type] = now;

      setWarningCount((currentCount) => {
        const newCount = currentCount + 1;
        Promise.resolve().then(() => {
          try {
            onWarning(type, newCount);
            if (newCount >= maxWarnings) {
              onInterviewTerminated();
            }
          } catch (e) {
            console.error("onWarning callback error", e);
          }
        });
        return newCount;
      });
    },
    [maxWarnings, onWarning, onInterviewTerminated],
  );

  // ========================================
  // STATE SYNCHRONIZATION
  // ========================================

  /**
   * Keep refs in sync with state
   * These effects prevent unnecessary setState() calls by maintaining
   * current values in refs for quick access
   */
  useEffect(() => {
    isMonitoringRef.current = isMonitoring;
  }, [isMonitoring]);
  useEffect(() => {
    hasStreamRef.current = hasStream;
  }, [hasStream]);

  // ========================================
  // MEDIAPIPE FACE DETECTION INITIALIZATION
  // ========================================

  /**
   * Initializes the MediaPipe FaceMesh model for face and eye detection
   *
   * This function:
   * 1. Tries to import @mediapipe/face_mesh dynamically
   * 2. Falls back to CDN script loading if import fails
   * 3. Configures the model to detect up to 4 faces with refined landmarks
   * 4. Sets up result processing for face/eye detection and look-away monitoring
   *
   * Face Detection Algorithm:
   * - Uses facial landmarks to detect eyes, nose, and face position
   * - Eye detection: Measures vertical distance between eye landmarks
   * - Looking direction: Compares nose position to face center
   * - Smoothing: Uses confidence counter to prevent flickering
   *
   * Warning Triggers:
   * - No face detected: 5-8 seconds
   * - Eyes not detected: 12 seconds
   * - Not looking at camera: 15 seconds
   * - Multiple faces: Immediate warning with 10-second cooldown
   * - Continuous look-away: Configurable threshold (default 60 seconds)
   */
  const initializeMediaPipe = useCallback(async () => {
    if (typeof window === "undefined") {
      console.warn("MediaPipe initialization skipped on server-side");
      return;
    }

    if (faceMeshRef.current) return;

    const tryExplicitImports = async () => {
      try {
        const mod = await import("@mediapipe/face_mesh");
        if (mod && (Object.keys(mod).length > 0 || (mod as any).default))
          return mod;
      } catch (e) {
        console.warn("Import @mediapipe/face_mesh failed:", e);
      }
      return null;
    };

    try {
      const FaceMeshModule = await tryExplicitImports();
      let faceMeshConstructor: any = null;

      if (FaceMeshModule) {
        if ((FaceMeshModule as any).FaceMesh) {
          faceMeshConstructor = (FaceMeshModule as any).FaceMesh;
        } else if ((FaceMeshModule as any).default?.FaceMesh) {
          faceMeshConstructor = (FaceMeshModule as any).default.FaceMesh;
        } else if (typeof (FaceMeshModule as any).default === "function") {
          faceMeshConstructor = (FaceMeshModule as any).default;
        } else if (typeof FaceMeshModule === "function") {
          faceMeshConstructor = FaceMeshModule as any;
        }
      }

      if (!faceMeshConstructor) {
        console.warn(
          "FaceMesh constructor not found in dynamic imports, trying script tag fallback...",
        );

        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector(
            "script[data-mediapipe-face_mesh]",
          );
          if (existing) return resolve();

          const s = document.createElement("script");
          s.src =
            "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
          s.setAttribute("data-mediapipe-face_mesh", "1");
          s.onload = () => resolve();
          s.onerror = () =>
            reject(new Error("Failed to load MediaPipe script"));
          document.head.appendChild(s);
          setTimeout(() => {
            if (!(window as any).FaceMesh && !(window as any).faceMesh) {
              reject(
                new Error("MediaPipe script loaded but global not available"),
              );
            } else {
              resolve();
            }
          }, 8000);
        }).catch((scriptErr) => {
          console.warn("Script fallback failed:", scriptErr);
        });

        faceMeshConstructor =
          (window as any).FaceMesh ||
          (window as any).face_mesh ||
          (window as any).faceMeshModule ||
          null;
        if (!faceMeshConstructor && (window as any).FaceMesh?.FaceMesh) {
          faceMeshConstructor = (window as any).FaceMesh.FaceMesh;
        }
      }

      if (!faceMeshConstructor || typeof faceMeshConstructor !== "function") {
        console.error("FaceMesh constructor not found after all attempts", {
          faceMeshConstructor,
        });
        throw new Error("FaceMesh constructor not found");
      }

      const faceMesh = new faceMeshConstructor({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 4,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((results: any) => {
        // Update watchdog timestamp
        lastResultTimeRef.current = Date.now();
        noResultsWarnedRef.current = false;

        if (
          results.multiFaceLandmarks &&
          results.multiFaceLandmarks.length > 0
        ) {
          // Extract face count and primary face landmarks
          const faceCount = results.multiFaceLandmarks.length;
          const landmarks = results.multiFaceLandmarks[0];
          const faceDetected = Array.isArray(landmarks) && landmarks.length > 0;

          // Helper to safely get landmark coordinates
          const get = (i: number) =>
            landmarks[i] ? landmarks[i] : { x: 0.5, y: 0.5, z: 0 };

          // ========================================
          // EYE DETECTION
          // ========================================
          // Landmark indices for eye corners (top and bottom)
          const leftEyeTop = get(159);
          const leftEyeBottom = get(145);
          const rightEyeTop = get(386);
          const rightEyeBottom = get(374);

          // Calculate eye openness by measuring vertical distance
          const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
          const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
          const eyeOpenThreshold = 0.006; // Threshold for considering eyes "open"

          const eyesDetected =
            faceDetected &&
            leftEyeHeight > eyeOpenThreshold &&
            rightEyeHeight > eyeOpenThreshold;

          // ========================================
          // LOOKING DIRECTION DETECTION
          // ========================================
          // Compare nose position to face center to determine gaze direction
          const noseTip = get(1);
          const leftCheek = get(234);
          const rightCheek = get(454);

          const faceCenter = {
            x: (leftCheek.x + rightCheek.x) / 2,
            y: (leftCheek.y + rightCheek.y) / 2,
          };

          const noseOffset = {
            x: Math.abs(noseTip.x - faceCenter.x),
            y: Math.abs(noseTip.y - faceCenter.y),
          };

          // Thresholds for considering the user "looking at camera"
          const noseOffsetXThreshold = 0.12;
          const noseOffsetYThreshold = 0.1;
          const centeredEnough = Math.abs(faceCenter.x - 0.5) < 0.12;

          const localLooking =
            eyesDetected &&
            ((noseOffset.x < noseOffsetXThreshold &&
              noseOffset.y < noseOffsetYThreshold) ||
              centeredEnough);

          // ========================================
          // CONFIDENCE SMOOTHING
          // ========================================
          // Smooth out detection to prevent rapid flickering
          // Requires 2 consecutive positive detections to consider "looking"
          if (localLooking) {
            lookAtConfidenceRef.current = Math.min(
              5,
              lookAtConfidenceRef.current + 1,
            );
          } else {
            lookAtConfidenceRef.current = Math.max(
              0,
              lookAtConfidenceRef.current - 1,
            );
          }

          const lookingAtCamera = lookAtConfidenceRef.current >= 2;

          // Update detection status for UI display
          setDetectionStatus({
            faceDetected,
            eyesDetected,
            lookingAtCamera,
            faceCount,
          });

          // ========================================
          // MULTIPLE FACES WARNING
          // ========================================
          // Warn if more than one person is detected in the camera view
          try {
            if (faceCount > 1) {
              console.debug("useInterviewMonitoring: multiple faces detected", {
                faceCount,
              });
              if (!multipleFacesTimeoutRef.current) {
                addWarning("multiple-faces");
                multipleFacesTimeoutRef.current = setTimeout(() => {
                  multipleFacesTimeoutRef.current = null;
                }, 10000);
              }
            } else {
              if (multipleFacesTimeoutRef.current) {
                clearTimeout(multipleFacesTimeoutRef.current);
                multipleFacesTimeoutRef.current = null;
              }
            }
          } catch (err) {
            console.error("Multiple-faces detection check failed", err);
          }

          // ========================================
          // SHORT-LIVED LOOK-AWAY TIMEOUTS
          // ========================================
          // These timeouts trigger warnings after brief periods of inattention
          // Different durations based on severity of the issue

          // No face detected at all - most severe (8 seconds)
          if (!faceDetected) {
            if (!lookAwayTimeoutRef.current && !isCalibrating) {
              lookAwayTimeoutRef.current = setTimeout(() => {
                addWarning("camera-look-away");
                lookAwayTimeoutRef.current = null;
              }, 8000);
            }
          } else if (!eyesDetected) {
            // Face detected but eyes closed/not detected (12 seconds)
            if (!lookAwayTimeoutRef.current && !isCalibrating) {
              lookAwayTimeoutRef.current = setTimeout(() => {
                addWarning("camera-look-away");
                lookAwayTimeoutRef.current = null;
              }, 12000);
            }
          } else if (!lookingAtCamera) {
            // Eyes detected but not looking at camera (15 seconds)
            if (!lookAwayTimeoutRef.current && !isCalibrating) {
              lookAwayTimeoutRef.current = setTimeout(() => {
                addWarning("camera-look-away");
                lookAwayTimeoutRef.current = null;
              }, 15000);
            }
          } else {
            // Looking at camera - clear any pending timeout
            if (lookAwayTimeoutRef.current) {
              clearTimeout(lookAwayTimeoutRef.current);
              lookAwayTimeoutRef.current = null;
            }
          }

          // ========================================
          // CONTINUOUS LOOK-AWAY DETECTION
          // ========================================
          // Tracks sustained inattention over long periods
          // This catches users who consistently look away without brief returns
          try {
            const isAwayLong = !faceDetected || !lookingAtCamera;
            if (isAwayLong) {
              // Start tracking if not already tracking
              if (continuousLookAwayStartRef.current === null) {
                continuousLookAwayStartRef.current = Date.now();
                continuousLookAwayWarnedRef.current = false;
              } else {
                // Check if threshold exceeded
                const elapsed = Date.now() - continuousLookAwayStartRef.current;
                if (
                  !continuousLookAwayWarnedRef.current &&
                  elapsed >= continuousLookAwayThresholdMs
                ) {
                  continuousLookAwayWarnedRef.current = true;
                  addWarning("camera-look-away");
                }
              }
            } else {
              // User is looking - reset continuous tracking
              if (continuousLookAwayStartRef.current !== null) {
                continuousLookAwayStartRef.current = null;
                continuousLookAwayWarnedRef.current = false;
              }
            }
          } catch (err) {
            console.error("Continuous look-away check failed", err);
          }
        } else {
          // ========================================
          // NO FACE DETECTED HANDLING
          // ========================================
          // Update UI to show no detection
          setDetectionStatus({
            faceDetected: false,
            eyesDetected: false,
            lookingAtCamera: false,
            faceCount: 0,
          });

          // Clear multiple faces timeout if active
          if (multipleFacesTimeoutRef.current) {
            clearTimeout(multipleFacesTimeoutRef.current);
            multipleFacesTimeoutRef.current = null;
          }

          // Trigger short-lived warning timeout (5 seconds when no face)
          if (!lookAwayTimeoutRef.current && !isCalibrating) {
            lookAwayTimeoutRef.current = setTimeout(() => {
              addWarning("camera-look-away");
              lookAwayTimeoutRef.current = null;
            }, 5000);
          }

          // Track continuous look-away even when no face detected
          try {
            if (continuousLookAwayStartRef.current === null) {
              continuousLookAwayStartRef.current = Date.now();
              continuousLookAwayWarnedRef.current = false;
            } else {
              const elapsed = Date.now() - continuousLookAwayStartRef.current;
              if (
                !continuousLookAwayWarnedRef.current &&
                elapsed >= continuousLookAwayThresholdMs
              ) {
                continuousLookAwayWarnedRef.current = true;
                addWarning("camera-look-away");
              }
            }
          } catch (err) {
            console.error("Continuous look-away (no-face) check failed", err);
          }
        }
      });

      faceMeshRef.current = faceMesh;
    } catch (error) {
      console.error("Failed to initialize MediaPipe:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : typeof error,
      });

      // ========================================
      // FALLBACK: ALTERNATIVE MEDIAPIPE LOADING
      // ========================================
      // Try loading MediaPipe via global script tag if module import fails
      try {
        const faceMeshScript = document.createElement("script");
        faceMeshScript.src =
          "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
        document.head.appendChild(faceMeshScript);

        await new Promise((resolve, reject) => {
          faceMeshScript.onload = resolve;
          faceMeshScript.onerror = reject;
          setTimeout(reject, 10000);
        });

        if ((window as any).FaceMesh) {
          const faceMesh = new (window as any).FaceMesh({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });

          faceMesh.setOptions({
            maxNumFaces: 4,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });

          faceMesh.onResults((results: any) => {
            lastResultTimeRef.current = Date.now();
            noResultsWarnedRef.current = false;
            if (
              results.multiFaceLandmarks &&
              results.multiFaceLandmarks.length > 0
            ) {
              const landmarks = results.multiFaceLandmarks[0];
              const faceDetected = landmarks && landmarks.length > 0;
              setDetectionStatus({
                faceDetected,
                eyesDetected: faceDetected,
                lookingAtCamera: faceDetected,
                faceCount: 1,
              });
            } else {
              setDetectionStatus({
                faceDetected: false,
                eyesDetected: false,
                lookingAtCamera: false,
                faceCount: 0,
              });
            }
          });

          faceMeshRef.current = faceMesh;
          return;
        }
      } catch (scriptError) {
        console.error("Alternative MediaPipe loading failed:", scriptError);
      }

      // ========================================
      // FINAL FALLBACK: MOCK DETECTION
      // ========================================
      // If all else fails, use a mock detector that assumes face is always present
      // This allows monitoring to continue with tab switching detection only
      toast.error(
        "Face detection unavailable. Using monitoring without face tracking.",
        { id: "face-detection-unavailable" },
      );

      // Fallback mock detector - assumes face is always present
      faceMeshRef.current = {
        send: () => {
          setDetectionStatus({
            faceDetected: true,
            eyesDetected: true,
            lookingAtCamera: true,
            faceCount: 1,
          });
        },
        close: () => {},
      };
    }
  }, [isCalibrating, addWarning]);

  // ========================================
  // TAB SWITCHING AND WINDOW MONITORING
  // ========================================

  /**
   * Sets up comprehensive tab and window monitoring
   *
   * This effect monitors:
   * - Tab visibility changes (document.hidden)
   * - Window focus/blur events
   * - Window resizing (prevents split screen)
   * - Fullscreen exits
   * - Keyboard shortcuts (Alt+Tab, Ctrl+Tab, F12, etc.)
   * - Right-click context menu
   * - Page unload attempts
   *
   * All violations trigger "tab-switch" warnings
   */
  useEffect(() => {
    if (!enabled) return;

    let warningTimeoutId: NodeJS.Timeout | null = null;

    /**
     * Handles page visibility changes (tab switches)
     * Tracks when user leaves and returns to the tab
     */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!isTabAwayRef.current) {
          isTabAwayRef.current = true;
          tabSwitchTimeRef.current = Date.now();
          addWarning("tab-switch");
        }
      } else {
        const wasAway = isTabAwayRef.current;
        isTabAwayRef.current = false;

        if (warningTimeoutId) {
          clearTimeout(warningTimeoutId);
          warningTimeoutId = null;
        }

        if (wasAway) {
          const awayDuration = Date.now() - tabSwitchTimeRef.current;
          if (awayDuration > 2000) {
            addWarning("tab-switch");
          }
        }
      }
    };

    /**
     * Handles window gaining focus
     * Clears warnings when user returns to the window
     */
    const handleFocus = () => {
      isTabAwayRef.current = false;
      if (warningTimeoutId) {
        clearTimeout(warningTimeoutId);
        warningTimeoutId = null;
      }
    };

    /**
     * Handles window losing focus
     * Triggers warning when user switches to another window
     */
    const handleBlur = () => {
      if (!isTabAwayRef.current) {
        isTabAwayRef.current = true;
        tabSwitchTimeRef.current = Date.now();
        addWarning("tab-switch");
      }
    };

    /**
     * Blocks keyboard shortcuts that could be used to cheat or leave the interview
     * Comprehensive list includes tab switching, dev tools, refresh, etc.
     */
    const handleKeyDown = (e: KeyboardEvent) => {
      const blockedKeys = [
        e.altKey && e.code === "Tab",
        e.ctrlKey && e.code === "Tab",
        e.ctrlKey && e.shiftKey && e.code === "Tab",
        e.altKey && e.code === "F4",
        e.code === "F12",
        e.ctrlKey && e.shiftKey && e.code === "KeyI",
        e.ctrlKey && e.shiftKey && e.code === "KeyJ",
        e.ctrlKey && e.shiftKey && e.code === "KeyC",
        e.ctrlKey && e.shiftKey && e.code === "KeyK",
        e.ctrlKey && e.code === "KeyU",
        e.metaKey && e.code === "KeyM",
        e.altKey && e.code === "Space",
        e.metaKey && e.code === "KeyH",
        e.metaKey && e.code === "KeyD",
        e.metaKey && e.code === "F3",
        e.metaKey && e.code === "ArrowLeft",
        e.metaKey && e.code === "ArrowRight",
        e.metaKey && e.code === "ArrowUp",
        e.metaKey && e.code === "ArrowDown",
        e.metaKey && e.shiftKey && e.code === "ArrowLeft",
        e.metaKey && e.shiftKey && e.code === "ArrowRight",
        e.metaKey && e.shiftKey && e.code === "ArrowUp",
        e.metaKey && e.shiftKey && e.code === "ArrowDown",
        e.ctrlKey && e.code === "KeyS",
        e.ctrlKey && e.code === "KeyP",
        e.ctrlKey && e.code === "KeyR",
        e.ctrlKey && e.shiftKey && e.code === "KeyR",
        e.code === "F5",
        e.ctrlKey && e.code === "F5",
        e.ctrlKey && e.shiftKey && e.code === "Delete",
        e.ctrlKey && e.code === "KeyN",
        e.ctrlKey && e.shiftKey && e.code === "KeyN",
        e.ctrlKey && e.code === "KeyT",
        e.ctrlKey && e.shiftKey && e.code === "KeyT",
        e.ctrlKey && e.code === "KeyW",
        e.code === "F1",
        e.code === "F11",
        e.altKey && e.code === "Enter",
        e.ctrlKey && e.code === "Semicolon",
        e.ctrlKey && e.code === "Backquote",
      ];

      if (blockedKeys.some((blocked) => blocked)) {
        e.preventDefault();
        e.stopPropagation();
        addWarning("tab-switch");
        toast.error("This action is not allowed during the interview!");
        return false;
      }
    };

    /**
     * Prevents right-click context menu during interview
     * Blocks access to inspect element and other browser features
     */
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addWarning("tab-switch");
      toast.error("Right-click is disabled during interview!");
      return false;
    };

    /**
     * Monitors window resizing to prevent split-screen or side-by-side windows
     * Triggers warning if window is reduced by more than 25% in either dimension
     * Attempts to restore fullscreen when resize is detected
     */
    let initialWindowSize = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    const handleResize = () => {
      const widthReduction =
        (initialWindowSize.width - window.innerWidth) / initialWindowSize.width;
      const heightReduction =
        (initialWindowSize.height - window.innerHeight) /
        initialWindowSize.height;

      if (widthReduction > 0.25 || heightReduction > 0.25) {
        addWarning("tab-switch");
        toast.error(
          "Window resizing/split screen is not allowed during interview!",
        );

        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            console.warn("Could not restore fullscreen during interview");
          });
        }
      }
    };

    /**
     * Monitors fullscreen state and prevents exiting fullscreen
     * Automatically attempts to re-enter fullscreen if user exits
     */
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addWarning("tab-switch");
        toast.error("Exiting fullscreen is not allowed during interview!");

        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            console.warn("Could not re-enter fullscreen during interview");
          });
        }
      }
    };

    /**
     * Prevents leaving the interview page
     * Shows browser confirmation dialog if user tries to navigate away or close the tab
     */
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Leaving the interview page is not allowed!";
      addWarning("tab-switch");
      return "Leaving the interview page is not allowed!";
    };

    // Register all event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu, true);

    // Cleanup function - removes all event listeners
    return () => {
      if (warningTimeoutId) clearTimeout(warningTimeoutId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
    };
  }, [enabled, addWarning]);

  // ========================================
  // CAMERA MONITORING FUNCTIONS
  // ========================================

  /**
   * Starts camera monitoring with MediaPipe face detection
   *
   * This function:
   * 1. Initializes MediaPipe FaceMesh model
   * 2. Requests camera access from the user
   * 3. Sets up video stream and face detection
   * 4. Starts a 5-second calibration period (no warnings during this time)
   * 5. Begins continuous frame processing for face/eye detection
   * 6. Sets up a watchdog to monitor if face detection stops working
   *
   * Camera Error Handling:
   * - NotAllowedError: User denied camera permission
   * - NotFoundError: No camera device found
   * - NotReadableError: Camera is in use by another application
   *
   * Even if camera fails, tab monitoring continues to work
   */
  const startCameraMonitoring = useCallback(async () => {
    if (!enabled || isMonitoring) return;

    try {
      // Initialize MediaPipe face detection model
      await initializeMediaPipe();

      // Check browser support for camera access
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported");
      }

      // Request camera access with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setHasStream(true);

      /**
       * Synchronous cleanup to stop camera tracks on page refresh/unload
       * This prevents the camera from staying active after the user leaves
       */
      try {
        const syncCleanup = () => {
          try {
            streamRef.current?.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (e) {
                /* ignore */
              }
            });
          } catch (e) {
            /* ignore */
          }
          try {
            forceReleaseAllVideoStreams();
          } catch (e) {
            /* ignore */
          }
        };

        window.addEventListener("beforeunload", syncCleanup, true);
        window.addEventListener("pagehide", syncCleanup, true);

        unloadCleanupRef.current = () => {
          try {
            window.removeEventListener("beforeunload", syncCleanup, true);
          } catch (e) {}
          try {
            window.removeEventListener("pagehide", syncCleanup, true);
          } catch (e) {}
        };
      } catch (e) {
        /* ignore if window not available */
      }

      // Attach video stream to video element and start processing
      if (videoRef.current && faceMeshRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        // Wait for video metadata to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.error("Video loading timeout");
            reject(new Error("Video timeout"));
          }, 10000);

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
          };
          video.onerror = (error) => {
            console.error("Video element error:", error);
            clearTimeout(timeout);
            reject(new Error("Video error"));
          };
        });

        // Start video playback
        await video.play();
        setIsMonitoring(true);

        // Start calibration period (5 seconds with no warnings)
        setIsCalibrating(true);

        setTimeout(() => {
          setIsCalibrating(false);
        }, 5000);

        /**
         * Manual frame processing loop
         * Sends video frames to MediaPipe for face detection
         * Used as primary method or fallback if MediaPipe Camera fails
         */
        const startManualFrameProcessing = () => {
          const processFrame = () => {
            if (
              faceMeshRef.current &&
              video.readyState >= 2 &&
              typeof faceMeshRef.current.send === "function"
            ) {
              try {
                faceMeshRef.current.send({ image: video });
              } catch (sendError) {
                console.error("Error in manual frame processing:", sendError);
              }
            }
            if (cameraRef.current !== null) {
              requestAnimationFrame(processFrame);
            }
          };
          cameraRef.current = {
            stop: () => {
              cameraRef.current = null;
            },
          };
          requestAnimationFrame(processFrame);
        };

        /**
         * Try to use MediaPipe Camera utility for frame processing
         * Falls back to manual processing if Camera is not available
         */
        try {
          const CameraModule = await import("@mediapipe/camera_utils");

          const resolveCameraConstructor = (mod: any) => {
            if (!mod) return null;
            if (mod.Camera) return mod.Camera;
            if (mod.default?.Camera) return mod.default.Camera;
            if (typeof mod.default === "function") return mod.default;
            if (typeof mod === "function") return mod;
            try {
              for (const k of Object.keys(mod)) {
                const v = mod[k];
                if (!v) continue;
                if (v.Camera) return v.Camera;
                if (typeof v === "function") return v;
              }
            } catch (e) {
              /* ignore */
            }
            if ((window as any).Camera) return (window as any).Camera;
            if ((window as any).cameraUtils?.Camera)
              return (window as any).cameraUtils.Camera;
            return null;
          };

          const CameraConstructor = resolveCameraConstructor(CameraModule);

          if (CameraConstructor && typeof CameraConstructor === "function") {
            try {
              const camera = new CameraConstructor(video, {
                onFrame: async () => {
                  if (
                    faceMeshRef.current &&
                    typeof faceMeshRef.current.send === "function"
                  ) {
                    try {
                      await faceMeshRef.current.send({ image: video });
                    } catch (sendError) {
                      console.error(
                        "Error sending frame to FaceMesh:",
                        sendError,
                      );
                    }
                  }
                },
                width: 640,
                height: 480,
              });

              if (typeof camera.start === "function") await camera.start();
              cameraRef.current = camera;
            } catch (instErr) {
              console.error("Error instantiating Camera constructor:", instErr);
              startManualFrameProcessing();
            }
          } else {
            startManualFrameProcessing();
          }
        } catch (cameraError) {
          console.error("Failed to initialize MediaPipe Camera:", cameraError);
          startManualFrameProcessing();
        }

        /**
         * Watchdog timer to detect if face detection stops working
         * Checks every 2 seconds if MediaPipe is producing results
         * Shows warning toast if no results for more than 5 seconds
         */
        const watchdogInterval = setInterval(() => {
          try {
            const last = lastResultTimeRef.current;
            if (!last) {
              if (
                !noResultsWarnedRef.current &&
                Date.now() - (streamRef.current ? Date.now() : 0) > 5000
              ) {
                noResultsWarnedRef.current = true;
                toast.error(
                  "Face detection not producing results. Please check camera/permissions.",
                  { id: "face-results-watchdog" },
                );
              }
              return;
            }
            if (Date.now() - last > 5000 && !noResultsWarnedRef.current) {
              noResultsWarnedRef.current = true;
              toast.error(
                "Face detection inactive — make sure camera view is clear.",
                { id: "face-results-inactive" },
              );
            }
          } catch (e) {
            /* ignore watchdog errors */
          }
        }, 2000);

        // Add watchdog cleanup to unload handler
        const oldUnload = unloadCleanupRef.current;
        unloadCleanupRef.current = () => {
          try {
            clearInterval(watchdogInterval);
          } catch (e) {}
          if (oldUnload) oldUnload();
        };
      } else {
        console.error("Video element or MediaPipe not ready");
        setHasStream(false);
        throw new Error("Video element or MediaPipe not found");
      }
    } catch (error) {
      // Handle camera access errors with user-friendly messages
      console.error("Camera error:", error);
      const errorName = (error as any)?.name || "";
      setHasStream(false);

      // Provide specific error messages based on error type
      if (errorName === "NotAllowedError") {
        toast.error(
          "Camera permission denied. Please allow camera access and retry.",
          { id: "camera-permission-denied" },
        );
      } else if (errorName === "NotFoundError") {
        toast.error("No camera found. Please connect a camera and retry.", {
          id: "camera-not-found",
        });
      } else if (errorName === "NotReadableError") {
        toast.error(
          "Camera is being used by another application. Please close other apps and retry.",
          { id: "camera-in-use" },
        );
      } else {
        toast.error(
          "Camera access failed. Please check your camera settings and retry.",
          { id: "camera-access-failed" },
        );
      }

      // Enable tab monitoring even if camera fails
      setIsMonitoring(true); // Enable tab monitoring anyway
    }
  }, [enabled, initializeMediaPipe]);

  /**
   * Stops camera monitoring and releases all resources
   *
   * This function:
   * 1. Stops the MediaPipe Camera utility
   * 2. Closes the MediaPipe FaceMesh instance
   * 3. Stops all camera tracks
   * 4. Releases video stream
   * 5. Removes event listeners
   * 6. Resets all state to initial values
   *
   * Safe to call multiple times - includes guards against duplicate calls
   */
  const stopCameraMonitoring = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    try {
      // Stop camera frame processing
      if (cameraRef.current && typeof cameraRef.current.stop === "function") {
        try {
          cameraRef.current.stop();
        } catch (e) {
          console.warn("Error stopping cameraRef:", e);
        }
        cameraRef.current = null;
      }

      // Close MediaPipe FaceMesh instance
      if (faceMeshRef.current) {
        try {
          if (typeof faceMeshRef.current.close === "function")
            faceMeshRef.current.close();
        } catch (e) {
          console.warn("Error closing faceMeshRef:", e);
        }
        faceMeshRef.current = null;
      }

      // Clear any pending warning timeouts
      if (lookAwayTimeoutRef.current) {
        clearTimeout(lookAwayTimeoutRef.current);
        lookAwayTimeoutRef.current = null;
      }

      // Stop all camera tracks
      if (streamRef.current) {
        try {
          streamRef.current
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());
        } catch (e) {
          console.warn("Error stopping stream tracks:", e);
        }
        streamRef.current = null;
      }

      // Remove unload event listeners
      try {
        if (unloadCleanupRef.current) {
          unloadCleanupRef.current();
          unloadCleanupRef.current = null;
        }
      } catch (e) {
        /* ignore */
      }

      // Force release any remaining video streams
      try {
        forceReleaseAllVideoStreams();
      } catch (e) {
        /* ignore */
      }

      // Reset state to initial values
      if (isMonitoringRef.current) setIsMonitoring(false);
      if (hasStreamRef.current) setHasStream(false);
      setIsCalibrating(true);

      // Only update detection status if it's not already in default state
      setDetectionStatus((prev) => {
        if (!prev.faceDetected && !prev.eyesDetected && !prev.lookingAtCamera)
          return prev;
        return {
          faceDetected: false,
          eyesDetected: false,
          lookingAtCamera: false,
          faceCount: 0,
        };
      });
    } catch (e) {
      console.error("Error during stopCameraMonitoring:", e);
    } finally {
      isStoppingRef.current = false;
    }
  }, []);

  // ========================================
  // CLEANUP ON UNMOUNT
  // ========================================

  /**
   * Cleanup effect that runs only when component unmounts
   * Ensures all resources are released properly
   *
   * This prevents:
   * - Camera staying active after component unmounts
   * - Memory leaks from unreleased resources
   * - MediaPipe instances continuing to run
   */
  useEffect(() => {
    return () => {
      try {
        if (cameraRef.current && typeof cameraRef.current.stop === "function")
          cameraRef.current.stop();
      } catch (e) {
        console.warn("Error stopping camera on unmount:", e);
      }

      try {
        if (
          faceMeshRef.current &&
          typeof faceMeshRef.current.close === "function"
        )
          faceMeshRef.current.close();
      } catch (e) {
        console.warn("Error closing faceMesh on unmount:", e);
      }

      if (lookAwayTimeoutRef.current) clearTimeout(lookAwayTimeoutRef.current);

      if (streamRef.current) {
        try {
          streamRef.current
            .getTracks()
            .forEach((track: MediaStreamTrack) => track.stop());
        } catch (e) {
          console.warn("Error stopping stream tracks on unmount:", e);
        }
      }
      try {
        forceReleaseAllVideoStreams();
      } catch (e) {
        /* ignore */
      }
      try {
        if (unloadCleanupRef.current) {
          unloadCleanupRef.current();
          unloadCleanupRef.current = null;
        }
      } catch (e) {
        /* ignore */
      }
    };
  }, []);

  // ========================================
  // RETURN VALUES
  // ========================================

  /**
   * Hook return values for use in your component:
   *
   * @returns {number} warningCount - Current number of warnings (0 to maxWarnings)
   * @returns {boolean} isMonitoring - Whether monitoring is currently active
   * @returns {object} detectionStatus - Real-time face detection status
   *   - faceDetected: boolean - Is a face visible?
   *   - eyesDetected: boolean - Are eyes detected?
   *   - lookingAtCamera: boolean - Is user looking at camera?
   *   - faceCount: number - How many faces detected?
   * @returns {RefObject} videoRef - Attach to <video> element for camera feed
   * @returns {RefObject} canvasRef - Optional: attach to <canvas> for visualization
   * @returns {Function} startCameraMonitoring - Call to start camera monitoring
   * @returns {Function} stopCameraMonitoring - Call to stop camera monitoring
   * @returns {boolean} hasStream - Whether camera stream is active
   * @returns {boolean} isCalibrating - Whether in calibration period (first 5 seconds)
   */
  return {
    warningCount,
    isMonitoring,
    detectionStatus,
    videoRef,
    canvasRef,
    startCameraMonitoring,
    stopCameraMonitoring,
    hasStream,
    isCalibrating,
  };
};
