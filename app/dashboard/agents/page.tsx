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
import ReactPaginate from "react-paginate"; // Added import
import { useAgentStore } from "../../../store/agentStore";
import { NewAgentDialog } from "@/components/agent/new-agent-dialog";
import { AgentDetailModal } from "../../../components/agent/AgentDetailModal";
import { EditAgentDialog } from "../../../components/agent/edit-agent-dialog";


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

export default function AgentsPage() {
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
    setSearchQuery
  } = useAgentStore();

  const [selectedAgentForDetails, setSelectedAgentForDetails] =
    useState<Agent | null>(null);
  const [selectedAgentForDeletion, setSelectedAgentForDeletion] =
    useState<Agent | null>(null);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<Agent | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState<boolean>(false); // Renamed local loading state
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents(); // Initial fetch uses defaults from store (page 1, empty query)
  }, [fetchAgents]);

  // Client-side filtering is no longer needed as API handles search and pagination
  // const filteredAgents = agents.filter(...);

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
      setIsDeletingAgent(true); // Use renamed state setter
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
      setIsDeletingAgent(false); // Use renamed state setter
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value); // Call store action
  };

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected + 1); // Store's page is 1-based
  };

  const pageCount = itemsPerPage > 0 ? Math.ceil(totalAgents / itemsPerPage) : 0;

  // Display error toast if error state from store changes
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
            value={searchQuery} // Bind to store's searchQuery
            onChange={handleSearchChange} // Use new handler
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
            <div className="text-2xl font-bold">{totalAgents}</div> {/* Use totalAgents from store */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <UserCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a:any) => a.status === "ACTIVE").length}
              {/* This will reflect current page stats */}
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
              {/* This will reflect current page stats */}
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
                0
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
              {/* Render agents directly from the store, no more client-side filteredAgents */}
              {!loading && agents.map((agent: any) => (
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
                        <div className="font-medium capitalize">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {agent.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* <div className="font-medium">{agent.specialization}</div> */}
                    <div className="text-medium">
                      {agent.role}
                    </div>
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
                        <DropdownMenuItem>Assign Ticket</DropdownMenuItem>
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
            {/* Removed TableBody for loading/no data, handled below Table */}
          </Table>

          {loading && (
            <div className="flex justify-center items-center py-10">
              <Spinner size="8" />
            </div>
          )}
          {!loading && totalAgents === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No team members found.
            </div>
          )}
          {!loading && agents.length === 0 && totalAgents > 0 && (
             <div className="text-center py-10 text-muted-foreground">
              No team members found for the current search or page.
            </div>
          )}

        </CardContent>
      </Card>

      {totalAgents > 0 && pageCount > 1 && (
        <div className="mt-8 flex justify-center">
            <ReactPaginate
                previousLabel={"← Previous"}
                nextLabel={"Next →"}
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={3}
                onPageChange={handlePageClick}
                containerClassName={"flex items-center space-x-1 rtl:space-x-reverse"}
                pageLinkClassName={"px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white rounded-md"}
                previousLinkClassName={"px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"}
                nextLinkClassName={"px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"}
                breakLinkClassName={"px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white rounded-md"}
                activeLinkClassName={"z-10 px-3 py-2 leading-tight text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"}
                disabledLinkClassName={"opacity-50 cursor-not-allowed"}
                forcePage={currentPage - 1} // forcePage is 0-based
            />
        </div>
      )}

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
                {isDeletingAgent ? <Spinner size="4" /> : " Confirm Delete"} {/* Use renamed state */}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
