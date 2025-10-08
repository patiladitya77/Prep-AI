import React, { useState, useRef, useEffect } from "react";

type AvatarVariant = "professional_female" | "professional_male";

interface AvatarProps {
  text: string;
  autoSpeak?: boolean;
  variant?: AvatarVariant;
  onVariantChange?: (v: AvatarVariant) => void;
  imageUrl?: string | null;
  isFirstQuestion?: boolean;
}

const getAvatarImage = (variant: AvatarVariant): string => {
  switch (variant) {
    case "professional_female":
      return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face&auto=format&q=80";
    case "professional_male":
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face&auto=format&q=80";
    default:
      return "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=face&auto=format&q=80";
  }
};

const Avatar: React.FC<AvatarProps> = ({
  text,
  autoSpeak = true,
  variant = "professional_female",
  onVariantChange,
  imageUrl = null,
  isFirstQuestion = false,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!autoSpeak || !text) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    // Ensure voices are loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        // Voices are now loaded, continue with speech
      });
    }

    // Add 5-second delay for the first question, 1 second for others
    const delay = isFirstQuestion ? 5000 : 1000;

    const timer = setTimeout(() => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;

      // Select appropriate voice based on variant
      const voices = window.speechSynthesis.getVoices();
      // debug: available voices suppressed
      // console.log(
      //   "Available voices:",
      //   voices.map((v) => ({ name: v.name, lang: v.lang }))
      // );

      if (variant === "professional_female") {
        // Find female voice (look for female names or voices that include 'female')
        const femaleVoice =
          voices.find(
            (voice) =>
              voice.name.toLowerCase().includes("female") ||
              voice.name.toLowerCase().includes("woman") ||
              voice.name.toLowerCase().includes("zira") ||
              voice.name.toLowerCase().includes("hazel") ||
              voice.name.toLowerCase().includes("susan") ||
              voice.name.toLowerCase().includes("samantha") ||
              voice.name.toLowerCase().includes("cortana") ||
              voice.name.toLowerCase().includes("eva")
          ) ||
          voices.find(
            (voice) =>
              voice.lang.startsWith("en") &&
              !voice.name.toLowerCase().includes("male")
          );

        if (femaleVoice) {
          u.voice = femaleVoice;
          // console.log("Selected female voice:", femaleVoice.name);
        } else {
          // console.log("No female voice found, using default");
        }
        u.pitch = 1.3; // Higher pitch for female voice
      } else {
        // Find male voice
        const maleVoice =
          voices.find(
            (voice) =>
              voice.name.toLowerCase().includes("male") ||
              voice.name.toLowerCase().includes("david") ||
              voice.name.toLowerCase().includes("mark") ||
              voice.name.toLowerCase().includes("daniel")
          ) || voices.find((voice) => voice.lang.includes("en"));

        if (maleVoice) {
          u.voice = maleVoice;
          // console.log("Selected male voice:", maleVoice.name);
        } else {
          // console.log("No male voice found, using default");
        }
        u.pitch = 0.8; // Lower pitch for male voice
      }

      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    }, delay);

    return () => {
      if (timer) clearTimeout(timer);
      if (utterRef.current) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [text, autoSpeak, isFirstQuestion, variant]);

  const replay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.9;

    // Select appropriate voice based on variant
    const voices = window.speechSynthesis.getVoices();
    // console.log(
    //   "Replay - Available voices:",
    //   voices.map((v) => ({ name: v.name, lang: v.lang }))
    // );

    if (variant === "professional_female") {
      // Find female voice
      const femaleVoice =
        voices.find(
          (voice) =>
            voice.name.toLowerCase().includes("female") ||
            voice.name.toLowerCase().includes("woman") ||
            voice.name.toLowerCase().includes("zira") ||
            voice.name.toLowerCase().includes("hazel") ||
            voice.name.toLowerCase().includes("susan") ||
            voice.name.toLowerCase().includes("samantha") ||
            voice.name.toLowerCase().includes("cortana") ||
            voice.name.toLowerCase().includes("eva")
        ) ||
        voices.find(
          (voice) =>
            voice.lang.startsWith("en") &&
            !voice.name.toLowerCase().includes("male")
        );

      if (femaleVoice) {
        u.voice = femaleVoice;
        // console.log("Replay - Selected female voice:", femaleVoice.name);
      } else {
        // console.log("Replay - No female voice found, using default");
      }
      u.pitch = 1.3; // Higher pitch for female voice
    } else {
      // Find male voice
      const maleVoice =
        voices.find(
          (voice) =>
            voice.name.toLowerCase().includes("male") ||
            voice.name.toLowerCase().includes("david") ||
            voice.name.toLowerCase().includes("mark") ||
            voice.name.toLowerCase().includes("daniel")
        ) || voices.find((voice) => voice.lang.includes("en"));

      if (maleVoice) {
        u.voice = maleVoice;
        // console.log("Replay - Selected male voice:", maleVoice.name);
      } else {
        // console.log("Replay - No male voice found, using default");
      }
      u.pitch = 0.8; // Lower pitch for male voice
    }

    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    utterRef.current = u;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="flex items-start gap-6 w-full">
      {/* Avatar Image - Left Side */}
      <div className="flex-shrink-0">
        <div className="relative w-36 h-36">
          <img
            src={imageUrl || getAvatarImage(variant)}
            alt="Professional Interviewer"
            className={`w-full h-full object-cover rounded-full border-4 shadow-xl transition-all duration-500 ${
              isSpeaking
                ? "border-green-400 shadow-green-200 scale-105"
                : "border-blue-300 hover:border-blue-400"
            }`}
          />

          {/* Speaking indicator */}
          {isSpeaking && (
            <div className="absolute -inset-2 rounded-full border-2 border-green-400 animate-ping opacity-75"></div>
          )}

          {/* Status indicator */}
          <div
            className={`absolute top-0 right-0 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-colors ${
              isSpeaking ? "bg-green-500 animate-pulse" : "bg-blue-500"
            }`}
          ></div>

          {/* Professional badge */}
          <div className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-2 py-1 rounded-full shadow-lg">
            INTERVIEWER
          </div>
        </div>

        {/* Interviewer info */}
        <div className="mt-3 text-center">
          <div className="text-sm font-semibold text-gray-800">
            {variant === "professional_female"
              ? "Sarah Johnson"
              : "Michael Chen"}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            {isSpeaking ? "🎤 Speaking..." : "Senior Interviewer"}
          </div>

          {/* Avatar Selection */}
          <select
            value={variant}
            onChange={(e) =>
              onVariantChange &&
              onVariantChange(e.target.value as AvatarVariant)
            }
            className="text-xs px-2 py-1 border rounded bg-white hover:bg-gray-50 transition-colors w-full max-w-24"
          >
            <option value="professional_female">👩‍💼 Sarah</option>
            <option value="professional_male">👨‍💼 Michael</option>
          </select>
        </div>
      </div>

      {/* Question Panel - Right Side */}
      <div className="flex-1">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-6 shadow-lg h-full">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xl font-bold text-gray-800">
                  Interview in Progress
                </div>
                {isSpeaking && (
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: "100ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                      style={{ animationDelay: "200ms" }}
                    ></div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {isSpeaking
                  ? `${
                      variant === "professional_female" ? "Sarah" : "Michael"
                    } is asking you a question...`
                  : "Listen to the question and think about your response"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={replay}
                disabled={isSpeaking}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSpeaking
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
              >
                {isSpeaking ? "Speaking..." : "🔄 Repeat Question"}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-900 leading-relaxed">
            <div
              className={`p-5 rounded-xl border-l-4 transition-all ${
                isSpeaking
                  ? "bg-green-50 border-green-500 shadow-md"
                  : "bg-white border-blue-500 shadow-sm"
              }`}
            >
              <div className="font-semibold mb-2 text-gray-700">Question:</div>
              <div className="text-gray-800">{text}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Avatar;
