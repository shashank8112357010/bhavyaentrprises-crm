"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { Loader2 } from "lucide-react"; // Import a loading spinner icon
// import { useUserStore } from "@/store/crmStore"; // Will be replaced by authStore for user data
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [isLoading, setIsLoading] = useState(false); // Will use isLoading from authStore
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter(); // Can be used for navigation instead of window.location.href
  const { toast } = useToast();
  // const { setUser } = useUserStore(); // Replaced by authStore actions

  const { login, isLoading, error } // error from store can be used for toast
    = useAuthStore((state) => ({
    login: state.login,
    isLoading: state.isLoading,
    error: state.error,
  }));


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    // isLoading is set to true within the authStore.login action
    const result = await login(email, password);

    if (result.success) {
      toast({ title: "Success", description: "Logged in successfully!" });
      // The authStore.login action's service call might already redirect for 302.
      // If user and token are returned (e.g. status 200), then redirect here.
      // localStorage is handled by the store action now.
      // setUser from useUserStore is removed as authStore is the source of truth.

      // Check if redirection is already handled by the service (e.g. for 302 status)
      // If not, or if we need to ensure it for 200 status returns with user data:
      if (!window.location.pathname.startsWith("/dashboard")) {
         // Using router.push for client-side navigation is generally preferred in Next.js
         // but window.location.href is fine if full page reload is intended or if service layer used it.
        router.push("/dashboard");
        // Alternatively, to ensure full page reload: window.location.href = "/dashboard";
      }
    } else {
      toast({
        title: "Authentication failed",
        description: result.error || "Invalid email or password", // Use error from store result
        variant: "destructive",
      });
    }
    // isLoading is set to false within the authStore.login action
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign in</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
