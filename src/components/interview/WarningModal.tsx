import React from "react";
import { AlertTriangle, Camera, Eye } from "lucide-react";
import { Button } from "../ui/button";

interface WarningModalProps {
  isOpen: boolean;
  warningType: "tab-switch" | "camera-look-away";
  warningCount: number;
  maxWarnings: number;
  onAcknowledge: () => void;
}

const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  warningType,
  warningCount,
  maxWarnings,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  const getWarningIcon = () => {
    switch (warningType) {
      case "tab-switch":
        return <Camera className="w-16 h-16 text-red-500" />;
      case "camera-look-away":
        return <Eye className="w-16 h-16 text-red-500" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-red-500" />;
    }
  };

  const getWarningTitle = () => {
    switch (warningType) {
      case "tab-switch":
        return "Tab Switching Detected";
      case "camera-look-away":
        return "Looking Away from Camera";
      default:
        return "Interview Violation";
    }
  };

  const getWarningDescription = () => {
    switch (warningType) {
      case "tab-switch":
        return "You switched tabs or left the interview window. This is not allowed during the interview.";
      case "camera-look-away":
        return "You looked away from the camera for an extended period. Please maintain eye contact with the camera.";
      default:
        return "A violation of interview rules was detected.";
    }
  };

  const remainingWarnings = maxWarnings - warningCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="flex justify-center mb-4">{getWarningIcon()}</div>

          {/* Warning Title */}
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            {getWarningTitle()}
          </h2>

          {/* Warning Count */}
          <div className="mb-4">
            <span className="text-lg font-semibold text-red-700">
              Warning {warningCount} of {maxWarnings}
            </span>
          </div>

          {/* Warning Description */}
          <p className="text-gray-700 mb-4">{getWarningDescription()}</p>

          {/* Remaining Warnings */}
          <div
            className={`p-3 rounded-lg mb-4 ${
              remainingWarnings === 1
                ? "bg-red-100 border border-red-300"
                : "bg-orange-100 border border-orange-300"
            }`}
          >
            <p
              className={`font-medium ${
                remainingWarnings === 1 ? "text-red-700" : "text-orange-700"
              }`}
            >
              {remainingWarnings === 1
                ? "⚠️ Final Warning: One more violation will terminate the interview!"
                : `${remainingWarnings} warnings remaining before termination`}
            </p>
          </div>

          {/* Rules Reminder */}
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">
              Interview Rules:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Do not switch tabs or leave the interview window</li>
              <li>• Maintain eye contact with the camera</li>
              <li>• Do not use external resources or help</li>
              <li>• Stay focused on the interview questions</li>
            </ul>
          </div>

          {/* Acknowledge Button */}
          <Button
            onClick={onAcknowledge}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            I Understand - Continue Interview
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WarningModal;
