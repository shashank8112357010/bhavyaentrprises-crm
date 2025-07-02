import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';


interface TicketHeaderProps {
  ticketId: string;
  title: string;
  status: string;
  priority: string;
  onEdit?: () => void;
  onReassign?: () => void;
  canEdit?: boolean;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({
  ticketId,
  title,
  status,
  priority,
  onEdit,
  onReassign,
  canEdit = false
}) => {
  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'secondary'; 
      case 'inProgress': return 'secondary';
      case 'on_hold': case 'onhold': return 'outline'; 
      case 'new': return 'default';
      default: return 'default';
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive'; 
      case 'medium': return 'outline';   
      case 'low': return 'secondary';   
      default: return 'secondary';
    }
  };

  return (
    <div className=" border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* <Button variant="ghost" size="sm" icon={ArrowLeft} >
            Back to Tickets
          </Button> */}
          {/* <div className="border-l border-gray-300 h-6"></div> */}
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold ">{title}</h1>
              <Badge variant={getStatusVariant(status)}>
                {status?.replace('_', ' ') || 'Unknown'}
              </Badge>
              <Badge variant={getPriorityVariant(priority)}>
                {priority || 'No Priority'}
              </Badge>
            </div>
            <p className="text-sm  mt-1">Ticket #{ticketId}</p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm"  onClick={onReassign}>
              Reassign
            </Button>
            <Button variant="outline" size="sm"  onClick={onEdit}>
              Edit Ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};