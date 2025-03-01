
import React from "react";

export default function Home() {
  return (
    <>
      <nav className="absolute top-0 left-0 right-0 h-16 flex items-center">
        <div className="flex items-center gap-4 w-full m-4 pb-2 border-0 border-b border-solid border-gray-200">
          <h1>Home</h1>
        </div>
      </nav>
      <main className="fixed top-16 left-0 right-0 bottom-0 overflow-auto md:overflow-hidden">
        <div className="flex flex-col md:flex-row h-full bg-gray-50">
          <section className="w-full p-6">
            <div className="bg-white/90 backdrop-blur-sm shadow-md rounded-xl p-5">
              <h2 className="text-xl font-semibold mb-4">Welcome to the Voice Chat App</h2>
              <p className="mb-3">This is your home page where you can see an overview of your application.</p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
