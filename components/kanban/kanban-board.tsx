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
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Calendar, Check, Pause, Plus, RotateCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { KanbanColumn } from "./kanban-column";
import { SortableTicket } from "./sortable-ticket";

import type {Ticket } from "@/components/kanban/types"

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

export default function KanbanBoard({
  tickets: initialTickets,
  onDragEnd,
}: KanbanBoardProps) {
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
      const foundTicket = columnTickets.find(
        (ticket: any) => ticket.id === activeTicketId
      );
      if (foundTicket) {
        fromColumn = columnId as keyof TicketsState;
        activeTicket = foundTicket;
      }
      if (columnTickets.find((ticket: any) => ticket.id === overTicketId)) {
        toColumn = columnId as keyof TicketsState;
      }
    });
    if (!fromColumn || !toColumn || !activeTicket) return;

    if (fromColumn != toColumn) {
      // TypeScript now knows fromColumn and toColumn are not null
      setTickets((prev) => {
        const newTickets = { ...prev };

        newTickets[fromColumn!] = prev[fromColumn!].filter(
          (ticket) => ticket.id !== activeTicketId
        );

        newTickets[toColumn!] = [...prev[toColumn!], activeTicket!];

        return newTickets;
      });

      setActiveId(null);
      onDragEnd({
        source: fromColumn,
        destination: toColumn,
        ticketId: activeTicketId,
      });
    } else return;
  };

  const getColumnIcon = (status: string) => {
    switch (status) {
      case "new":
        return <Plus className="h-4 w-4 text-blue-500" />;
      case "inProgress":
        return <RotateCw className="h-4 w-4 text-yellow-500" />;
      case "scheduled":
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case "onHold":
        return <Pause className="h-4 w-4 text-orange-500" />;
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getColumnTitle = (status: string) => {
    switch (status) {
      case "new":
        return "New";
      case "inProgress":
        return "In Progress";
      case "scheduled":
        return "Scheduled";
      case "onHold":
        return "On Hold";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 mt-2 pb-10 overflow-x-auto">
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
        {activeId
          ? (() => {
              const activeTicket = Object.values(tickets)
                .flat()
                .find((ticket) => ticket.id === activeId);

              return activeTicket ? (
                <Card className="w-[280px] shadow-lg">
                  <SortableTicket key={activeTicket.id} ticket={activeTicket} />
                </Card>
              ) : null;
            })()
          : null}
      </DragOverlay>
    </DndContext>
  );
}
