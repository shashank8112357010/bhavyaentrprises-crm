"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  UserCheck2,
  IndianRupee,
  NotebookTabsIcon,
  Phone,
  Mail,
  Settings,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import { Role, navRoleAccess } from "@/constants/roleAccessConfig";
import { useAuthStore } from "@/store/authStore";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { role, isLoading, user } = useAuthStore((state) => ({
    role: state.role,
    isLoading: state.isLoading,
    user: state.user, // To check if user object exists, indicating successful load
  }));

  // useEffect(() => {
  //   const storedRole = localStorage.getItem("role") as Role | null;
  //   setRole(storedRole);
  // }, []); // No longer needed as role is reactive from Zustand store

  const allNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: "Kanban Board", href: "/dashboard/kanban", icon: <ListTodo className="h-5 w-5" /> },
    { name: "Clients", href: "/dashboard/clients", icon: <Users className="h-5 w-5" /> },
    { name: "Agents", href: "/dashboard/agents", icon: <UserCheck2 className="h-5 w-5" /> },
    { name: "Finances", href: "/dashboard/finances", icon: <IndianRupee className="h-5 w-5" /> },
    { name: "Rate Card", href: "/dashboard/rate-card", icon: <NotebookTabsIcon className="h-5 w-5" /> },
    { name: "Calls", href: "/dashboard/calls", icon: <Phone className="h-5 w-5" /> },
    { name: "Email Templates", href: "/dashboard/email-template", icon: <Mail className="h-5 w-5" /> },
    { name: "Settings", href: "/dashboard/settings", icon: <Settings className="h-5 w-5" /> },
  ];

  // Determine navItems only if a role is present
  const navItems = role ? allNavItems.filter(item => navRoleAccess[role]?.includes(item.name)) : [];

  const renderNavItems = (isMobile: boolean) => {
    // If loading and role isn't available yet (user might be null during initial load)
    // Show skeleton loaders if we are in the process of fetching user for the first time.
    // `isLoading` could be true for login, etc. We want to target initial auth hydration.
    // A simple check: if isLoading is true AND user object isn't populated yet.
    if (isLoading && !user) {
      return Array.from({ length: 5 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="flex items-center gap-3 rounded-md px-3 py-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
        </div>
      ));
    }

    // If not loading, or user is loaded (even if role results in no items)
    return navItems.map(item => (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => isMobile && setOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          pathname === item.href
            ? "bg-accent text-accent-foreground font-medium" // Added font-medium for desktop active
            : isMobile
                ? (pathname === item.href ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground")
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
      >
        {item.icon}
        {item.name}
      </Link>
    ));
  };


  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 pt-10">
          <nav className="flex flex-col gap-2">
            {renderNavItems(true)}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={cn("hidden h-screen border-r md:flex md:w-52 md:flex-col md:p-4", className)}>
        <nav className="flex flex-col gap-2 mt-6">
            {renderNavItems(false)}
        </nav>
      </aside>
    </>
  );
}
