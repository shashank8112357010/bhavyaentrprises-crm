"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

function ResetPasswordFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const { resetPassword, isLoading, error, setError, setLoading } = useAuthStore()

  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [tokenProcessed, setTokenProcessed] = useState(false); // New state

  useEffect(() => {
    if (tokenProcessed) return; // Prevent re-running if already processed

    const tokenFromUrl = searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setTokenProcessed(true); // Mark as processed
    } else {
      toast({
        title: "Error",
        description: "Invalid or missing password reset token. Please request a new link.",
        variant: "destructive",
      });
      router.push("/forgot-password"); // Redirect if no token
      setTokenProcessed(true); // Mark as processed
    }
  }, [searchParams, router, toast, tokenProcessed]); // Added tokenProcessed to dependency array

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    setError(null); // Clear global error

    if (!newPassword || !confirmPassword) {
      setLocalError("Both password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long.");
      return;
    }
    if (!token) {
      setLocalError("No reset token found. Please try the reset process again.");
      return;
    }

    // setLoading(true) is called within resetPassword action
    const result = await resetPassword(token, newPassword);

    if (result.success) {
      toast({
        title: "Success!",
        description: "Your password has been reset successfully. You can now login.",
        variant: "default",
      });
      router.push("/");
    } else {
      // Error is set in the store by resetPassword action, use it or a fallback
      toast({
        title: "Reset Failed",
        description: error || result.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
    // setLoading(false) is called within resetPassword action
  };

  if (!token && !searchParams.get("token")) {
    // Still waiting for useEffect to run or token really missing
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-red-500">Invalid or missing password reset token.</p>
                    <div className="mt-4 text-center">
                        <Link href="/forgot-password">
                            <Button variant="link">Request a new reset link</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Reset Your Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {(localError || error) && <p className="text-sm text-red-600 dark:text-red-500">{localError || error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
         <CardFooter className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remembered your password?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Wrap the component with Suspense because useSearchParams() needs it.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormComponent />
    </Suspense>
  );
}
