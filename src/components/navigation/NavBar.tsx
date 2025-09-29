"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

// Import your NavBar component
const NavBar = () => {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleGoToSignup = () => {
    router.push("/signup");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      logout();
      setShowDropdown(false);
      router.push("/");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
            href="/home/analytics"
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

        {/* Auth Buttons / User Avatar */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            // Show user avatar and dropdown when logged in
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name
                    ? getInitials(user.name)
                    : user?.email?.[0].toUpperCase() || "U"}
                </div>

                <svg
                  className="w-4 h-4 text-gray-500"
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

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.name}
                    </p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                  </div>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // Show login/signup buttons when not logged in
            <>
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
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
