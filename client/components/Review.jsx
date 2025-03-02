
import React from "react";
import AppSidebar from "./AppSidebar";

export default function Review() {
  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <h1>Review your transcripts</h1>
        </div>
      </nav>
      <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden">
        <div className="flex flex-col md:flex-row h-full bg-gray-50">
          <AppSidebar />
          <section className="w-full p-4">
            <div className="bg-white shadow-md rounded-xl p-5">
              <h2 className="text-xl font-semibold mb-4">Review your transcripts</h2>
              <p>Your session transcripts will appear here.</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
