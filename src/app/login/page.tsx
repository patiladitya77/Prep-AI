"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { PageLoading } from "@/components/ui/Loading";

export default function Login() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/home/dashboard");
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading while checking authentication
  if (authLoading) {
    return <PageLoading text="Checking authentication..." />;
  }

  // Don't render login page if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleGoogleLogin = () => {
    toast.loading("Redirecting to Google...", {
      id: "google-login",
    });

    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white bg-opacity-20">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">
            Login to your account
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Continue with Google to access your account
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full p-3 border rounded-lg hover:bg-gray-100 transition-colors font-medium"
        >
          <span className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.16 13.22l7.98 6.19C13.03 13.72 18.06 9.5 24 9.5Z"
                transform="translate(0 4)"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.92 46.98 31.73 46.98 24.55Z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                transform="translate(1 0)"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-5.94 0-10.97-4.22-12.86-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z"
                transform="translate(0 -4)"
              />
            </svg>
            Continue with Google
          </span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-5">
          Sign in securely with your Google account.
        </p>
      </div>
    </div>
  );
}
