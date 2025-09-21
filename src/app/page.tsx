"use client";

import NavBar from "@/components/NavBar";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <NavBar />

      <div className="min-h-screen bg-gray-50">
        <AnimatePresence>
          <div className="relative">
            {/* Main Hero Section */}
            <div className="pt-32 pb-20 px-6">
              <div className="max-w-7xl mx-auto">
                {/* Announcement Banner */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="flex justify-center mb-8"
                >
                  <div className="bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                    <span className="text-sm text-gray-600">
                      Introducing AI Mock Interviews
                    </span>
                    <span className="ml-2 text-sm text-blue-600 hover:text-blue-700 cursor-pointer">
                      Read more →
                    </span>
                  </div>
                </motion.div>

                {/* Main Headline */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-center text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6"
                >
                  Turn interviews into{" "}
                  <span className="text-blue-600">success</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-center text-xl text-gray-600 max-w-3xl mx-auto mb-12"
                >
                  PrepAI is the modern platform for tech interview preparation,
                  AI-powered practice sessions, and career advancement.
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
                >
                  <button className="bg-black text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors">
                    Start for free
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        "https://github.com/patiladitya77/Prep-AI",
                        "_blank"
                      )
                    }
                    className="border border-gray-300 text-gray-700 px-8 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    GitHub
                  </button>
                </motion.div>

                {/* Feature Pills */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="flex flex-wrap justify-center gap-4 mb-20"
                >
                  <div className="bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm flex items-center">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-700">
                      AI Mock Interviews
                    </span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-700">
                      Performance Analytics
                    </span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium text-gray-700">
                      Career Programs
                    </span>
                  </div>
                </motion.div>

                {/* Dashboard Preview */}
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.8 }}
                  className="relative max-w-6xl mx-auto"
                >
                  <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Mock Dashboard Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="font-semibold text-gray-900">
                          InterviewAI
                        </div>
                        <div className="text-sm text-gray-500">
                          Mock Interviews
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                    </div>

                    {/* Mock Dashboard Content */}
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-blue-50 p-6 rounded-lg">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Interviews Completed
                          </h3>
                          <p className="text-3xl font-bold text-blue-600">
                            127
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            +23% from last month
                          </p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Success Rate
                          </h3>
                          <p className="text-3xl font-bold text-green-600">
                            89%
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Above average
                          </p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            Skills Improved
                          </h3>
                          <p className="text-3xl font-bold text-purple-600">
                            15
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            Algorithms, System Design
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-4">
                          Recent Interview Sessions
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-white p-3 rounded">
                            <span className="text-gray-700">
                              Software Engineer - Google
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                              Passed
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white p-3 rounded">
                            <span className="text-gray-700">
                              Frontend Developer - Meta
                            </span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              In Review
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-white p-3 rounded">
                            <span className="text-gray-700">
                              Full Stack - Amazon
                            </span>
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                              Passed
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Companies Footer */}
            <div className="bg-gray-900 py-6">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-center space-x-8 md:space-x-12 text-white/60">
                  <span className="text-sm">Interview questions from</span>
                  <div className="flex items-center space-x-6 md:space-x-8">
                    <span className="font-semibold">Google</span>
                    <span className="font-semibold">Meta</span>
                    <span className="font-semibold">Apple</span>
                    <span className="font-semibold">Amazon</span>
                    <span className="font-semibold hidden md:inline">
                      Microsoft
                    </span>
                    <span className="font-semibold hidden md:inline">
                      Netflix
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatePresence>
      </div>
    </>
  );
}
