"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/components/mode-toggle";
import { Bell, Menu, Wrench } from "lucide-react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <Link href="/" className="flex items-center gap-2">
            {/* <Wrench className="h-6 w-6 text-primary" /> */}
            <span className="text-xl font-bold tracking-tight">Bhavya Entrprises</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-5 text-sm">
          <Link 
            href="/" 
            className={cn(
              "transition-colors hover:text-primary", 
              pathname === "/" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Dashboard
          </Link>
          <Link 
            href="/kanban" 
            className={cn(
              "transition-colors hover:text-primary", 
              pathname === "/kanban" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Kanban Board
          </Link>
          <Link 
            href="/clients" 
            className={cn(
              "transition-colors hover:text-primary", 
              pathname === "/clients" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Clients
          </Link>
          <Link 
            href="/calendar" 
            className={cn(
              "transition-colors hover:text-primary", 
              pathname === "/calendar" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Calendar
          </Link>
          <Link 
            href="/reports" 
            className={cn(
              "transition-colors hover:text-primary", 
              pathname === "/reports" ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            Reports
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
            <span className="sr-only">Notifications</span>
          </Button>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.png" alt="User" />
                  <AvatarFallback>UT</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Admin User</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    admin@example.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}