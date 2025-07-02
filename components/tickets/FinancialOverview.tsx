import React from 'react';

import { 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Plus,
  Download,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { NewExpenseDialog } from '../finances/new-expense-dialog';

interface Quotation {
  id: string;
  name: string;
  subtotal: number;
  gst: number;
  grandTotal: number;
  expectedExpense?: number;
  pdfUrl?: string;
}

interface Expense {
  id: string;
  customId: string;
  displayId: string;
  amount: number;
  description: string;
  category: string;
  requester: string;
}

interface FinancialOverviewProps {
  quotations?: Quotation[];
  expenses?: Expense[];
  canManageFinancials?: boolean;
  onCreateQuotation?: () => void;
  // onAddExpense removed; handled by modal
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  quotations = [],
  expenses = [],
  canManageFinancials = true,
  onCreateQuotation
}) => {
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const quotationAmount = quotations[0]?.grandTotal || 0;
  const expectedExpense = quotations[0]?.expectedExpense || 0;
  
  const actualProfit = quotationAmount - totalExpenses;
  const expectedProfit = quotationAmount - expectedExpense;
  const profitMargin = quotationAmount > 0 ? (actualProfit / quotationAmount) * 100 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium ">Quotation Value</p>
                <p className="text-2xl font-bold ">{formatCurrency(quotationAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium ">Total Expenses</p>
                <p className="text-2xl font-bold ">{formatCurrency(totalExpenses)}</p>
              </div>
              <Receipt className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium ">Actual Profit</p>
                <p className={`text-2xl font-bold ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(actualProfit)}
                </p>
              </div>
              {actualProfit >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium ">Profit Margin</p>
                <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              {profitMargin >= 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}


      {/* Quotations */}
      <Card>
        <CardHeader>
          <CardTitle>Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {quotations.length > 0 ? (
            <div className="space-y-4">
              {quotations.map((quotation) => (
                <div key={quotation.id} className="flex items-center justify-between p-4  rounded-lg">
                  <div>
                    <h4 className="font-medium ">{quotation.name}</h4>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                      <div>
                        <span className="">Subtotal:</span>
                        <span className="ml-2 font-medium">{formatCurrency(quotation.subtotal)}</span>
                      </div>
                      <div>
                        <span className="">GST:</span>
                        <span className="ml-2 font-medium">{formatCurrency(quotation.gst)}</span>
                      </div>
                      <div>
                        <span className="">Total:</span>
                        <span className="ml-2 font-bold">{formatCurrency(quotation.grandTotal)}</span>
                      </div>
                    </div>
                  </div>
                  {quotation.pdfUrl && (
                    <Button variant="outline" size="sm" >
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No quotations available</p>
          )}
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length > 0 ? (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium ">{expense.description}</h4>
                    <p className="text-sm text-gray-500">
                      {expense.category} • ID: {expense.displayId} • By: {expense.requester}
                    </p>
                  </div>
                  <span className="font-bold ">{formatCurrency(expense.amount)}</span>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium ">Total Expenses:</span>
                  <span className="font-bold text-lg ">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No expenses recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Profit Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="">Expected Expense:</span>
                <span className="font-medium">{formatCurrency(expectedExpense)}</span>
              </div>
              <div className="flex justify-between">
                <span className="">Actual Expense:</span>
                <span className="font-medium">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="">Quotation Amount:</span>
                <span className="font-medium">{formatCurrency(quotationAmount)}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="">Expected Profit:</span>
                <span className={`font-medium ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(expectedProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="">Actual Profit:</span>
                <span className={`font-medium ${actualProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(actualProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="">Profit Margin:</span>
                <span className={`font-medium ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profitMargin.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};