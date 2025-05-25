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
  const { agents, loading, error, fetchAgents, deleteAgent } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgentForDetails, setSelectedAgentForDetails] =
    useState<Agent | null>(null);
  const [selectedAgentForDeletion, setSelectedAgentForDeletion] =
    useState<Agent | null>(null);
  const [selectedAgentForEdit, setSelectedAgentForEdit] = useState<Agent | null>(null);
  const [Loading, setLoading] = useState<Boolean | false>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = agents.filter(
    (agent: Agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.specialization &&
        agent.specialization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      setLoading(true);
      await deleteAgent(agentId);
      toast({ title: "Success", description: "Agent deleted successfully" });
      setSelectedAgentForDeletion(null);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      toast({
        title: "Error",
        description: error.message || "Failed to delete agent.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    toast({
      title: "Error",
      description: error || "Failed to delete agent.",
      variant: "destructive",
    });
  }, [error]);

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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
            <UserCheck2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.status === "active").length}
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
                <TableHead>Specialization</TableHead>
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
              {filteredAgents.map((agent: any) => (
                <TableRow key={agent.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={agent.avatar} alt={agent.name} />
                        <AvatarFallback>
                          {agent.name
                            .split(" ")
                            .map((n: any) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {agent.id}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{agent.specialization}</div>
                    <div className="text-xs text-muted-foreground">
                      {agent.role}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        agent.status === "active" ? "default" : "secondary"
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
            <TableBody className="text-center">
              <TableRow>
                <TableCell colSpan={7} className="p-5 mt-4">
                  {loading ? (
                    <Spinner size="6" />
                  ) : (
                    filteredAgents.length === 0 &&
                    " No team members found matching your search."
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
                {Loading ? <Spinner size="4" /> : " Confirm Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
