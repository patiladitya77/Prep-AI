export default function Sidebar() {
  return (
    <div className="p-4 space-y-6 text-gray-700 text-sm bg-slate-100 rounded-lg m-2">
      {/* Interview Tools Section */}
      <div className="mb-10">
        <div className="text-gray-900 font-semibold text-base mb-4">
          Interview Tools
        </div>
        <ul className="space-y-2">
          <li className="hover:bg-gray-100 px-2 py-1 rounded">AI Interviews</li>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">Question Bank</li>
        </ul>
      </div>

      {/* Insights Section */}
      <div className="my-10">
        <div className="text-gray-500 uppercase text-xs mb-2">Insights</div>
        <ul className="space-y-2">
          <li className="hover:bg-gray-100 px-2 py-1 rounded">Analytics</li>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">Goals</li>
        </ul>
      </div>

      {/* Library Section */}
      <div className="my-10">
        <div className="text-gray-500 uppercase text-xs mb-2">Library</div>
        <ul className="space-y-2">
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            Upload Resumes
          </li>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">Bookmarks</li>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">
            Feedback History
          </li>
        </ul>
      </div>
      <div>
        <div className="text-gray-500 uppercase text-xs mb-2">Usage</div>
        <ul>
          <li className="hover:bg-gray-100 px-2 py-1 rounded">Interviews</li>
        </ul>
      </div>
      <div>
        <button className="bg-black rounded-md w-full h-10 text-white">
          Get Pro
        </button>
      </div>
    </div>
  );
}
