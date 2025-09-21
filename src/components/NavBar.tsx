"use client";

import { useRouter } from "next/navigation";
import React from "react";

// Import your NavBar component
const NavBar = () => {
  const router = useRouter();
  const handleGoToLogin = () => {
    router.push("/login");
  };
  const handleGoToSignup = () => {
    router.push("/signup");
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="text-xl font-bold text-gray-900">PrepAI</div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-8">
          <div className="relative group">
            <button className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
              Practice
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          <div className="relative group">
            <button className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
              Questions
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          <a
            href="#"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Analytics
          </a>
          <a
            href="#"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Pricing
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-4">
          <button
            className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            onClick={handleGoToLogin}
          >
            Log in
          </button>
          <button
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
            onClick={handleGoToSignup}
          >
            Sign up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
