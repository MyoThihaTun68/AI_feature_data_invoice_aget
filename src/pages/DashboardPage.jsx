import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient'; // Adjust path if needed

// Import all your dashboard components
import InvoiceHistory from '../components/InvoiceHistory';
import InvoiceDataInput from '../components/InvoiceDataInput';
import AiParseResults from '../components/AiParseResults';
import FinancialAnalystAgent from '../components/FinancialAnalystAgent';
import CumulativeTotal from '../components/CumulativeTotal'; // Assuming this is now in its own file
import InvoiceStats from '../components/InvoiceStats'; // And you have this component too

const DashboardPage = () => {
  // State for the AI parsing flow
  const [parsedResults, setParsedResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For AI parsing specifically
  
  // State for the dashboard's initial data load
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  
  // State for the dynamic data components
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [cumulativeTotal, setCumulativeTotal] = useState(0);
  const [totalInvoices, setTotalInvoices] = useState(0);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsDashboardLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsDashboardLoading(false); // Stop loading if no user
          return;
        }

        // --- THIS IS YOUR WORKING, SIMPLER APPROACH, OPTIMIZED WITH Promise.all ---
        const [historyRes, allInvoicesRes] = await Promise.all([
          // Fetch the 10 most recent invoices for the history list
          supabase
            .from('invoices')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          // Fetch just the 'amount' column from ALL invoices to calculate the total
          supabase
            .from('invoices')
            .select('amount')
            .eq('user_id', user.id)
        ]);

        if (historyRes.error) throw historyRes.error;
        if (allInvoicesRes.error) throw allInvoicesRes.error;
        
        const recentInvoices = historyRes.data;
        const allInvoices = allInvoicesRes.data;

        // Set the history and select the first item
        setInvoiceHistory(recentInvoices);
        if (recentInvoices && recentInvoices.length > 0) {
            setSelectedInvoiceId(recentInvoices[0].id);
        }

        // Calculate the total and set the count from the fetched data
        const total = allInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        setCumulativeTotal(total);
        setTotalInvoices(allInvoices.length);

      } catch (error) {
        console.error("Error fetching initial dashboard data:", error);
      } finally {
        setIsDashboardLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);

  // Callback function for when a new invoice is saved
  const handleSaveSuccess = (newlySavedInvoice) => {
    setInvoiceHistory(prev => [newlySavedInvoice, ...prev].slice(0, 10));
    setCumulativeTotal(prev => prev + (newlySavedInvoice.amount || 0));
    setTotalInvoices(prev => prev + 1);
    setSelectedInvoiceId(newlySavedInvoice.id);
    setParsedResults(null);
  };

  return (
    <div className="text-white p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">AI Invoice Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <InvoiceDataInput
            setIsLoading={setIsLoading}
            setParsedResults={setParsedResults}
            parentIsLoading={isLoading}
          />
          <AiParseResults
            results={parsedResults}
            isLoading={isLoading}
            onSaveSuccess={handleSaveSuccess}
          />
          <FinancialAnalystAgent />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <InvoiceStats 
            totalInvoices={totalInvoices} 
            isLoading={isDashboardLoading} 
          />
          <CumulativeTotal 
            value={cumulativeTotal} 
            isLoading={isDashboardLoading}
          />
          <InvoiceHistory
            invoices={invoiceHistory}
            selectedId={selectedInvoiceId}
            onInvoiceSelect={setSelectedInvoiceId}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;