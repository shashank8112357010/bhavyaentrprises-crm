"use client";
import { useRouter } from "next/navigation";
import LoginPage from "@/components/login/login-page";


export default function Home() {
  const router = useRouter();
  // resetUserTicketStats()

  return (
    <div className="flex h-screen flex-col" style={{backgroundImage :'./banner.jpg'}}>
      <main className="flex-1 mx-6 min-h-screen flex items-center justify-center ">
        <div className="max-w-7xl w-full grid grid-cols-1  md:grid-cols-2 gap-8 items-center">
          {/* Left Side Content */}
          <div className="space-y-8">
            <h1 className="text-4xl font-bold ">
              Welcome to Bhavya Enterprises CRM!
            </h1>
            <p className="text-lg">
              Your ultimate dashboard for managing your applications.
              Streamline, monitor, and grow your digital experience all in one
              place.
            </p>
           
          </div>

          {/* Right Side Image */}
          <div className="flex justify-center">
        

            <LoginPage/>
          </div>
        </div>
      </main>
    </div>
  );
}
