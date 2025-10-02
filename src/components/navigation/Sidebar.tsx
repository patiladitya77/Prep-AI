"use client";
import Link from "next/link";
import UsageProgress from "../dashboard/UsageProgress";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathName = usePathname();
  return (
    <div className="p-4 space-y-6 text-gray-700 text-sm bg-slate-100 rounded-lg m-2 ">
      <div className="mb-10">
        <div className="text-gray-900 font-semibold mb-4 my-2 text-lg">
          Interview Tools
        </div>
        <ul className="space-y-2">
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            <Link href="/home/dashboard">
              <div
                className={`flex py-2 rounded-md cursor-pointer 
          ${
            pathName.startsWith("/home/dashboard")
              ? "bg-gray-200 text-gray-800 font-semibold"
              : "text-gray-700 hover:bg-gray-50"
          }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4 my-0.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                  />
                </svg>
                <p className="mx-1">AI Interviews</p>
              </div>
            </Link>
          </li>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4 my-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
              <p className="mx-1">Question Bank</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="my-10">
        <div className="text-gray-500 uppercase text-xs mb-2">Insights</div>
        <ul className="space-y-2">
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4 my-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25"
                />
              </svg>

              <p className="mx-1">Goals</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="my-10">
        <div className="text-gray-500 uppercase text-xs mb-2">Library</div>
        <ul className="space-y-2">
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4 my-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15"
                />
              </svg>

              <p className="mx-1">Upload Resume</p>
            </div>
          </li>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4 my-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                />
              </svg>

              <p className="mx-1">Bookmarks</p>
            </div>
          </li>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            <div className="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4 my-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>

              <p className="mx-1">Feedback History</p>
            </div>
          </li>
        </ul>
      </div>
      <hr className="border-gray-300 w-full" />
      <div>
        <div className="text-gray-500 uppercase text-xs mb-2">Usage</div>
        <ul>
          <li className="hover:bg-gray-100 px-2 py-1 rounded ">
            {/* <p>Interviews</p> */}
            <UsageProgress
              interviewsUsed={1}
              interviewLimit={4}
              resumeChecksUsed={4}
              resumeCheckLimit={6}
            />
          </li>
        </ul>
        <p className="text-xs text-gray-500 my-1 mx-2">
          Usage will reset at sep 1, 2025
        </p>
      </div>
      <div>
        <button className="bg-black rounded-md w-full h-10 text-white">
          Get Pro
        </button>
      </div>
    </div>
  );
}
