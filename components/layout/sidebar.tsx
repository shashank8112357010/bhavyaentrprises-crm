// components/Sidebar.tsx
"use client";

import { useState } from "react";
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
import { Role, navRoleAccess } from "@/constants/roleAccessConfig";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const role = localStorage.getItem('role') as Role | null;

  const allNavItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Kanban Board",
      href: "/dashboard/kanban",
      icon: <ListTodo className="h-5 w-5" />,
    },
    {
      name: "Clients",
      href: "/dashboard/clients",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Agents",
      href: "/dashboard/agents",
      icon: <UserCheck2 className="h-5 w-5" />,
    },
    {
      name: "Finances",
      href: "/dashboard/finances",
      icon: <IndianRupee className="h-5 w-5" />,
    },
    {
      name: "Rate Card",
      href: "/dashboard/rate-card",
      icon: <NotebookTabsIcon className="h-5 w-5" />,
    },
    {
      name: "Calls",
      href: "/dashboard/calls",
      icon: <Phone className="h-5 w-5" />,
    },
    {
      name: "Email Templates",
      href: "/dashboard/email-template",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  const navItems = role ? allNavItems.filter((item) => navRoleAccess[role]?.includes(item.name)) : [];

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 pt-10">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <aside className={cn("hidden h-screen border-r md:flex md:w-52 md:flex-col md:p-4", className)}>
        <nav className="flex flex-col gap-2 mt-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
