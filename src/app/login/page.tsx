"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      console.log("Attempting login with:", { email });

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        // Store the token in localStorage
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        console.log("Login successful, redirecting...");
        router.push("/home/dashboard");
      } else {
        setErrorMessage(data.message || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white bg-opacity-20">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">Login to your account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email below to login to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <a href="/forgot-password" className="text-xs hover:underline">
                Forgot your password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              className="p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {errorMessage && (
            <p className="text-red-500 text-sm font-medium">{errorMessage}</p>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full p-2 rounded-lg text-white font-medium ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-800"
              }`}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="w-full p-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              Continue with Google
            </button>
          </div>

          <p className="text-center text-sm mt-2">
            New here?{" "}
            <a href="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
