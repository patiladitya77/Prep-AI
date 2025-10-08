"use client";
import { Lightbulb, Volume2, HelpCircle } from "lucide-react";
import React from "react";

interface Props {
  mockInterviewQuestion: any[];
  activeQuestionIndex: number;
  setActiveQuestionIndex: (index: number) => void;
  answers?: Record<string, any>;
}

const QuestionsSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  setActiveQuestionIndex,
  answers = {},
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
          {mockInterviewQuestion.map((question, index) => {
            const questionId = question._id || question.id;
            const isAnswered = questionId && answers[questionId];
            const isActive = activeQuestionIndex === index;

            // debug: question button state (removed console output)

            // Determine button style based on state
            let buttonClasses =
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ";

            if (isActive) {
              // Current active question - blue
              buttonClasses += "bg-blue-600 text-white shadow-md";
            } else if (isAnswered) {
              // Answered question - green
              buttonClasses += "bg-green-600 text-white shadow-md";
            } else {
              // Unanswered question - gray
              buttonClasses += "bg-gray-100 text-gray-700 hover:bg-gray-200";
            }

            return (
              <button
                key={index}
                onClick={() => setActiveQuestionIndex(index)}
                className={buttonClasses}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* <div className="bg-blue-50 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <HelpCircle className="text-blue-600" size={20} />
            Question Navigation
          </h2>
          <p className="text-gray-600 text-sm">
            Use the numbered buttons above to navigate between questions. The AI
            interviewer will read each question aloud.
          </p>
        </div> */}

        <div className="bg-yellow-50 rounded-lg p-5 border border-yellow-100 mb-0 ">
          <div className="flex items-center gap-3 text-yellow-700 ">
            <Lightbulb size={20} />
            <h3 className="font-medium">Pro Tip</h3>
          </div>
          <p className="text-yellow-700 text-sm ">
            {"Click on Record Answer when you want to answer the question."}
          </p>
        </div>
      </div>
    )
  );
};

export default QuestionsSection;
