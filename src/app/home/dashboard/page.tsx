export default function Dashboard() {
  return (
    <div className="">
      <div className="flex justify-between my-8 mx-5">
        <div className="">
          <h1 className="font-bold text-4xl text-slate-600 my-3">
            Interview Dashboard
          </h1>
          <h1 className="text-lg">
            Create and practice your AI Mock Interviews with personalized
            feedback
          </h1>
        </div>
        <div className="mr-5 my-3">
          <button className="bg-slate-200 rounded-md p-2">View anaytics</button>
        </div>
      </div>
      <div>
        <button className="bg-slate-600 rounded-md text-white p-5 m-5 w-100 h-22">
          Ready? Start your interview
        </button>
      </div>
      <div></div>
    </div>
  );
}
