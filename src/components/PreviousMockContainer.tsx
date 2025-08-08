import React from "react";
import PreviousInterviewCard from "./PreviousInterviewCard";

const PreviousMockContainer = () => {
  return (
    <div className="bg-white rounded-md w-full  border border-gray-100 shadow-sm">
      <h1 className="font-semibold text-xl p-2 m-2">
        Previous Mock Interviews
      </h1>
      <PreviousInterviewCard />
      <PreviousInterviewCard />
      <PreviousInterviewCard />
    </div>
  );
};

export default PreviousMockContainer;
