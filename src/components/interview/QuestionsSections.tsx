"use client";
import { Lightbulb, Volume2, HelpCircle } from "lucide-react";
import React from "react";

interface Props {
  mockInterviewQuestion: any[];
  activeQuestionIndex: number;
  setActiveQuestionIndex: (index: number) => void;
}

const QuestionsSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  setActiveQuestionIndex,
}: Props) => {
  const textToSpeech = (text: string) => {
    if ("speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(speech);
    } else {
      alert("Sorry, your browser doesn't support text-to-speech");
    }
  };

  return (
    mockInterviewQuestion && (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex flex-wrap gap-3 mb-6">
          {mockInterviewQuestion.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveQuestionIndex(index)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                activeQuestionIndex === index
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <HelpCircle className="text-blue-600" size={20} />
            Current Question
          </h2>
          <div className="flex items-start justify-between">
            <p className="text-gray-700 text-base">
              {mockInterviewQuestion[activeQuestionIndex]?.text}
            </p>
            <button
              onClick={() =>
                textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.text)
              }
              className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-100"
              aria-label="Read question aloud"
            >
              <Volume2 size={20} />
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-100">
          <div className="flex items-center gap-3 text-yellow-700 mb-2">
            <Lightbulb size={20} />
            <h3 className="font-medium">Pro Tip</h3>
          </div>
          <p className="text-yellow-700 text-sm">
            {process.env.NEXT_PUBLIC_QUESTION_NOTE ||
              "Click on Record Answer when you want to answer the question. At the end of the interview we will give you the feedback along with correct answer for each of the question and your answer to compare it"}
          </p>
        </div>
      </div>
    )
  );
};

export default QuestionsSection;
