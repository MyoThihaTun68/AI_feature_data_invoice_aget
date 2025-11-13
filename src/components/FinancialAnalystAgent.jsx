import { useState } from 'react';
import { supabase } from '../config/supabaseClient'; // Adjust path if needed
import { askFinancialAnalyst } from '../config/geminiInvoiceParser'; // Import our new function
import { Loader2, Sparkles } from 'lucide-react';

// --- NEW: A list of suggested questions ---
const suggestionQuestions = [
  "What is my total spending across all invoices?",
  "Who is my top vendor by total spending?",
  "What is the average amount of an invoice?",
  "How many invoices do I have from [Vendor Name]?", // A template question
];

const FinancialAnalystAgent = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setAnswer('');
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required.");

      const { data: invoices, error: fetchError } = await supabase
        .from('invoices')
        .select('vendor, date, amount')
        .eq('user_id', user.id);
      
      if (fetchError) throw fetchError;

      if (!invoices || invoices.length === 0) {
        throw new Error("No invoice data found to analyze.");
      }

      const aiResponse = await askFinancialAnalyst(question, invoices);
      setAnswer(aiResponse);

    } catch (err) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: A function to handle clicking on a suggestion ---
  const handleSuggestionClick = (suggestion) => {
    setQuestion(suggestion);
  };

  return (
    <div className="bg-[#282f41] p-6 rounded-xl border border-slate-800">
      <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
        <Sparkles size={20} className="mr-2 text-indigo-400" />
        Ask the Financial Analyst Agent
      </h3>
      
      {/* Dynamic Answer Display Area (no changes here) */}
      <div className="p-4 mb-4 bg-[#1A1B1E] rounded-lg min-h-[80px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex items-center text-gray-400"><Loader2 size={18} className="animate-spin mr-2" /><span>Analyzing...</span></div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center">{error}</p>
        ) : answer ? (
          <p className="text-xl text-gray-200 text-center">{answer}</p>
        ) : (
          <p className="text-sm text-gray-500 text-center">Ask a question or try one of the suggestions below.</p>
        )}
      </div>

      {/* Input Form (no changes here) */}
      <form onSubmit={handleAsk} className="relative">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., What was my total spending this year?"
          disabled={isLoading}
          className="w-full p-3 pr-24 bg-[#1A1B1E] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none text-gray-300 disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={isLoading || !question.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Ask'}
        </button>
      </form>

      {/* --- NEW: Suggestions Section --- */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Try these suggestions:</p>
        <div className="flex flex-wrap gap-2">
          {suggestionQuestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isLoading}
              className="px-3 py-1 bg-gray-700/50 text-gray-300 text-sm rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalystAgent;