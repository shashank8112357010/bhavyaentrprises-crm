"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SortableTicket } from "./sortable-ticket";
import type { Ticket } from "./types";

interface KanbanColumnProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  tickets: Ticket[];
}

export function KanbanColumn({ id, title, icon, tickets }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className="min-w-[270px] bg-background border  rounded-lg p-3 flex flex-col h-[calc(100vh-240px)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          {icon}
          <h3 className="font-medium ml-2">
            {title} ({tickets.length})
          </h3>
        </div>
        {/* <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Plus className="h-4 w-4" />
        </Button> */}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <SortableTicket key={ticket.id} ticket={ticket} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}