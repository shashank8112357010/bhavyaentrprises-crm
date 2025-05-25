"use client";
import { useRouter } from "next/navigation";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function Home() {
  const router = useRouter();


  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader />
      <main className="flex-1 flex items-center justify-center p-12">
        <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Side Content */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-gray-900">Welcome to Praarabdh CRM!</h1>
            <p className="text-lg text-gray-600">
              Your ultimate dashboard for managing your applications. Streamline, monitor,
              and grow your digital experience all in one place.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold"
            >
              Get Started
            </button>
          </div>

          {/* Right Side Image */}
          <div className="flex justify-center">
            <img
              src="/banner.jpg" // Replace with your actual image path (in public folder)
              alt="Dashboard Illustration"
              className="max-w-full h-auto rounded-xl shadow-lg"
            />
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
