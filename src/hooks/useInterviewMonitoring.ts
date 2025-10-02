import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface MonitoringOptions {
  onWarning: (type: "tab-switch" | "camera-look-away", count: number) => void;
  onInterviewTerminated: () => void;
  maxWarnings?: number;
  enabled?: boolean;
}

export const useInterviewMonitoring = ({
  onWarning,
  onInterviewTerminated,
  maxWarnings = 3,
  enabled = true,
}: MonitoringOptions) => {
  const [warningCount, setWarningCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState({
    faceDetected: false,
    eyesDetected: false,
    lookingAtCamera: false,
  });

  // Refs for camera and detection
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lookAwayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFrameDataRef = useRef<ImageData | null>(null);
  const lastToastRef = useRef<string>(""); // Track last toast to prevent duplicates
  const tabSwitchTimeRef = useRef<number>(Date.now());

  const addWarning = useCallback(
    (type: "tab-switch" | "camera-look-away") => {
      // Prevent duplicate warnings for same type within short time
      const now = Date.now();
      const lastToastTime = lastToastRef.current;
      if (lastToastTime && now - parseInt(lastToastTime) < 3000) {
        return; // Skip if same warning was shown in last 3 seconds
      }

      lastToastRef.current = now.toString();

      setWarningCount((currentCount) => {
        const newCount = currentCount + 1;
        onWarning(type, newCount); // Only let InterviewUI handle the toast

        if (newCount >= maxWarnings) {
          onInterviewTerminated();
        }

        return newCount;
      });
    },
    [maxWarnings, onWarning, onInterviewTerminated]
  );

  // Simplified and reliable motion/presence detection
  const detectFaceAndGaze = (imageData: ImageData) => {
    const { data, width, height } = imageData;

    if (width === 0 || height === 0 || data.length === 0) {
      return {
        faceDetected: false,
        eyesDetected: false,
        lookingAtCamera: false,
      };
    }

    let totalBrightness = 0;
    let varianceSum = 0;
    let skinLikePixels = 0;
    let darkPixels = 0;
    let centerActivity = 0;
    let totalSamples = 0;
    let motionPixels = 0;
    let edgePixels = 0; // For edge detection
    let uniformPixels = 0; // For uniform background detection

    // Compare with previous frame for motion detection
    const lastFrame = lastFrameDataRef.current;
    const canCompareFrames =
      lastFrame && lastFrame.width === width && lastFrame.height === height;

    // Simple but effective sampling every 8 pixels
    for (let y = 0; y < height; y += 8) {
      for (let x = 0; x < width; x += 8) {
        const pixelIndex = (y * width + x) * 4;
        if (pixelIndex + 3 >= data.length) continue;

        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;

        // Calculate variance (measure of detail/texture)
        const avgColor = brightness;
        const rVar = Math.pow(r - avgColor, 2);
        const gVar = Math.pow(g - avgColor, 2);
        const bVar = Math.pow(b - avgColor, 2);
        varianceSum += (rVar + gVar + bVar) / 3;

        // Simplified and more inclusive skin detection
        const isWarmTone = r > g && r > b && r > 70; // Basic warm tone
        const isFleshTone = r > 80 && g > 40 && b > 20 && r > g; // Inclusive flesh tone
        const isSkinLike = r > 60 && r > g && r > b && r - b > 5; // Very broad skin-like
        const isValidSkin =
          (isWarmTone || isFleshTone || isSkinLike) &&
          brightness > 40 &&
          brightness < 220;

        if (isValidSkin) {
          skinLikePixels++;
        }

        // Dark areas (could be hair, eyes, etc.) - more lenient
        if (brightness < 100) {
          // Simpler dark detection
          darkPixels++;
        }

        // Edge detection for texture
        if (x > 0 && y > 0) {
          const prevPixelIndex = (y * width + (x - 1)) * 4;
          const upPixelIndex = ((y - 1) * width + x) * 4;

          if (
            prevPixelIndex + 2 < data.length &&
            upPixelIndex + 2 < data.length
          ) {
            const prevBrightness =
              (data[prevPixelIndex] +
                data[prevPixelIndex + 1] +
                data[prevPixelIndex + 2]) /
              3;
            const upBrightness =
              (data[upPixelIndex] +
                data[upPixelIndex + 1] +
                data[upPixelIndex + 2]) /
              3;

            if (
              Math.abs(brightness - prevBrightness) > 20 ||
              Math.abs(brightness - upBrightness) > 20
            ) {
              edgePixels++;
            }
          }
        }

        // Uniform background detection (static backgrounds have low variance)
        if (
          Math.abs(r - g) < 10 &&
          Math.abs(g - b) < 10 &&
          Math.abs(r - b) < 10
        ) {
          uniformPixels++;
        }

        // Center region activity
        const centerX = width / 2;
        const centerY = height / 2;
        const distanceFromCenter = Math.sqrt(
          (x - centerX) ** 2 + (y - centerY) ** 2
        );

        if (distanceFromCenter < Math.min(width, height) * 0.3) {
          centerActivity++;
        }

        // Motion detection - compare with previous frame
        if (canCompareFrames && lastFrame) {
          const lastPixelIndex = (y * width + x) * 4;
          if (lastPixelIndex + 3 < lastFrame.data.length) {
            const lastR = lastFrame.data[lastPixelIndex];
            const lastG = lastFrame.data[lastPixelIndex + 1];
            const lastB = lastFrame.data[lastPixelIndex + 2];

            const colorDiff =
              Math.abs(r - lastR) + Math.abs(g - lastG) + Math.abs(b - lastB);
            if (colorDiff > 30) {
              // Threshold for motion
              motionPixels++;
            }
          }
        }

        totalSamples++;
      }
    }

    if (totalSamples === 0) {
      console.warn("⚠️ No samples processed");
      return {
        faceDetected: false,
        eyesDetected: false,
        lookingAtCamera: false,
      };
    }

    const avgBrightness = totalBrightness / totalSamples;
    const avgVariance = varianceSum / totalSamples;
    const skinRatio = skinLikePixels / totalSamples;
    const darkRatio = darkPixels / totalSamples;
    const centerRatio = centerActivity / totalSamples;
    const motionRatio = motionPixels / totalSamples;
    const edgeRatio = edgePixels / totalSamples;
    const uniformRatio = uniformPixels / totalSamples;

    // Track if frame looks like empty background
    const looksEmpty =
      uniformRatio > 0.8 || (avgVariance < 15 && skinRatio < 0.02);

    // Store current frame for next comparison
    lastFrameDataRef.current = new ImageData(
      new Uint8ClampedArray(data),
      width,
      height
    );

    // Properly balanced detection - strict enough to detect absence, lenient enough for presence
    const hasActivity = avgVariance > 20; // Moderate threshold for activity
    const hasWarmTones = skinRatio > 0.05; // At least 5% warm/skin tones
    const hasDarkAreas = darkRatio > 0.08; // At least 8% dark areas (eyes, hair)
    const hasCenterActivity = centerRatio > 0.12; // Activity in center (face positioning)
    const hasEdges = edgeRatio > 0.12; // Need texture/edges for a person
    const notTooUniform = uniformRatio < 0.75; // Not too much uniform background
    const goodLighting = avgBrightness > 30 && avgBrightness < 190; // Good lighting range
    const hasEnoughContrast = avgVariance > 20; // Moderate contrast requirement

    // Require multiple conditions to be true AND not look empty
    const faceDetected =
      hasWarmTones &&
      hasActivity &&
      goodLighting &&
      hasEnoughContrast &&
      notTooUniform &&
      !looksEmpty;
    const eyesDetected = faceDetected && hasDarkAreas;
    const lookingAtCamera = eyesDetected && hasCenterActivity;

    // Test mode disabled - using real detection
    const testMode = false;

    // More frequent logging for debugging detection issues
    if (Math.random() < 0.5) {
      // 50% of the time for debugging
      console.log("🔍 Detection Analysis:", {
        results: {
          face: faceDetected ? "✅ DETECTED" : "❌ NOT FOUND",
          eyes: eyesDetected ? "👀 DETECTED" : "❌ NOT FOUND",
          contact: lookingAtCamera ? "🎯 LOOKING" : "👀 AWAY",
        },
        metrics: {
          brightness: avgBrightness.toFixed(1),
          variance: avgVariance.toFixed(1),
          skin: (skinRatio * 100).toFixed(1) + "%",
          dark: (darkRatio * 100).toFixed(1) + "%",
          center: (centerRatio * 100).toFixed(1) + "%",
          motion: (motionRatio * 100).toFixed(1) + "%",
          edges: (edgeRatio * 100).toFixed(1) + "%",
          uniform: (uniformRatio * 100).toFixed(1) + "%",
        },
        checks: {
          hasActivity: hasActivity ? "✅" : "❌",
          hasWarmTones: hasWarmTones ? "✅" : "❌",
          hasDarkAreas: hasDarkAreas ? "✅" : "❌",
          hasCenterActivity: hasCenterActivity ? "✅" : "❌",
          hasEdges: hasEdges ? "✅" : "❌",
          notTooUniform: notTooUniform ? "✅" : "❌",
          goodLighting: goodLighting ? "✅" : "❌",
          hasContrast: hasEnoughContrast ? "✅" : "❌",
          notEmpty: !looksEmpty ? "✅" : "❌",
        },
      });
    }

    return { faceDetected, eyesDetected, lookingAtCamera };
  };

  // Enhanced tab switching detection
  useEffect(() => {
    if (!enabled) return;

    let isUserAway = false;
    let awayStartTime = 0;
    let warningTimeout: NodeJS.Timeout | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (!isUserAway) {
          isUserAway = true;
          awayStartTime = Date.now();

          // Give immediate warning for tab switching
          warningTimeout = setTimeout(() => {
            if (isUserAway) {
              addWarning("tab-switch");
            }
          }, 500);
        }
      } else {
        if (isUserAway) {
          isUserAway = false;
          if (warningTimeout) {
            clearTimeout(warningTimeout);
            warningTimeout = null;
          }

          const awayDuration = Date.now() - awayStartTime;
          // If away for more than 1 second, still count as violation
          if (awayDuration > 1000) {
            addWarning("tab-switch");
          }
        }
      }
    };

    const handleFocus = () => {
      if (isUserAway && !document.hidden) {
        isUserAway = false;
        if (warningTimeout) {
          clearTimeout(warningTimeout);
          warningTimeout = null;
        }
      }
    };

    const handleBlur = () => {
      if (!isUserAway) {
        isUserAway = true;
        awayStartTime = Date.now();

        // Immediate warning for window blur
        warningTimeout = setTimeout(() => {
          if (isUserAway) {
            addWarning("tab-switch");
          }
        }, 500); // Even faster warning for blur
      }
    };

    // Enhanced keyboard shortcut prevention
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Alt+Tab, Ctrl+Tab, F12 (DevTools), etc.
      const blockedKeys = [
        e.altKey && e.code === "Tab",
        e.ctrlKey && e.code === "Tab",
        e.ctrlKey && e.shiftKey && e.code === "Tab",
        e.code === "F12",
        e.ctrlKey && e.shiftKey && e.code === "KeyI", // DevTools
        e.ctrlKey && e.shiftKey && e.code === "KeyJ", // DevTools Console
        e.ctrlKey && e.shiftKey && e.code === "KeyC", // DevTools Inspect
        e.ctrlKey && e.code === "KeyU", // View Source
        e.ctrlKey && e.code === "KeyS", // Save Page
        e.ctrlKey && e.code === "KeyP", // Print
        e.ctrlKey && e.code === "KeyR", // Refresh
        e.ctrlKey && e.shiftKey && e.code === "KeyR", // Hard Refresh
        e.code === "F5", // Refresh
        e.ctrlKey && e.shiftKey && e.code === "Delete", // Clear Data
        e.altKey && e.code === "F4", // Close Window
      ];

      if (blockedKeys.some((blocked) => blocked)) {
        e.preventDefault();
        e.stopPropagation();
        addWarning("tab-switch");
        toast.error("⚠️ This action is not allowed during the interview!");
        return false;
      }
    };

    // Enhanced context menu prevention
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addWarning("tab-switch");
      toast.error("⚠️ Right-click is disabled during interview!");
      return false;
    };

    // Mouse leave detection (user moving to other applications)
    const handleMouseLeave = (e: MouseEvent) => {
      // If mouse leaves the window area completely
      if (
        e.clientY <= 0 ||
        e.clientX <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight
      ) {
        if (!isUserAway) {
          isUserAway = true;
          awayStartTime = Date.now();

          warningTimeout = setTimeout(() => {
            if (isUserAway) {
              addWarning("tab-switch");
            }
          }, 2000); // 2 seconds for mouse leave
        }
      }
    };

    const handleMouseEnter = () => {
      if (isUserAway) {
        isUserAway = false;
        if (warningTimeout) {
          clearTimeout(warningTimeout);
          warningTimeout = null;
        }
      }
    };

    // Add all event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("keydown", handleKeyDown, true); // Use capture phase
    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // Cleanup
    return () => {
      if (warningTimeout) clearTimeout(warningTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [enabled, addWarning]);

  // Simple camera monitoring
  const startCameraMonitoring = useCallback(async () => {
    if (!enabled || isMonitoring) {
      return;
    }

    try {
      // Get camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Video timeout")),
            10000
          );

          video.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve();
          };

          video.onerror = () => {
            clearTimeout(timeout);
            reject(new Error("Video error"));
          };
        });

        await video.play();
        setIsMonitoring(true);

        // Start detection after a short delay
        setTimeout(() => {
          const runDetection = () => {
            const currentVideo = videoRef.current;
            const currentCanvas = canvasRef.current;

            if (!currentVideo || !currentCanvas) return;

            const ctx = currentCanvas.getContext("2d");
            if (
              !ctx ||
              currentVideo.readyState < 2 ||
              currentVideo.videoWidth === 0
            )
              return;

            try {
              // Draw current frame
              currentCanvas.width = currentVideo.videoWidth;
              currentCanvas.height = currentVideo.videoHeight;
              ctx.drawImage(currentVideo, 0, 0);

              // Test: Draw a small indicator to show canvas is working
              ctx.fillStyle = "red";
              ctx.fillRect(0, 0, 10, 10);

              // Get image data
              const imageData = ctx.getImageData(
                0,
                0,
                currentCanvas.width,
                currentCanvas.height
              );

              // Quick sanity check
              const samplePixel = imageData.data.slice(0, 12); // First 3 pixels
              console.log("� Frame captured:", {
                size: `${currentCanvas.width}x${currentCanvas.height}`,
                dataSize: imageData.data.length,
                samplePixels: Array.from(samplePixel),
              });

              // Run detection
              const detection = detectFaceAndGaze(imageData);

              // Update status with real detection results
              setDetectionStatus(detection);

              // Handle violations with responsive timeouts
              if (!detection.faceDetected) {
                if (!lookAwayTimeoutRef.current) {
                  lookAwayTimeoutRef.current = setTimeout(() => {
                    addWarning("camera-look-away");
                    lookAwayTimeoutRef.current = null;
                  }, 5000); // 5 seconds for no face detected
                }
              } else if (!detection.eyesDetected) {
                if (!lookAwayTimeoutRef.current) {
                  lookAwayTimeoutRef.current = setTimeout(() => {
                    addWarning("camera-look-away");
                    lookAwayTimeoutRef.current = null;
                  }, 7000); // 7 seconds for no eyes detected
                }
              } else if (!detection.lookingAtCamera) {
                if (!lookAwayTimeoutRef.current) {
                  lookAwayTimeoutRef.current = setTimeout(() => {
                    addWarning("camera-look-away");
                    lookAwayTimeoutRef.current = null;
                  }, 10000); // 10 seconds for not looking at camera
                }
              } else {
                // Clear timeout if everything is detected properly
                if (lookAwayTimeoutRef.current) {
                  clearTimeout(lookAwayTimeoutRef.current);
                  lookAwayTimeoutRef.current = null;
                }
              }

              // Log detection status occasionally
              if (Math.random() < 0.05) {
                // Only log 5% of the time
                console.log("Detection status:", detection);
              }
            } catch (error) {
              console.error("Detection error:", error);
            }
          };

          detectionIntervalRef.current = setInterval(runDetection, 500); // Check every 500ms for more responsive detection
        }, 2000);

        console.log("📹 Camera monitoring started successfully");
      } else {
        throw new Error("Video element not found");
      }
    } catch (error) {
      console.error("Camera error:", error);

      const errorName = (error as any)?.name || "";
      console.warn("Camera error:", errorName);
      // Silently continue without camera - only show toast on user action

      setIsMonitoring(true); // Enable tab monitoring anyway
    }
  }, [enabled]); // Remove isMonitoring and addWarning from dependencies

  const stopCameraMonitoring = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    if (lookAwayTimeoutRef.current) {
      clearTimeout(lookAwayTimeoutRef.current);
      lookAwayTimeoutRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }

    setIsMonitoring(false);
    setDetectionStatus({
      faceDetected: false,
      eyesDetected: false,
      lookingAtCamera: false,
    });
  }, []); // No dependencies to avoid loops

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Direct cleanup without calling the callback
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (lookAwayTimeoutRef.current) {
        clearTimeout(lookAwayTimeoutRef.current);
      }
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []); // Empty dependency array for cleanup only

  return {
    warningCount,
    isMonitoring,
    detectionStatus,
    videoRef,
    canvasRef,
    startCameraMonitoring,
    stopCameraMonitoring,
  };
};
