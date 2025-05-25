import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Agent } from "./types";

interface AgentDetailModalProps {
  agent: Agent | null;
  onClose: () => void;
}

export function AgentDetailModal({ agent, onClose }: AgentDetailModalProps) {
  if (!agent) return null;

  return (
    <Dialog open={!!agent} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agent Details</DialogTitle>
          <DialogDescription>View detailed information about the agent.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> {agent.name}</p>
              <p><strong>Email:</strong> {agent.email}</p>
              <p><strong>Mobile:</strong> {agent.mobile}</p>
              <p><strong>Role:</strong> {agent.role}</p>
              <p><strong>Department:</strong> {agent.department || "N/A"}</p>
              <p><strong>Specialization:</strong> {agent.specialization || "N/A"}</p>
            </div>
            <div>
              <p><strong>Status:</strong> {agent.status}</p>
              <p><strong>Leads Assigned:</strong> {agent.leads.assigned}</p>
              <p><strong>Leads Active:</strong> {agent.leads.active}</p>
              <p><strong>Leads Closed:</strong> {agent.leads.closed}</p>
              <p><strong>Conversion Rate:</strong> {agent.conversionRate}%</p>
              <p><strong>Performance Trend:</strong> {agent.performanceTrend}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Joined Date:</strong> {new Date(agent.joinedDate).toLocaleDateString()}</p>
              <p><strong>Active Tickets:</strong> {agent.activeTickets}</p>
              <p><strong>Rating:</strong> {agent.rating}/5.0</p>
            </div>
            <div>
              <p><strong>Completed Tickets:</strong> {agent.completedTickets}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
