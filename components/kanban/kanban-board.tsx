"use client";

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
import {
  Calendar,
  Check,
  IndianRupee,
  Pause,
  Plus,
  RotateCw,
  X,
} from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { SortableTicket } from "./sortable-ticket";
import { Ticket } from "@/components/kanban/types";
import { useEffect, useState } from "react";
import { Role } from "@/constants/roleAccessConfig";
import { useAuthStore } from "@/store/authStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface TicketsState {
  new: Ticket[];
  inProgress: Ticket[];
  onHold: Ticket[];
  completed: Ticket[];
  billing_pending: Ticket[];
  billing_completed: Ticket[];
}

interface KanbanBoardProps {
  tickets: TicketsState;
  onDragEnd: (result: {
    source: keyof TicketsState;
    destination: keyof TicketsState;
    ticketId: string;
  }) => void;
}

export default function KanbanBoard({ tickets, onDragEnd }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [selectedColumns, setSelectedColumns] = useState<keyof TicketsState[]>([]);

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
    setActiveId(null);

    if (!over) return;

    const activeTicketId = active.id as string;
    const overTicketId = over.id as string;

    let fromColumn: keyof TicketsState | null = null;
    let toColumn: keyof TicketsState | null = null;

    Object.entries(tickets).forEach(([columnId, columnTickets]) => {
      if (columnTickets.some((ticket: any) => ticket.id === activeTicketId)) {
        fromColumn = columnId as keyof TicketsState;
      }
    });

    if (Object.keys(tickets).includes(overTicketId)) {
      toColumn = overTicketId as keyof TicketsState;
    } else {
      Object.entries(tickets).forEach(([columnId, columnTickets]) => {
        if (columnTickets.some((ticket: any) => ticket.id === overTicketId)) {
          toColumn = columnId as keyof TicketsState;
        }
      });
    }

    if (fromColumn && toColumn && fromColumn !== toColumn) {
      onDragEnd({
        source: fromColumn,
        destination: toColumn,
        ticketId: activeTicketId,
      });
    }
  };

  const getColumnIcon = (status: keyof TicketsState) => {
    const icons = {
      new: <Plus className="h-4 w-4 text-blue-500" />,
      inProgress: <RotateCw className="h-4 w-4 text-yellow-500" />,
      onHold: <Pause className="h-4 w-4 text-orange-500" />,
      completed: <Check className="h-4 w-4 text-green-500" />,
      billing_pending: (
        <>
          <IndianRupee className="h-4 w-4 text-green-500" />
          <X className="h-4 w-4 text-red-500" />
        </>
      ),
      billing_completed: (
        <>
          <IndianRupee className="h-4 w-4 text-green-500" />
          <Check className="h-4 w-4 text-green-500" />
        </>
      ),
    };
    return icons[status] ?? null;
  };

  const getColumnTitle = (status: keyof TicketsState) => {
    const titles = {
      new: "New",
      inProgress: "In Progress",
      onHold: "On Hold",
      completed: "Completed",
      billing_pending: "Billing Pending",
      billing_completed: "Billing Completed",
    };
    return titles[status] ?? status;
  };

  const getVisibleColumns = () => {
    if (user?.role === "ACCOUNTS") {
      return ["billing_pending", "billing_completed", ...selectedColumns];
    }
    return Object.keys(tickets) as Array<keyof TicketsState>;
  };

  const availableStatuses: keyof TicketsState[] = [
    "new",
    "inProgress",
    "onHold",
    "completed",
  ];

  return (
    <div className="w-[calc(100vw-15rem)]">
      {user?.role === "ACCOUNTS" && (
        <div className="flex flex-col gap-2 px-4 pt-4">
          <div className="flex gap-2 flex-wrap">
            {selectedColumns.map((status) => (
              <Badge key={status} className="flex items-center gap-1">
                {getColumnTitle(status)}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() =>
                    setSelectedColumns((prev) =>
                      prev.filter((s) => s !== status)
                    )
                  }
                />
              </Badge>
            ))}
          </div>
          <Select
            onValueChange={(value) => {
              const status = value as keyof TicketsState;
              if (!selectedColumns.includes(status)) {
                setSelectedColumns([...selectedColumns, status]);
              }
            }}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Add status column" />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses
                .filter((status) => !selectedColumns.includes(status))
                .map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className="capitalize"
                  >
                    {getColumnTitle(status)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto gap-4 p-4">
          {getVisibleColumns().map((status) => (
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
          {activeId && (() => {
            const activeTicket = Object.values(tickets)
              .flat()
              .find((t) => t.id === activeId);
            return activeTicket ? (
              <SortableTicket key={activeTicket.id} ticket={activeTicket} />
            ) : null;
          })()}
        </DragOverlay>
      </DndContext>
    </div>
  );
}