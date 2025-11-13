import { useState, useEffect } from 'react';
import { supabase } from '../config/supabaseClient'; // Adjust path if needed
import {
  Calendar as CalendarIcon, ChevronDown, MoreVertical, Building, Loader2, AlertTriangle, FileText, Download
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid
} from 'recharts';
import ExportButton from '../components/ExportButton'; // Make sure path is correct

// A reusable KPI card component, styled for this page
const KpiCard = ({ title, value }) => (
  <div className="bg-[#282f41] p-6 rounded-lg">
    <p className="text-sm text-gray-400">{title}</p>
    <p className="text-3xl font-bold text-white mt-1">{value}</p>
  </div>
);

const AnalyticsPage = () => {
  // State for filter selections
  const [dateRange, setDateRange] = useState('all');
  const [vendorList, setVendorList] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('all');

  // State for data, loading, and errors
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportData, setExportData] = useState([]);

  // This effect runs ONCE to fetch the unique list of vendors for the dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('vendor')
        .eq('user_id', user.id);
      
      if (error) {
        console.error("Could not fetch vendors for filter:", error);
      } else if (data) {
        const uniqueVendors = [...new Set(data.map(item => item.vendor).filter(Boolean))].sort();
        setVendorList(uniqueVendors);
      }
    };
    fetchVendors();
  }, []);

  // This effect re-runs whenever the 'dateRange' or 'selectedVendor' state changes
  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated.");

        let query = supabase.from('invoices').select('vendor, date, amount').eq('user_id', user.id);

        if (dateRange !== 'all') {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - parseInt(dateRange));
          query = query.gte('date', startDate.toISOString());
        }
        if (selectedVendor !== 'all') {
          query = query.eq('vendor', selectedVendor);
        }

        const { data: rawInvoices, error: fetchError } = await query;
        if (fetchError) throw fetchError;

        if (!rawInvoices || rawInvoices.length === 0) {
          setAnalyticsData({
            totalAmountProcessed: 0, totalInvoices: 0,
            topSpendingVendor: { name: 'N/A', spending: 0 },
            scatterPlotData: [], donutChartData: [], recentInvoices: [],
          });
          setExportData([]);
          return;
        }

        // --- DATA PROCESSING LOGIC ---
        const totalAmountProcessed = rawInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
        const totalInvoices = rawInvoices.length;

        const vendorSpending = rawInvoices.reduce((acc, inv) => {
          if (inv.vendor) { acc[inv.vendor] = (acc[inv.vendor] || 0) + (inv.amount || 0); }
          return acc;
        }, {});
        
        const COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#9ca3af']; // Indigo, Purple, Gray shades
        const donutChartData = Object.keys(vendorSpending).map((vendor, index) => ({
          name: vendor,
          value: vendorSpending[vendor],
          fill: COLORS[index % COLORS.length]
        }));

        let topSpendingVendor = { name: 'N/A', spending: 0 };
        if (Object.keys(vendorSpending).length > 0) {
          const topVendorName = Object.keys(vendorSpending).reduce((a, b) => vendorSpending[a] > vendorSpending[b] ? a : b);
          topSpendingVendor = { name: topVendorName, spending: vendorSpending[topVendorName] };
        }
        
        const scatterPlotData = rawInvoices.map(inv => ({ x: inv.date, y: inv.amount, vendor: inv.vendor }));
        const recentInvoices = rawInvoices.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);
        
        setAnalyticsData({
          totalAmountProcessed, totalInvoices, topSpendingVendor,
          scatterPlotData, donutChartData, recentInvoices,
        });

        const formattedExportData = [
          { metric: "Total Amount Processed (USD)", value: totalAmountProcessed.toFixed(2) },
          { metric: "Total Invoices Saved", value: totalInvoices },
          { metric: "Top Vendor", value: topSpendingVendor.name },
          { metric: "Top Vendor Spending (USD)", value: topSpendingVendor.spending.toFixed(2) },
        ];
        setExportData(formattedExportData);

      } catch (err) {
        setError(err.message || "An error occurred while fetching analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [dateRange, selectedVendor]);

  // --- RENDER LOGIC for different states ---
  if (loading) {
    return <div className="p-8 text-center text-gray-400 flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 mr-3" /><span>Loading Analytics...</span></div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-400 bg-red-900/20 rounded-lg flex flex-col items-center justify-center h-64"><AlertTriangle className="h-10 w-10 mb-4" /><p className="font-semibold">An Error Occurred</p><p>{error}</p></div>;
  }
  
  if (!analyticsData) {
    return <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-700 rounded-lg h-64 flex flex-col justify-center items-center"><FileText className="h-12 w-12 mb-4 text-gray-600" /><h3 className="text-xl font-semibold text-white">No Invoice Data</h3><p className="mt-1">Save some invoices to see your analytics dashboard.</p></div>;
  }
  
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none cursor-pointer rounded-lg bg-gray-800 pl-9 pr-8 py-2 text-sm text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
              <option value="all">All Time</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="appearance-none cursor-pointer rounded-lg bg-gray-800 pl-9 pr-8 py-2 text-sm text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Vendors</option>
              {vendorList.map(vendor => (<option key={vendor} value={vendor}>{vendor}</option>))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <ExportButton
            data={exportData}
            filename="analytics_summary.csv"
            disabled={!exportData || exportData.length === 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
            <Download size={16} /><span>Export Summary</span>
        </ExportButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard title="Total Amount Processed" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(analyticsData.totalAmountProcessed)} />
        <KpiCard title="Total Invoices" value={analyticsData.totalInvoices} />
        <div className="bg-[#282f41] p-6 rounded-lg">
          <p className="text-sm text-gray-400">Top Spending Vendor</p>
          <p className="text-xl font-bold text-white mt-1 truncate">{analyticsData.topSpendingVendor.name}</p>
          <p className="text-sm text-green-500 mt-2">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(analyticsData.topSpendingVendor.spending)}</p>
        </div>
      </div>
      
      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Vendor (Donut Chart) */}
        <div className="bg-[#282f41] p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white">Spending by Vendor</h3>
          <p className="text-sm text-gray-400">Distribution of total spending</p>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.donutChartData}
                  cx="50%" cy="50%"
                  innerRadius={80} outerRadius={110}
                  fill="#8884d8" paddingAngle={5}
                  dataKey="value" nameKey="name"
                >
                  {analyticsData.donutChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  cursor={{ fill: 'rgba(75, 85, 99, 0.2)' }} 
                  contentStyle={{  backgroundColor: '#ffffffff', border: '1px solid #374151', borderRadius: '0.5rem' }}
                  formatter={(value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9CA3AF' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Invoice Outliers (Scatter Plot) */}
        <div className="bg-[#282f41] p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white">Invoice Outliers</h3>
          <p className="text-sm text-gray-400">Each dot represents an invoice</p>
          <div className="h-80 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="x" type="category" name="Date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short' })} stroke="#9CA3AF" />
                <YAxis dataKey="y" type="number" name="Amount" tickFormatter={(tick) => `$${tick >= 1000 ? `${tick/1000}k` : tick}`} stroke="#9CA3AF" />
                <Tooltip
                  cursor={{ stroke: '#818cf8', strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: '#fefefeff', border: '1px solid #374151' }}
                  formatter={(value, name) => {
                      if (name === 'Amount') return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
                      if (name === 'Date') return new Date(value).toLocaleDateString();
                      return value;
                  }}
                />
                <Scatter name="Invoices" data={analyticsData.scatterPlotData} fill="#818cf8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Invoices Table */}
      <div className="bg-[#282f41] p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Invoices (Filtered)</h3>
        <div className="overflow-x-auto">
          {analyticsData.recentInvoices.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-4">Vendor</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-gray-200">
                {analyticsData.recentInvoices.map((invoice, index) => (
                  <tr key={index} className="hover:bg-gray-800/60">
                    <td className="p-4 font-medium">{invoice.vendor}</td>
                    <td className="p-4">{new Date(invoice.date).toLocaleDateString()}</td>
                    <td className="p-4 font-mono">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}</td>
                    <td className="p-4 text-right"><button><MoreVertical size={16} className="text-gray-500 hover:text-white" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-8">No invoices found for the selected filters.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;