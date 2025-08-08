import PreviousMockContainer from "@/components/PreviousMockContainer";

export default function Dashboard() {
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
      <div className="">
        <button className="rounded-md w-50 h-15 bg-white border border-gray-100 shadow-sm mx-2 px-2">
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
            <p className="mx-2 font-semibold ">Start Interview</p>
          </div>
        </button>
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
