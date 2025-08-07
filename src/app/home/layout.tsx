import Sidebar from "@/components/Sidebar";
import { ReactNode } from "react";

export default function HomeLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-12 min-h-screen">
      <div className="col-span-2 border-r border-gray-200">
        <Sidebar />
      </div>
      <main className="col-span-10 p-6">{children}</main>
    </div>
  );
}
