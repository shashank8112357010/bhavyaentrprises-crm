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
  const [role, setRole] = useState<Role | null>(null);
  const {user} = useAuthStore()
  console.log(tickets);
  

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const storedRole = localStorage.getItem("role") as Role | null;
    setRole(storedRole);
  }, []);


  

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
    // alert(user?.role)
    // console.log(user , "while render");

    if(user?.role === "ADMIN"){
      console.log("TEst passed");
      
    }
    
    
    const allColumns = Object.keys(tickets) as Array<keyof TicketsState>;

    if (user?.role === "ADMIN" || user?.role === "ACCOUNTS") {
      return allColumns;
    } else {
      return allColumns.filter(
        (column) => column !== "billing_pending" && column !== "billing_completed"
      );
    }
  };

  useEffect(()=>{
    getVisibleColumns()
  },[user?.role])

  

  return (
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
        {activeId &&
          (() => {
            const activeTicket = Object.values(tickets)
              .flat()
              .find((t) => t.id === activeId);
            return activeTicket ? (
              <SortableTicket key={activeTicket.id} ticket={activeTicket} />
            ) : null;
          })()}
      </DragOverlay>
    </DndContext>
  );
}
