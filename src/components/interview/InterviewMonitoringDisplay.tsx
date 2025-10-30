import React from "react";
import { AlertTriangle, Camera, Shield } from "lucide-react";

interface InterviewMonitoringDisplayProps {
  warningCount: number;
  maxWarnings: number;
  isMonitoring: boolean;
  detectionStatus?: {
    faceDetected: boolean;
    eyesDetected: boolean;
    lookingAtCamera: boolean;
  };
}

const InterviewMonitoringDisplay: React.FC<InterviewMonitoringDisplayProps> = ({
  warningCount,
  maxWarnings,
  isMonitoring,
  detectionStatus,
}) => {
  const getWarningColor = () => {
    if (warningCount === 0) return "text-green-600";
    if (warningCount === 1) return "text-yellow-600";
    if (warningCount === 2) return "text-orange-600";
    return "text-red-600";
  };

  const getWarningBgColor = () => {
    if (warningCount === 0) return "bg-green-50 border-green-200";
    if (warningCount === 1) return "bg-yellow-50 border-yellow-200";
    if (warningCount === 2) return "bg-orange-50 border-orange-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="hidden">
      {/* Monitoring Status is now hidden */}
      <div
        className={`mb-2 p-2 rounded-lg border shadow-lg ${getWarningBgColor()}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className={`w-4 h-4 ${getWarningColor()}`} />
          <span className={`font-medium text-sm ${getWarningColor()}`}>
            Interview Monitoring Active
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <Camera
              className={`w-3 h-3 ${
                isMonitoring ? "text-green-500" : "text-red-500"
              }`}
            />
            <span className={isMonitoring ? "text-green-600" : "text-red-600"}>
              {isMonitoring ? "Camera Active" : "Camera Inactive"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <AlertTriangle className={`w-3 h-3 ${getWarningColor()}`} />
            <span className={getWarningColor()}>
              {warningCount}/{maxWarnings} Warnings
            </span>
          </div>
        </div>

        {/* Enhanced Detection Status */}
        {detectionStatus && isMonitoring && (
          <div className="mt-2 text-xs border-t border-gray-200 pt-2">
            <div className="font-medium text-gray-700 mb-1 text-xs">
              🎯 Detection Status:
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      detectionStatus.faceDetected
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span
                    className={
                      detectionStatus.faceDetected
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    Face Detection
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    detectionStatus.faceDetected
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {detectionStatus.faceDetected ? "✓" : "✗"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      detectionStatus.eyesDetected
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span
                    className={
                      detectionStatus.eyesDetected
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    Eye Detection
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    detectionStatus.eyesDetected
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {detectionStatus.eyesDetected ? "✓" : "✗"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      detectionStatus.lookingAtCamera
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  ></div>
                  <span
                    className={
                      detectionStatus.lookingAtCamera
                        ? "text-green-600"
                        : "text-amber-600"
                    }
                  >
                    👁️ Eye Contact
                  </span>
                </div>
                <span
                  className={`font-bold ${
                    detectionStatus.lookingAtCamera
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}
                >
                  {detectionStatus.lookingAtCamera ? "✓" : "⚠"}
                </span>
              </div>
            </div>

            {/* Helpful hints */}
            <div className="mt-2 pt-1 border-t border-gray-100">
              {!detectionStatus.faceDetected && (
                <div className="text-red-500 text-xs italic">
                  💡 Please position yourself in front of camera
                </div>
              )}

              {detectionStatus.faceDetected &&
                !detectionStatus.eyesDetected && (
                  <div className="text-amber-500 text-xs italic">
                    💡 Improve lighting or remove glasses/hat
                  </div>
                )}

              {detectionStatus.eyesDetected &&
                !detectionStatus.lookingAtCamera && (
                  <div className="text-amber-500 text-xs italic">
                    💡 Look directly at the camera
                  </div>
                )}

              {detectionStatus.faceDetected &&
                detectionStatus.eyesDetected &&
                detectionStatus.lookingAtCamera && (
                  <div className="text-green-600 text-xs font-medium">
                    ✅ Perfect! All systems tracking
                  </div>
                )}
            </div>
          </div>
        )}

        {warningCount > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            {maxWarnings - warningCount} warnings remaining before termination
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewMonitoringDisplay;
