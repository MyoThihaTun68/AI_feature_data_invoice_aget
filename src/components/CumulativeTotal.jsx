const CumulativeTotal = ({ value, isLoading }) => { // Accept the isLoading prop
  return (
    <div className="bg-[#282f41] p-6 rounded-xl border border-slate-800">
      <h3 className="text-sm font-medium text-gray-400">Cumulative Total Value</h3>
      {isLoading ? (
        // Show a simple loading skeleton
        <div className="h-10 w-40 bg-gray-700 rounded-md animate-pulse mt-2"></div>
      ) : (
        // Show the value when not loading
        <p className="mt-2 text-4xl font-semibold text-green-500">
          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
        </p>
      )}
    </div>
  );
};
export default CumulativeTotal;