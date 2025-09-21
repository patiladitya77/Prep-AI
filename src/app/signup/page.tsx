"use client";
import React, { useState } from "react";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("SignUp flow", { name, email, password });
    // Add your signup logic here
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white bg-opacity-20">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">Create an account</h2>
          <p className="text-sm text-gray-500 mt-1">
            Sign up with your details to get started
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="p-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
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
              className="w-full p-2 bg-black text-white rounded-lg"
            >
              Sign Up
            </button>
            <button
              type="button"
              className="w-full p-2 border rounded-lg hover:bg-gray-100"
            >
              Continue with Google
            </button>
          </div>

          <p className="text-center text-sm mt-2">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
