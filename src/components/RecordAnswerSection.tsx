import { useEffect, useRef, useState } from "react";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic, StopCircle, Circle, Video, VideoOff } from "lucide-react";
import Webcam from "react-webcam";
import { Button } from "./ui/button";

const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
}) => {
  const webcamRef = useRef(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [loading, setLoading] = useState(false);

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
    setUserAnswer(results.map((r) => r.transcript).join(" "));
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
    try {
      //**logic:- create a promt and add user answeer and ask llm to give rating and feeback, make that feedback in required format and store in db */
    } catch (error) {
      console.error("Error:", error);
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
              Recording
            </span>
          ) : (
            "Your Response"
          )}
        </h2>
        <button
          onClick={() => setIsVideoOn(!isVideoOn)}
          className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100"
        >
          {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden mb-4 aspect-video">
        {isVideoOn ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored={true}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <VideoOff size={48} className="text-gray-600" />
          </div>
        )}
      </div>

      <div className="mb-4 min-h-20 p-3 bg-gray-50 rounded-lg">
        {userAnswer ? (
          <p className="text-gray-700">{userAnswer}</p>
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
