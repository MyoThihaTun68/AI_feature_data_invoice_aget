import { FileStack } from 'lucide-react';

/**
 * A simple, reusable component to display the total count of invoices.
 * @param {object} props
 * @param {number} props.totalInvoices - The total count of invoices.
 * @param {boolean} [props.isLoading=false] - Optional: to show a loading state.
 */
const InvoiceStats = ({ totalInvoices, isLoading = false }) => {
  return (
    <div className="bg-[#282f41] p-6 rounded-xl border border-slate-800">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center">
        <FileStack size={16} className="mr-2" />
        Invoice Summary
      </h3>
      
      <div className="flex items-center justify-between">
        <p className="text-gray-300">Total Invoices Saved</p>
        {isLoading ? (
          <div className="h-8 w-12 bg-gray-700 rounded-md animate-pulse"></div>
        ) : (
          <p className="text-2xl font-bold text-white">
            {totalInvoices}
          </p>
        )}
      </div>
    </div>
  );
};

export default InvoiceStats;