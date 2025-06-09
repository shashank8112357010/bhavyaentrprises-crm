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
import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/lib/axios";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // const [isLoading, setIsLoading] = useState(false); // Will use isLoading from authStore
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  // const { setUser } = useUserStore(); // Replaced by authStore actions

  // Changed to individual selectors for potentially better performance and to avoid warnings
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  // Note: if 'error' from the store is used to trigger toasts directly
  // without being reset, it might show stale errors.
  // The current implementation in handleLogin uses result.error from the login action promise.

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

    try {
      // isLoading is set to true within the authStore.login action
      const result = await login(email, password);

      console.log("Login result:", result);

      if (result.success) {
        toast({ title: "Success", description: "Logged in successfully!" });

        // Small delay to ensure state is updated
        setTimeout(() => {
          // Check if redirection is already handled by the service (e.g. for 302 status)
          // If not, or if we need to ensure it for 200 status returns with user data:
          if (!window.location.pathname.startsWith("/dashboard")) {
            // Using router.push for client-side navigation is generally preferred in Next.js
            // but window.location.href is fine if full page reload is intended or if service layer used it.
            window.location.href = "/dashboard";
            // Alternatively, to ensure full page reload: window.location.href = "/dashboard";
          }
        }, 100);
      } else {
        console.error("Login failed:", result.error);
        toast({
          title: "Authentication failed",
          description: result.error || "Invalid email or password", // Use error from store result
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login exception:", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred during login",
        variant: "destructive",
      });
    }
    // isLoading is set to false within the authStore.login action
  };

  const testAPI = async () => {
    try {
      console.log("Testing API connection...");
      const response = await axiosInstance.get("/test-login");
      console.log("API test successful:", response.data);
      toast({
        title: "API Test Successful",
        description: `Found ${response.data.totalUsers} users in database`,
      });
    } catch (error: any) {
      console.error("API test failed:", error);
      toast({
        title: "API Test Failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    }
  };

  const testLoginAPI = async () => {
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter email and password first",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Testing login API with direct fetch...");

      // Test with direct fetch first
      const fetchResponse = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const fetchData = await fetchResponse.json();
      console.log("Direct fetch response:", {
        status: fetchResponse.status,
        data: fetchData,
      });

      // Test with axios
      const axiosResponse = await axiosInstance.post("/login", {
        email,
        password,
      });
      console.log("Axios response:", {
        status: axiosResponse.status,
        data: axiosResponse.data,
      });

      toast({
        title: "Login API Test",
        description: `Direct fetch: ${fetchResponse.status}, Axios: ${axiosResponse.status}`,
      });
    } catch (error: any) {
      console.error("Login API test failed:", error);
      toast({
        title: "Login API Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
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
              {process.env.NODE_ENV === "development" && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={testAPI}
                  >
                    Test API Connection
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-1"
                    onClick={testLoginAPI}
                  >
                    Test Login API
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
