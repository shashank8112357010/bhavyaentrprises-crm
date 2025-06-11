// app/dashboard/finances/page.tsx
export default function FinancesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Finances</h2>
      <p>
      {`  Quotations and Expenses have been moved to their own dedicated pages in the sidebar.`}
      </p>
      <p>
       {` Please use the "Quotations" and "Expenses" links in the sidebar to manage your financial data.`}
      </p>
    </div>
  );
}
