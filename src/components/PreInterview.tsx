import { useRouter } from "next/navigation";
import React from "react";
import { useState } from "react";
import Webcam from "react-webcam";

const PreInterview = ({ id = 123 }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);

  const handleStartInterview = () => {
    router.push(`/interview/${id}?session=active`);
  };
  return (
    <div>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Interview Preparation
          </h1>
          <p className="text-gray-600">
            Review your settings before starting the mock interview
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Interview Details Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-blue-100 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    </span>
                    Interview Details
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-500">
                          Position
                        </h3>
                        <p className="text-lg text-gray-800">
                          Backend developer
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-500">
                          Tech Stack
                        </h3>
                        <p className="text-lg text-gray-800">expressjs</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-500">
                          Experience Level
                        </h3>
                        <p className="text-lg text-gray-800">2 years</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pro Tips Section */}
                <div className="bg-yellow-50 p-6 border-t border-yellow-100">
                  <div className="flex items-center gap-3 text-yellow-700 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="size-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                      />
                    </svg>

                    <h3 className="font-medium">Pro Tip</h3>
                  </div>
                  <p className="text-yellow-700">
                    {
                      "Enable Video Web Cam and Microphone to Start your AI Generated Mock Interview. It has 5 questions which you can answer and at the last you will get the report on the basis of your answer. Note: We never record your video. Web Cam access you can disable at any time you want."
                    }
                  </p>
                </div>
              </div>

              {/* Webcam Setup Card */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-purple-100 p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="size-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                    </span>
                    Camera Setup
                  </h2>

                  <div className="space-y-6">
                    {/* Webcam Preview */}
                    <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                      {webcamEnabled ? (
                        <Webcam
                          mirrored={true}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-6 flex">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="size-6 text-gray-400 mx-2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409"
                            />
                          </svg>

                          <p className="text-gray-400">Camera is disabled</p>
                        </div>
                      )}
                    </div>

                    {/* Webcam Control */}
                    <button
                      onClick={() => setWebcamEnabled(!webcamEnabled)}
                      className="w-full gap-2 border border-gray-200 rounded-md my-6 py-2 shadow-sm cursor-pointer"
                    >
                      {webcamEnabled ? (
                        <>
                          <div className="flex mx-40">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="size-6 mx-2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                              />
                            </svg>
                            <p>Camera On</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex mx-40">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="size-6 mx-2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 0 1-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 0 0-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409"
                              />
                            </svg>
                            <p>Enable Camera</p>
                          </div>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Interview Button */}
            <div className="flex justify-center">
              {/* <Link 
              href={`/dashboard/interview/${params.interviewId}/start`} 
              className="w-full max-w-md"
            > */}
              <button className="w-full gap-2">
                <div
                  className="flex bg-blue-600 w-[40%] rounded-md p-2 text-white mx-auto cursor-pointer"
                  onClick={handleStartInterview}
                >
                  <p className="mx-auto">Begin Interview</p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m8.25 4.5 7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </div>
              </button>
              {/* </Link> */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PreInterview;
