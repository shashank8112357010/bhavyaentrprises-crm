"use client";

import { useEffect } from "react";
import { useExpenseStore } from "@/store/expenseStore";

interface ExpenseCreationHelperProps {
  ticketId?: string;
  quotationId?: string;
  onExpenseCreated?: (expense: any) => void;
}

export function ExpenseCreationHelper({
  ticketId,
  quotationId,
  onExpenseCreated,
}: ExpenseCreationHelperProps) {
  const { forceRefresh, addExpense } = useExpenseStore();

  useEffect(() => {
    // Listen for expense creation events
    const handleExpenseCreated = (event: CustomEvent) => {
      const { expense } = event.detail;
      
      // Add to store immediately for optimistic updates
      addExpense(expense);
      
      // Call callback if provided
      if (onExpenseCreated) {
        onExpenseCreated(expense);
      }
      
      // Force refresh to ensure consistency
      setTimeout(() => {
        forceRefresh();
      }, 100);
    };

    window.addEventListener('expense-created', handleExpenseCreated as EventListener);
    
    return () => {
      window.removeEventListener('expense-created', handleExpenseCreated as EventListener);
    };
  }, [addExpense, forceRefresh, onExpenseCreated]);

  // This component doesn't render anything, it's just a helper
  return null;
}

export default ExpenseCreationHelper;
