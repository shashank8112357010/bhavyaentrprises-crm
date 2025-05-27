"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";


export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 w-full  z-50 px-20 text-center transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="container p-6 flex h-16 items-center  justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Bhavya Enterprises</span>
          </Link>
       
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/login"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Sign In
            </Link>
           
          </div>
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/#features"
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Features
                </Link>
                <Link
                  href="/#testimonials"
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Testimonials
                </Link>
                <Link
                  href="/#contact"
                  className="text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Contact
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({}), "mt-2")}
                >
                  Get Started
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}