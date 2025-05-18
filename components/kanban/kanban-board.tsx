"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { 
  AlertTriangle, 
  ArrowUpRight, 
  Building, 
  Calendar, 
  Check, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  MoreHorizontal, 
  Pause,
  Plus, 
  RotateCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KanbanColumn } from "./kanban-column";
import { SortableTicket } from "./sortable-ticket";

interface Assignee {
  name: string;
  avatar: string;
  initials: string;
}

interface Ticket {
  id: string;
  title: string;
  client: string;
  branch: string;
  priority: string;
  assignee: Assignee;
  dueDate?: string;
  scheduledDate?: string;
  completedDate?: string;
  createdAt: string;
  description: string;
  comments: number;
  holdReason?: string;
}

interface TicketsState {
  new: Ticket[];
  inProgress: Ticket[];
  scheduled: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
}

interface KanbanBoardProps {
  tickets: TicketsState;
  onDragEnd: (result: any) => void;
}

export default function KanbanBoard({ tickets: initialTickets, onDragEnd }: KanbanBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeTicketId = active.id as string;
    const overTicketId = over.id as string;

    // Find which column the ticket is moving from and to
    let fromColumn: keyof TicketsState | null = null;
    let toColumn: keyof TicketsState | null = null;
    let activeTicket: Ticket | null = null;

    Object.entries(tickets).forEach(([columnId, columnTickets]) => {
      const foundTicket = columnTickets.find(ticket => ticket.id === activeTicketId);
      if (foundTicket) {
        fromColumn = columnId as keyof TicketsState;
        activeTicket = foundTicket;
      }
      if (columnTickets.find(ticket => ticket.id === overTicketId)) {
        toColumn = columnId as keyof TicketsState;
      }
    });

    if (!fromColumn || !toColumn || !activeTicket) return;

    setTickets(prev => {
      const newTickets = { ...prev };
      
      // Remove from old column
      newTickets[fromColumn] = prev[fromColumn].filter(
        ticket => ticket.id !== activeTicketId
      );
      
      // Add to new column
      newTickets[toColumn] = [...prev[toColumn], activeTicket];

      return newTickets;
    });

    setActiveId(null);
    onDragEnd({ source: fromColumn, destination: toColumn, ticketId: activeTicketId });
  };

  const getColumnIcon = (status: string) => {
    switch (status) {
      case "new": return <Plus className="h-4 w-4 text-blue-500" />;
      case "inProgress": return <RotateCw className="h-4 w-4 text-yellow-500" />;
      case "scheduled": return <Calendar className="h-4 w-4 text-purple-500" />;
      case "onHold": return <Pause className="h-4 w-4 text-orange-500" />;
      case "completed": return <Check className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const getColumnTitle = (status: string) => {
    switch (status) {
      case "new": return "New";
      case "inProgress": return "In Progress";
      case "scheduled": return "Scheduled";
      case "onHold": return "On Hold";
      case "completed": return "Completed";
      default: return status;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-2 pb-10 overflow-x-auto">
        {(Object.keys(tickets) as Array<keyof TicketsState>).map((status) => (
          <KanbanColumn
            key={status}
            id={status}
            title={getColumnTitle(status)}
            icon={getColumnIcon(status)}
            tickets={tickets[status]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
          <Card className="w-[280px] shadow-lg">
            {tickets[activeId as keyof TicketsState].map(ticket => 
              ticket.id === activeId ? (
                <SortableTicket key={ticket.id} ticket={ticket} />
              ) : null
            )}
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}