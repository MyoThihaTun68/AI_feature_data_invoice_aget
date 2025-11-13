import { useState, useEffect } from 'react';
import { Check, Cloud, AlertTriangle, FileText, Edit, X } from 'lucide-react';
import { supabase } from '../config/supabaseClient'; 

const AiParseResults = ({ results, isLoading, onSaveSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editableResults, setEditableResults] = useState(null);

  // This effect correctly synchronizes the local state with the incoming prop.
  useEffect(() => {
    setEditableResults(results);
    if (results) {
      setIsEditing(false);
      setSaveSuccess(false);
      setSaveError('');
    }
  }, [results]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableResults(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setEditableResults(results);
    setIsEditing(false);
  };

  const handleSaveToSupabase = async () => {
    if (!editableResults) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to save an invoice.');

      const invoiceData = {
        user_id: user.id,
        vendor: editableResults.vendor_name,
        invoice_id: editableResults.invoice_id,
        amount: parseFloat(editableResults.total_amount) || 0,
        date: editableResults.invoice_date,
        raw_text: editableResults.raw_text,
      };

      const { data: insertedData, error } = await supabase
        .from('invoices').insert([invoiceData]).select().single();

      if (error) {
        if (error.code === '23505') throw new Error('This invoice ID has already been saved.');
        throw error;
      }
      
      setSaveSuccess(true);
      setIsEditing(false);
      if (onSaveSuccess && insertedData) onSaveSuccess(insertedData);

    } catch (err) {
      setSaveError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Loading State
  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-white">Parsed Invoice Data</h2>
        <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  // Placeholder State (when no results are available)
  if (!editableResults) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex flex-col items-center justify-center text-center h-full border-2 border-dashed border-gray-700 rounded-lg p-12">
          <FileText className="h-16 w-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white">AI Results Will Appear Here</h3>
          <p className="mt-2 text-gray-400">
            Submit an invoice to begin the parsing process.
          </p>
        </div>
      </div>
    );
  }

  // --- Main Render Logic ---
  return (
    <div className="bg-gray-800 p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Parsed Invoice Data</h2>
        {isEditing ? (
            <button onClick={handleCancelEdit} className="flex items-center text-sm text-gray-400 hover:text-white">
                <X size={16} className="mr-1" /> Cancel
            </button>
        ) : (
            !saveSuccess && (
              <button onClick={() => setIsEditing(true)} className="flex items-center text-sm text-indigo-400 hover:text-indigo-300">
                  <Edit size={16} className="mr-1" /> Edit
              </button>
            )
        )}
      </div>
      
      {isEditing ? (
        // --- THIS IS THE FIX ---
        // The JSX for the full edit form is now correctly in place.
        <div className="space-y-4 text-gray-300 bg-gray-900/50 p-4 rounded-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Vendor</label>
              <input type="text" name="vendor_name" value={editableResults.vendor_name || ''} onChange={handleChange} className="w-full mt-1 p-2 bg-[#1A1B1E] border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Invoice ID</label>
              <input type="text" name="invoice_id" value={editableResults.invoice_id || ''} onChange={handleChange} className="w-full mt-1 p-2 bg-[#1A1B1E] border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400">Date</label>
              <input type="date" name="invoice_date" value={editableResults.invoice_date || ''} onChange={handleChange} className="w-full mt-1 p-2 bg-[#1A1B1E] border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex gap-2">
              <div className="flex-grow">
                <label className="text-xs text-gray-400">Amount</label>
                <input type="number" step="0.01" name="total_amount" value={editableResults.total_amount || ''} onChange={handleChange} className="w-full mt-1 p-2 bg-[#1A1B1E] border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Currency</label>
                <input type="text" name="currency" value={editableResults.currency || ''} onChange={handleChange} className="w-20 mt-1 p-2 bg-[#1A1B1E] border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // DISPLAY MODE: Show static text
        <div className="space-y-3 text-gray-300 bg-gray-900/50 p-4 rounded-md">
          <p><strong>Vendor:</strong> {editableResults.vendor_name}</p>
          <p><strong>Invoice ID:</strong> {editableResults.invoice_id}</p>
          <p><strong>Date:</strong> {editableResults.invoice_date}</p>
          <p>
            <strong>Amount:</strong> {editableResults.currency} {parseFloat(editableResults.total_amount)?.toFixed(2) || '0.00'}
          </p>
        </div>
      )}

      {/* Raw Text Section (now also editable) */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Extracted Raw Text</h3>
        <textarea
          readOnly={!isEditing}
          name="raw_text"
          value={editableResults.raw_text || ""}
          onChange={handleChange}
          className={`w-full h-48 p-3 bg-[#1A1B1E] border border-slate-700 rounded-lg text-gray-400 text-sm focus:outline-none 
            ${isEditing ? 'focus:ring-2 focus:ring-indigo-500' : 'focus:ring-0'}
          `}
        />
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={handleSaveToSupabase}
          disabled={isSaving || saveSuccess}
          className={`w-full flex items-center justify-center py-3 px-4 rounded-lg font-semibold transition-all duration-200 
            ${saveSuccess ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}
            text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saveSuccess ? (
            <><Check size={18} className="mr-2" />Saved Successfully!</>
          ) : isSaving ? (
            'Saving...'
          ) : (
            <><Cloud size={18} className="mr-2" />{isEditing ? 'Save Changes to Cloud' : 'Save to Cloud'}</>
          )}
        </button>
        {saveError && (
          <p className="text-sm text-red-400 mt-3 text-center flex items-center justify-center">
            <AlertTriangle size={16} className="mr-2" />
            {saveError}
          </p>
        )}
      </div>
    </div>
  );
};

export default AiParseResults;