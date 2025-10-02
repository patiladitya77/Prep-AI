import React, { useEffect, useRef, useState } from "react";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle, Circle, Video, VideoOff } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "../ui/button";
import toast from "react-hot-toast";

// Define interfaces
interface Question {
  _id: string;
  sessionId: string;
  text: string;
  type: string;
  generatedFrom: string;
  order: number;
}

interface RecordAnswerSectionProps {
  mockInterviewQuestion: Question[];
  activeQuestionIndex: number;
  sessionId: string;
  onAnswerSubmitted?: (answerData: {
    questionId: string;
    answer: string;
  }) => void;
}

// Dynamically import Webcam with no SSR and proper ref forwarding
const Webcam = dynamic(
  () =>
    import("react-webcam").then((mod) => {
      const WebcamComponent = mod.default;
      return React.forwardRef<any, any>((props, ref) => (
        <WebcamComponent {...props} ref={ref} />
      ));
    }),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading camera...</div>
      </div>
    ),
  }
);

const RecordAnswerSection: React.FC<RecordAnswerSectionProps> = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  sessionId,
  onAnswerSubmitted,
}) => {
  const webcamRef = useRef<any>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(
    null
  );

  // Ensure component is mounted on client side
  useEffect(() => {
    setIsMounted(true);
    // Check for camera permissions
    checkCameraPermissions();
  }, []);

  // Clear answer when question changes
  useEffect(() => {
    const currentQuestion = mockInterviewQuestion[activeQuestionIndex];
    if (currentQuestion && currentQuestion._id !== currentQuestionId) {
      setUserAnswer("");
      setResults([]);
      setCurrentQuestionId(currentQuestion._id);
      toast("📋 New question loaded - ready for your answer", {
        icon: "🎯",
        duration: 2000,
      });
    }
  }, [activeQuestionIndex, mockInterviewQuestion, currentQuestionId]);

  const checkCameraPermissions = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Actively request camera permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        // Stop the stream immediately as we just wanted to check permissions
        stream.getTracks().forEach((track) => track.stop());
        setCameraError(null);
        toast.success("📹 Camera access granted successfully");
      } else {
        setCameraError("Camera not supported in this browser");
      }
    } catch (error: any) {
      toast.error("❌ Camera permission error");
      if (error.name === "NotAllowedError") {
        setCameraError(
          "Camera access denied. Please click 'Allow' when prompted for camera access, or check browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (error.name === "NotReadableError") {
        setCameraError("Camera is being used by another application.");
      } else {
        setCameraError(`Camera error: ${error.message}`);
      }
    }
  };

  const toggleVideo = async () => {
    if (!isVideoOn) {
      // When turning camera on, check permissions first
      await checkCameraPermissions();
    }
    setIsVideoOn(!isVideoOn);
  };

  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    if (results && Array.isArray(results)) {
      setUserAnswer(
        results.map((result: any) => result.transcript || result).join(" ")
      );
    }
  }, [results]);

  useEffect(() => {
    if (!isRecording && userAnswer.trim().length > 10) {
      UpdateUserAnswer();
    }
  }, [userAnswer, isRecording]);

  const StartStopRecording = async () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      setUserAnswer("");
      setResults([]);
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    if (!userAnswer.trim() || loading) return;

    // Get current question from props
    const currentQuestion = mockInterviewQuestion[activeQuestionIndex];
    if (!currentQuestion) {
      toast.error("❌ No question available");
      return;
    }

    setLoading(true);
    toast.loading("💭 Processing your answer...", { id: "answer-processing" });

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("❌ Please login to save your answer", {
          id: "answer-processing",
        });
        return;
      }

      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          questionId: currentQuestion._id,
          answer: userAnswer.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        const fallbackMessage = data.data.fallbackMode
          ? " (using temporary storage)"
          : "";

        toast.success(`✅ Answer saved successfully${fallbackMessage}`, {
          id: "answer-processing",
          duration: data.data.fallbackMode ? 4000 : 3000,
        });

        if (data.data.fallbackMode) {
          toast(
            "📝 Using temporary storage. Your answers are saved locally for this session.",
            {
              duration: 5000,
              icon: "ℹ️",
            }
          );
        }

        // Notify parent component about the answer update
        if (onAnswerSubmitted) {
          onAnswerSubmitted({
            questionId: currentQuestion._id,
            answer: userAnswer.trim(),
          });
        }

        // Clear the current answer after successful submission
        setUserAnswer("");
        setResults([]);
      } else {
        toast.error(`❌ ${data.error || "Failed to save answer"}`, {
          id: "answer-processing",
        });
      }
    } catch (error) {
      toast.error("❌ Network error saving answer", {
        id: "answer-processing",
      });
    } finally {
      setLoading(false);
    }
  };

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
        Microphone access is required for this feature. Please enable it in your
        browser settings.
      </div>
    );

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {isRecording ? (
            <span className="flex items-center gap-2">
              <Circle className="text-red-500 animate-pulse" size={12} />
              Recording Answer {activeQuestionIndex + 1}
            </span>
          ) : (
            <span>
              Question {activeQuestionIndex + 1} Response
              {mockInterviewQuestion[activeQuestionIndex] && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (ID:{" "}
                  {mockInterviewQuestion[activeQuestionIndex]._id.slice(-6)})
                </span>
              )}
            </span>
          )}
        </h2>
        <button
          onClick={toggleVideo}
          className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden mb-4 aspect-video">
        {cameraError ? (
          <div className="w-full h-full bg-red-900/20 flex items-center justify-center p-4">
            <div className="text-center">
              <VideoOff size={48} className="text-red-400 mx-auto mb-2" />
              <div className="text-red-300 text-sm">{cameraError}</div>
              <button
                onClick={checkCameraPermissions}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
              >
                Retry Camera
              </button>
            </div>
          </div>
        ) : isMounted && isVideoOn ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={true}
            className="w-full h-full object-cover"
            onUserMediaError={(error: any) => {
              toast.error(
                "❌ Failed to access camera. Please check permissions."
              );
              setCameraError(
                "Failed to access camera. Please check permissions."
              );
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <VideoOff size={48} className="text-gray-600" />
            {!isMounted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-gray-400 text-sm">Loading camera...</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-4 min-h-20 p-3 bg-gray-50 rounded-lg border">
        {userAnswer ? (
          <div>
            <p className="text-gray-700 mb-2">{userAnswer}</p>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              {loading && <span className="animate-pulse">Processing...</span>}
              {!loading && userAnswer.trim().length > 10 && (
                <span className="text-green-600">✓ Ready to submit</span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 italic">
            {isRecording ? "Listening..." : "Your answer will appear here"}
          </p>
        )}
      </div>

      <Button
        onClick={StartStopRecording}
        disabled={loading}
        size="lg"
        className={`w-full gap-2 ${
          isRecording
            ? "bg-red-600 hover:bg-red-700"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isRecording ? (
          <>
            <StopCircle size={18} />
            Stop Recording
          </>
        ) : (
          <>
            <Mic size={18} />
            {loading ? "Processing..." : "Record Answer"}
          </>
        )}
      </Button>
    </div>
  );
};

export default RecordAnswerSection;
