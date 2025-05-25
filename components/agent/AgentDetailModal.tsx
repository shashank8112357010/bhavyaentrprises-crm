
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
              {agent.mobile && <p><strong>Mobile:</strong> {agent.mobile}</p>}
            </div>
            <div>
              <p><strong>Role:</strong> {agent.role}</p>
              {agent.specialization && <p><strong>Specialization:</strong> {agent.specialization}</p>}
              <p><strong>Status:</strong> {agent.status}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
