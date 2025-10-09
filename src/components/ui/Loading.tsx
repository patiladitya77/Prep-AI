"use client";

import React from "react";

interface LoadingProps {
  size?: "small" | "medium" | "large" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "skeleton";
  color?: "blue" | "gray" | "white" | "black";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({
  size = "medium",
  variant = "spinner",
  color = "blue",
  text,
  fullScreen = false,
  className = "",
}) => {
  // Size configurations
  const sizeClasses = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12",
    xl: "w-16 h-16",
  };

  // Color configurations
  const colorClasses = {
    blue: "border-blue-600 text-blue-600",
    gray: "border-gray-600 text-gray-600",
    white: "border-white text-white",
    black: "border-black text-black",
  };

  // Spinner component
  const Spinner = () => (
    <div
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );

  // Dots component
  const Dots = () => (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${
            size === "small"
              ? "w-1.5 h-1.5"
              : size === "medium"
              ? "w-2 h-2"
              : size === "large"
              ? "w-3 h-3"
              : "w-4 h-4"
          } bg-current rounded-full animate-bounce`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  // Pulse component
  const Pulse = () => (
    <div
      className={`animate-pulse bg-current rounded ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );

  // Skeleton component
  const Skeleton = () => (
    <div className={`space-y-2 ${className}`}>
      <div className="animate-pulse bg-gray-200 h-4 rounded w-3/4"></div>
      <div className="animate-pulse bg-gray-200 h-4 rounded w-1/2"></div>
      <div className="animate-pulse bg-gray-200 h-4 rounded w-5/6"></div>
    </div>
  );

  // Render appropriate variant
  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return <Dots />;
      case "pulse":
        return <Pulse />;
      case "skeleton":
        return <Skeleton />;
      default:
        return <Spinner />;
    }
  };

  const content = (
    <div
      className={`flex flex-col items-center justify-center ${
        text ? "space-y-3" : ""
      }`}
    >
      <div className={colorClasses[color]}>{renderLoader()}</div>
      {text && (
        <p className={`text-sm font-medium ${colorClasses[color]}`}>{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};

// Pre-configured loading variants for common use cases
export const PageLoading = ({ text = "Loading..." }: { text?: string }) => (
  <Loading size="xl" variant="spinner" color="blue" text={text} fullScreen />
);

export const ButtonLoading = ({
  size = "small",
}: {
  size?: "small" | "medium";
}) => <Loading size={size} variant="spinner" color="white" />;

export const CardLoading = () => <Loading variant="skeleton" className="p-4" />;

export const InlineLoading = ({ text }: { text?: string }) => (
  <Loading size="medium" variant="spinner" color="gray" text={text} />
);

export const DotsLoading = ({
  color = "blue",
}: {
  color?: "blue" | "gray" | "white" | "black";
}) => <Loading variant="dots" color={color} size="medium" />;

export default Loading;
