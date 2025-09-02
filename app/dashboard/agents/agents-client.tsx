"use client";

import { useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface Agent {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  role: string;
  avatar: string | null;
  createdAt: Date;
  _count: {
    tickets: number;
  };
}

interface AgentsClientProps {
  initialAgents: {
    data: Agent[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  initialSearchQuery?: string;
}

export default function AgentsClient({ initialAgents, initialSearchQuery = "" }: AgentsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (query) {
        params.set('search', query);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to first page on search
      router.push(`/dashboard/agents?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.set('page', page.toString());
      router.push(`/dashboard/agents?${params.toString()}`);
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return "NA";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "RM":
        return "default";
      case "BACKEND":
        return "secondary";
      case "MST":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Agents Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Active Tickets</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!initialAgents?.data || initialAgents.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No agents found
                </TableCell>
              </TableRow>
            ) : (
              initialAgents.data.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={agent.avatar || ""}
                          alt={agent.name || ""}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {agent.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {agent.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(agent.role)}>
                      {agent.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {agent.mobile || "No phone"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {agent._count.tickets}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Agent</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Delete Agent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {initialAgents?.total > (initialAgents?.limit || 0) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((initialAgents?.page || 1) - 1) * (initialAgents?.limit || 5) + 1} to{' '}
            {Math.min((initialAgents?.page || 1) * (initialAgents?.limit || 5), initialAgents?.total || 0)} of{' '}
            {initialAgents?.total || 0} agents
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(initialAgents?.page || 1) <= 1 || isPending}
              onClick={() => handlePageChange((initialAgents?.page || 1) - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!initialAgents?.hasMore || isPending}
              onClick={() => handlePageChange((initialAgents?.page || 1) + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}