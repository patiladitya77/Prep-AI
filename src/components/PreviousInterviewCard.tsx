import React from "react";

const PreviousInterviewCard = () => {
  return (
    <div>
      <div className="rounded-md border border-gray-100 shadow-sm w-[40%]  p-2 m-3">
        <div className="flex justify-between">
          <h1 className="font-bold text-lg mx-2">Backend developer</h1>
          <span className="text-sm text-gray-400 mx-2">1/23/23</span>
        </div>
        <div className="bg-gray-200 w-20 m-2 text-sm p-1 rounded-2xl">
          0 year exp
        </div>
        <div className="flex justify-between mx-2 my-4">
          <button className="bg-gray-100 rounded-md w-45 h-8">Feedback</button>
          <button className="bg-black text-white rounded-md w-45 h-8">
            ReAttempt
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviousInterviewCard;
