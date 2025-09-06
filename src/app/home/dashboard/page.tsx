"use client";
import PreviousMockContainer from "@/components/PreviousMockContainer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
export default function Dashboard() {
  const [openDialog, setOpenDialog] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [exp, setExp] = useState("");
  const [jobRoleReqError, setJobRoleReqError] = useState("");
  const [jobDesReqError, setJobDesReqError] = useState("");
  const [expReqError, setReqExpError] = useState("");

  const handleStartInterview = () => {
    if (!jobRole) {
      setJobRoleReqError("* indicates required field");
      return;
    }
    if (!jobDescription) {
      setJobDesReqError("* indicates required field");
      return;
    }
    if (!exp) {
      setReqExpError("* indicates required field");
      return;
    }
    setOpenDialog(false);
  };
  return (
    <div className="">
      <div className="flex justify-between my-8 mx-5">
        <div className="">
          <h1 className="font-bold text-4xl text-black my-3">
            Welcome back, Aditya
          </h1>
          <h1 className="text-lg">
            Your personalised interview prep assistant
          </h1>
        </div>
        <div className="mr-5 my-3">
          <button className="bg-slate-200 rounded-md p-2">View anaytics</button>
        </div>
      </div>
      <div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <button className="rounded-md w-50 h-15 bg-white border border-gray-100 shadow-sm mx-2 px-2 cursor-pointer">
              <div className="flex">
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
                    d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                  />
                </svg>
                <p className="mx-2 font-semibold">Start Interview</p>
              </div>
            </button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Tell us more about your job interviewing
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Add Details about your job position/role, Job Description, and
                Years of Experience
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Job Role */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Job Role/Job Position*
                </label>
                <input
                  type="text"
                  placeholder="Ex. Full Stack Developer"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setJobRole(e.target.value)}
                />
                <p className="text-red-600">{jobRoleReqError}</p>
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Job Description/Tech stack in short*
                </label>
                <textarea
                  placeholder="Ex. React, Angular, NodeJs, MongoDB, MySQL, etc."
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setJobDescription(e.target.value)}
                ></textarea>
                <p className="text-red-600">{jobDesReqError}</p>
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  No. of Years of Experience*
                </label>
                <input
                  type="text"
                  placeholder="Ex. 2"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setExp(e.target.value)}
                />
                <p className="text-red-600">{expReqError}</p>
              </div>

              {/* Upload Resume */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Upload Resume*
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition"
                  onClick={() =>
                    document.getElementById("resumeUpload").click()
                  }
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file) alert(`Uploaded: ${file.name}`);
                  }}
                >
                  <input
                    type="file"
                    id="resumeUpload"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) alert(`Uploaded: ${file.name}`);
                    }}
                  />
                  <p className="text-gray-500">
                    Drag & drop your resume here or click to upload
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-black text-white rounded-md"
                onClick={() => {
                  handleStartInterview();
                  // Start interview logic
                }}
              >
                Start Interview
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resume Check button */}
        <button className="rounded-md w-50 h-15 bg-white border border-gray-100 shadow-sm mx-2">
          <div className="flex">
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
                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
              />
            </svg>
            <p className="mx-2 font-semibold">Resume Check</p>
          </div>
        </button>
      </div>
      <div className="rounded-md bg-white border border-gray-100 shadow-sm mx-2 my-5 p-3 w-3/4">
        <h1 className="font-semibold">Tip of the day</h1>
        <p>keep your answers structured using STAR format</p>
      </div>
      <div>
        <PreviousMockContainer />
      </div>
    </div>
  );
}
