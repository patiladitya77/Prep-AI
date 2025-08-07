import React from "react";

const Sidebar = () => {
  return (
    <div className="min-h-screen w-64 bg-slate-200 text-slate-900 flex flex-col justify-between py-6">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold">Prep AI</h1>
      </div>

      <div className="flex-1 px-6 space-y-4 text-lg">
        <ul className="space-y-4">
          <li className="hover:text-slate-300 cursor-pointer">Dashboard</li>
          <li className="hover:text-slate-300 cursor-pointer">Analytics</li>
          <li className="hover:text-slate-300 cursor-pointer">Edit Profile</li>
        </ul>
      </div>

      <div className="px-6 space-y-4 text-lg">
        <ul className="space-y-4">
          <li className="hover:text-slate-300 cursor-pointer">Settings</li>
          <li className="hover:text-slate-300 cursor-pointer">Sign Out</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
