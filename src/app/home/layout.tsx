import LeftNav from "@/components/LeftNav";
import Sidebar from "@/components/Sidebar";
import { ReactNode } from "react";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-200">
      <div className="w-16  ">
        <LeftNav />
      </div>

      <div className="w-64  border-r border-gray-100">
        <Sidebar />
      </div>

      <main className="flex-1 p-6 overflow-y-auto bg-gray-50 rounded-lg m-2">
        {children}
      </main>
    </div>
  );
}
