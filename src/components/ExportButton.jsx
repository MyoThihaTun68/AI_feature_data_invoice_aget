import { Download } from 'lucide-react';

// A more robust, reusable component to export an array of objects to a CSV file.
const ExportButton = ({ data, filename, children, className, ...props }) => {

  const handleExport = () => {
    // --- FIX 1: Enhanced Data Validation ---
    // We'll check more carefully if the data is valid before proceeding.
    if (!Array.isArray(data) || data.length === 0) {
      console.error("Export failed: The data is not an array or is empty.", data);
      alert("No valid data available to export.");
      return;
    }

    // For debugging: Log the data to the console so you can see what is being exported.
    console.log("Exporting data:", data);

    try {
      // --- FIX 2: Ensure all objects have keys ---
      // If the first item is not an object, we can't get headers.
      if (typeof data[0] !== 'object' || data[0] === null) {
        throw new Error("Data format is incorrect: array should contain objects.");
      }

      // 1. Get the headers from the first object's keys
      const headers = Object.keys(data[0]);
      
      // 2. Convert the array of objects to a CSV string
      const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
          headers.map(header => {
            // Ensure we handle non-existent keys gracefully in case objects have different shapes
            if (!row.hasOwnProperty(header)) {
              return '""';
            }
            let cell = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escape quotes by doubling them and wrap the entire cell in quotes
            cell = `"${cell.toString().replace(/"/g, '""')}"`;
            return cell;
          }).join(',')
        )
      ].join('\n');

      // 3. Create a Blob and trigger a download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      
      // This part of the logic was already correct
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename || 'export.csv'); // Add a fallback filename
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      // --- FIX 3: Catch and display any errors ---
      // This will alert you if something goes wrong during the CSV conversion.
      console.error("Failed to generate CSV:", error);
      alert(`An error occurred during the export: ${error.message}`);
    }
  };

  return (
    <button onClick={handleExport} className={className} {...props}>
      {children}
    </button>
  );
};

export default ExportButton;