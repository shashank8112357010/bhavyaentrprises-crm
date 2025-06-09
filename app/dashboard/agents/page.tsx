"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Building2,
  MoreHorizontal,
  Phone,
  Mail,
  Search,
  UserCheck2,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import { useAgentStore } from "../../../store/agentStore";
import { NewAgentDialog } from "@/components/agent/new-agent-dialog";
import { AgentDetailModal } from "../../../components/agent/AgentDetailModal";
import { EditAgentDialog } from "../../../components/agent/edit-agent-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Ensure Select components are imported
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Agent } from "../../../components/agent/types";
import { useAuthStore } from "@/store/authStore";

export default function AgentsPage() {
  const { user } = useAuthStore();

  // Role-based access control - only ADMIN and ACCOUNTS users can access agents page
  if (user?.role && user.role !== "ADMIN" && user.role !== "ACCOUNTS") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You don't have permission to access the agents page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  const {
    agents,
    loading,
    error,
    fetchAgents,
    deleteAgent,
    currentPage,
    itemsPerPage,
    totalAgents,
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    setItemsPerPage, // Added setItemsPerPage from store
  } = useAgentStore();

  const [selectedAgentForDetails, setSelectedAgentForDetails] =
    useState<Agent | null>(null);
  const [selectedAgentForDeletion, setSelectedAgentForDeletion] =
    useState<Agent | null>(null);
  const [selectedAgentForEdit, setSelectedAgentForEdit] =
    useState<Agent | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch agents if user has permission
    if (user?.role === "ADMIN" || user?.role === "ACCOUNTS") {
      fetchAgents({}, user.role);
    }
  }, [fetchAgents, user?.role]);

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgentForDetails(agent);
  };

  const handleCloseDetailsModal = () => {
    setSelectedAgentForDetails(null);
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgentForEdit(agent);
  };

  const handleCloseEditModal = () => {
    setSelectedAgentForEdit(null);
  };

  const handleConfirmDelete = async (agentId: string) => {
    if (!agentId) return;
    try {
      setIsDeletingAgent(true);
      await deleteAgent(agentId);
      toast({ title: "Success", description: "Agent deleted successfully" });
      setSelectedAgentForDeletion(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete agent.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAgent(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected + 1);
  };

  const pageCount =
    itemsPerPage > 0 ? Math.ceil(totalAgents / itemsPerPage) : 0;

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="flex flex-col gap-6">
      <AgentDetailModal
        agent={selectedAgentForDetails}
        onClose={handleCloseDetailsModal}
      />
      <EditAgentDialog
        agent={selectedAgentForEdit}
        onClose={handleCloseEditModal}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Agents</h1>
          <p className="text-muted-foreground">
            Manage and monitor service agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NewAgentDialog />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            className="w-full md:w-[300px] pl-8"
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <UserCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <UserCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a: any) => a.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Service</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Active Tickets
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce(
                (sum: any, agent: any) => sum + (agent.activeTickets || 0),
                0,
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Tickets</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">
                  Performance
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading &&
                agents.map((agent: any) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback className="capitalize">
                            {agent.name
                              .split(" ")
                              .map((n: any) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium capitalize">
                            {agent.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {agent.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-medium">{agent.role}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          agent.status === "ACTIVE" ? "default" : "secondary"
                        }
                      >
                        {agent.status || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          agent.activeTickets > 2 ? "destructive" : "secondary"
                        }
                      >
                        {agent.activeTickets}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="text-sm">
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {agent.mobile}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Mail className="h-3 w-3 mr-1" />
                          {agent.email.slice(0, 29)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="text-sm">
                        <div>Rating: {agent.rating}/5.0</div>
                        <div className="text-muted-foreground">
                          {agent.completedTickets} tickets completed
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(agent)}
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(agent)}>
                            Edit Agent
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setSelectedAgentForDeletion(agent)}
                          >
                            Delete Agent
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {loading && (
            <div className="flex justify-center items-center py-10">
              <Spinner size="8" />
            </div>
          )}
          {!loading && totalAgents === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              {searchQuery
                ? "No agents found matching your search."
                : "No agents found."}
            </div>
          )}
          {!loading && agents.length === 0 && totalAgents > 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No agents found for the current search or page.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standardized Pagination Controls Area */}
      <div className="mt-8 flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <div className="text-sm text-muted-foreground mb-2 md:mb-0">
          {totalAgents > 0
            ? `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalAgents)} of ${totalAgents} agents`
            : // This specific message might be redundant if the table already shows a more contextual one
              // For consistency, we can keep it or rely on table's message.
              // Let's keep it simple:
              searchQuery
              ? "No agents found matching your search."
              : "No agents found."}
        </div>

        {totalAgents > itemsPerPage && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows:</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
              }}
            >
              <SelectTrigger className="w-[75px] h-9">
                <SelectValue placeholder={String(itemsPerPage)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>

            <ReactPaginate
              previousLabel={"← Previous"}
              nextLabel={"Next →"}
              breakLabel={"..."}
              pageCount={pageCount}
              marginPagesDisplayed={1}
              pageRangeDisplayed={2}
              onPageChange={handlePageClick}
              containerClassName={
                "flex items-center space-x-1 text-sm select-none"
              }
              pageLinkClassName={
                "px-3 py-1.5 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              }
              activeLinkClassName={
                "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
              }
              previousLinkClassName={
                "px-3 py-1.5 border border-gray-300 rounded-l-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              }
              nextLinkClassName={
                "px-3 py-1.5 border border-gray-300 rounded-r-md cursor-pointer hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
              }
              disabledLinkClassName={"opacity-50 cursor-not-allowed"}
              forcePage={currentPage - 1}
            />
          </div>
        )}
      </div>

      {selectedAgentForDeletion && (
        <Dialog
          open={!!selectedAgentForDeletion}
          onOpenChange={(open) => !open && setSelectedAgentForDeletion(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete{" "}
                <span className="font-semibold">
                  {selectedAgentForDeletion.name}
                </span>
                ? Their leads will be reassigned to the admin.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAgentForDeletion(null)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => handleConfirmDelete(selectedAgentForDeletion.id)}
              >
                {isDeletingAgent ? <Spinner size="4" /> : " Confirm Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
