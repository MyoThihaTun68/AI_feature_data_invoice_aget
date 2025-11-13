import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../config/supabaseClient'; // Adjust path if needed
import { AlertTriangle, FileText, Loader2, Download, Trash2 } from 'lucide-react'; // 'Edit' icon removed
import ExportButton from '../components/ExportButton';
// EditInvoiceModal component is no longer imported

const InvoicesPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for the modal has been removed
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to view invoices.");

      const { data, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInvoices(data);
    } catch (err) {
      setError(err.message || "Failed to fetch invoices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // All handlers for the edit modal have been removed
  // handleOpenEditModal, handleCloseModal, handleSaveInvoice are gone.

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      if (window.confirm("Are you sure you want to permanently delete this invoice?")) {
        const { error: deleteError } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoiceId);

        if (deleteError) throw deleteError;

        setInvoices(prevInvoices => prevInvoices.filter(inv => inv.id !== invoiceId));
      }
    } catch (err) {
      setError(`Failed to delete invoice: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#282f41] rounded-xl">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Your Saved Invoices</h1>
        <div className="flex items-center gap-4">
          <ExportButton data={invoices} filename="invoices_export.csv" disabled={invoices.length === 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50">
            <Download size={16} /><span>Export to CSV</span>
          </ExportButton>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400"><Loader2 className="animate-spin h-8 w-8 mx-auto" /></div>
      ) : error ? (
        <div className="text-center py-16 text-red-400"><AlertTriangle className="h-10 w-10 mx-auto mb-2" /><p>{error}</p></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-700 rounded-lg"><FileText className="h-12 w-12 mx-auto mb-2 text-gray-600" /><h3 className="text-lg font-semibold">No Invoices Found</h3></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="bg-gray-800 text-xs text-gray-400 uppercase">
              <tr>
                <th scope="col" className="px-6 py-3">Vendor</th>
                <th scope="col" className="px-6 py-3">Invoice ID</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="bg-gray-900/50 border-b border-gray-800 hover:bg-gray-800/60">
                  <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{invoice.vendor || 'N/A'}</td>
                  <td className="px-6 py-4">{invoice.invoice_id}</td>
                  <td className="px-6 py-4">{new Date(invoice.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-mono text-right text-green-400">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-4">
                      {/* The Edit button has been removed */}
                      <button onClick={() => handleDeleteInvoice(invoice.id)} title="Delete Invoice" className="text-red-400 hover:text-red-300 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* The EditInvoiceModal component has been removed from here */}
    </div>
  );
};

export default InvoicesPage;