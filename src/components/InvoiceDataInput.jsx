import { useState } from "react";
import { UploadCloud, Zap, File, X } from "lucide-react";
import { processFile } from "../utils/fileProcessor"; // Adjust path if needed
import { parseInvoiceWithGemini } from "../config/geminiInvoiceParser"; // Adjust path

/**
 * A component for user input, handling both raw text and various file formats.
 * It is controlled by a parent component, receiving state setters as props.
 * @param {object} props
 * @param {Function} props.setIsLoading - Function to set the parent's loading state.
 * @param {Function} props.setParsedResults - Function to set the parent's parsed results state.
 * @param {boolean} props.parentIsLoading - The parent component's current loading status.
 */
const InvoiceDataInput = ({ setIsLoading, setParsedResults, parentIsLoading }) => {
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Max size is 5MB.");
      setInvoiceFile(null);
    } else {
      setInvoiceFile(file);
      setRawText(""); // Clear text area if a file is selected
      setError("");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Max size is 5MB.");
      setInvoiceFile(null);
    } else {
      setInvoiceFile(file);
      setRawText("");
      setError("");
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  // Function to clear the currently selected file
  const handleClearFile = () => {
    setInvoiceFile(null);
  };

  // Helper function to format file size into a readable string
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Main function to trigger the AI parsing
  const handleParse = async () => {
    if (!invoiceFile && !rawText.trim()) {
      setError("Please upload a file or paste invoice text.");
      return;
    }

    // Use the props to update the parent's state
    setIsLoading(true);
    setParsedResults(null); 
    setError("");

    try {
      let results;
      if (invoiceFile) {
        // Process the file to extract text if needed (for DOCX, XLSX, etc.)
        const processed = await processFile(invoiceFile);
        if (processed.type === 'file') {
          // Send the file object directly for images/PDFs
          results = await parseInvoiceWithGemini({ file: processed.content });
        } else {
          // Send the extracted text content for other file types
          results = await parseInvoiceWithGemini({ text: processed.content });
        }
      } else {
        // Handle the case where the user pasted raw text
        results = await parseInvoiceWithGemini({ text: rawText });
      }
      setParsedResults(results);
    } catch (err) {
      setError(err.message || "Parsing failed. Check the console.");
      setParsedResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#282f41] p-6 rounded-xl border border-slate-800">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Invoice Data Input</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Raw Text Input Section */}
        <div>
          <label className="text-sm font-medium text-gray-400">Raw Invoice Text</label>
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setInvoiceFile(null); // Clear file if user types
            }}
            className="w-full h-40 mt-2 p-3 bg-[#1A1B1E] border border-slate-700 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:outline-none text-gray-300"
            placeholder="Paste raw invoice text here..."
          />
        </div>

        {/* File Upload Section */}
        <div onDrop={handleDrop} onDragOver={handleDragOver} className="relative">
          <label className="text-sm font-medium text-gray-400">Or Upload Invoice Document</label>
          <div className="mt-2 flex justify-center items-center w-full h-40 border-2 border-dashed border-slate-700 rounded-lg hover:border-[#4F46E5] transition-colors duration-200 p-4">
            <input
              type="file"
              accept="image/png, image/jpeg, application/pdf, .csv, .docx, .xlsx, .xls"
              className="absolute w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              key={invoiceFile ? invoiceFile.name : 'empty'} // Reset input when file is cleared
            />
            {invoiceFile ? (
              // If a file IS selected, display its details
              <div className="text-center w-full">
                <File className="mx-auto h-10 w-10 text-green-500" />
                <p className="mt-2 text-sm text-gray-200 font-semibold truncate" title={invoiceFile.name}>
                  {invoiceFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(invoiceFile.size)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent file dialog from opening
                    handleClearFile();
                  }}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center mx-auto"
                >
                  <X size={14} className="mr-1" />
                  Click to Upload Different File
                </button>
              </div>
            ) : (
              // If NO file is selected, display the upload prompt
              <div className="text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-gray-500" />
                <p className="mt-2 text-sm text-gray-400">
                  <span className="font-semibold text-[#4F46E5]">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">IMG, PDF, DOCX, XLSX, CSV (MAX. 5MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-500 mt-4 text-center">{error}</p>}
      <button 
        onClick={handleParse}
        disabled={parentIsLoading || (!invoiceFile && !rawText.trim())}
        className="w-full mt-6 py-3 flex items-center justify-center bg-[#4F46E5] hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Zap size={18} className="mr-2" />
        {parentIsLoading ? "Parsing with Gemini..." : "Parse & Structure with AI"}
      </button>
    </div>
  );
};

export default InvoiceDataInput;