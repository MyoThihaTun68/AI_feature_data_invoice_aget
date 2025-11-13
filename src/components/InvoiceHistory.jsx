import { useState } from 'react';

// This component now just displays the data it's given.
// It receives the list of invoices, the currently selected one, and a function to call when one is clicked.
const InvoiceHistory = ({ invoices, selectedId, onInvoiceSelect }) => {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-[#24272C] p-6 rounded-xl border border-slate-800 h-full flex items-center justify-center">
        <p className="text-sm text-gray-500">Your recent invoices will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-[72.8%] bg-[#282f41] p-6 rounded-xl border border-slate-800 overflow-y-auto">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Recently Saved Invoices</h3>
      <ul className="space-y-3">
        {invoices.map((invoice) => (
          <li
            key={invoice.id}
            onClick={() => onInvoiceSelect(invoice.id)} // Use the passed-in function
            className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
              selectedId === invoice.id
                ? 'bg-[#4F46E5]/20 border-l-4 border-[#4F46E5]'
                // The hover effect is good for unselected items
                : 'hover:bg-slate-800/60' 
            }`}
          >
            <div>
              <p className="font-semibold text-gray-200">{invoice.vendor}</p>
              <p className="text-xs text-gray-500">{invoice.invoice_id}</p>
            </div>
            <p className={`font-semibold text-gray-300`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvoiceHistory;