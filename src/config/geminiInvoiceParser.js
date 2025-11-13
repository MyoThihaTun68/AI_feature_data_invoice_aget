import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("CRITICAL: VITE_GEMINI_API_KEY is not found in your .env file. Please check the file and restart the server.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const parseInvoiceWithGemini = async ({ file, text }) => { 
  // Using a powerful multimodal model is correct for this function
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); 
  
  let requestPayload;

  const jsonPrompt = `
    You are a precise data extraction bot. Analyze the invoice (image or text).
    Extract the following fields exactly as specified:
    - vendor_name: The name of the company that sent the invoice.
    - invoice_id: The unique invoice number or ID.
    - invoice_date: The primary date of the invoice (format as YYYY-MM-DD if possible).
    - total_amount: The final total amount due. This MUST be a number.
    - currency: The currency symbol or code (e.g., '$', 'USD', '€').
    - raw_text: The full, raw text content of the entire invoice as a single string.

    Return ONLY a valid, minified JSON object with these exact keys.
    If a field is not found, use "N/A" for strings and 0 for the amount.

    Example response: {"vendor_name":"Example Corp","invoice_id":"INV-123","invoice_date":"2023-10-28","total_amount":450.75,"currency":"$","raw_text":"INVOICE\\n..."}
  `;

  if (file) {
    const imagePart = await fileToGenerativePart(file);
    requestPayload = [jsonPrompt, imagePart];
  } else if (text) {
    requestPayload = `${jsonPrompt}\n\nInvoice Text:\n${text}`;
  } else {
    throw new Error("You must provide either a file or text to parse.");
  }

  try {
    const result = await model.generateContent(requestPayload);
    const response = await result.response;
    const responseText = response.text();

    const cleanedText = responseText.replace(/^```json\s*|```\s*$/g, '').trim();
    if (!cleanedText) { throw new Error("The AI returned an empty response."); }

    const parsedJson = JSON.parse(cleanedText);

    if (text && !parsedJson.raw_text) {
      parsedJson.raw_text = text;
    }
    if (typeof parsedJson.total_amount !== 'number') {
      parsedJson.total_amount = 0;
    }

    return parsedJson;

  } catch (error) {
    console.error("FULL ERROR during Gemini parsing:", error);
    throw new Error("Failed to parse with AI. Check the browser console for details.");
  }
};


// --- THIS IS THE FINAL, HIGH-ACCURACY FINANCIAL ANALYST FUNCTION ---
export const askFinancialAnalyst = async (question, invoices) => {
  // Use a powerful text-based model for complex reasoning. 'gemini-pro' is ideal.
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const dataContext = JSON.stringify(
    invoices.map(inv => ({
      vendor: inv.vendor,
      date: inv.date,
      amount: inv.amount
    })),
    null,
    2
  );

  // --- THE "FEW-SHOT" PROMPT FOR MAXIMUM ACCURACY ---
  // We provide concrete examples to train the model on the expected behavior.
  const prompt = `
    You are a highly precise, automated financial data analysis engine. Your ONLY function is to execute a user's query against a provided JSON dataset of their invoices. You must follow the provided examples perfectly.

    **--- EXAMPLE 1: CALCULATION ---**
    <DATA>
    [
      { "vendor": "Innovate Inc.", "date": "2025-10-26", "amount": 2500.00 },
      { "vendor": "Quantum Solutions", "date": "2025-10-25", "amount": 1200.50 },
      { "vendor": "Innovate Inc.", "date": "2025-09-15", "amount": 1800.00 }
    ]
    </DATA>
    <USER_QUESTION>
    What is my total spending with Innovate Inc.?
    </USER_QUESTION>
    **RESPONSE:**
    Your total spending with Innovate Inc. is $4,300.00.

    **--- EXAMPLE 2: UNSUPPORTED QUESTION ---**
    <DATA>
    [
      { "vendor": "Innovate Inc.", "date": "2025-10-26", "amount": 2500.00 },
      { "vendor": "Quantum Solutions", "date": "2025-10-25", "amount": 1200.50 }
    ]
    </DATA>
    <USER_QUESTION>
    What is the status of my invoice from Quantum Solutions?
    </USER_QUESTION>
    **RESPONSE:**
    I cannot answer that question with the available data.

    **--- EXAMPLE 3: RANKING ---**
    <DATA>
    [
      { "vendor": "Apex Corp.", "date": "2025-10-22", "amount": 850.75 },
      { "vendor": "Stellar Goods", "date": "2025-10-20", "amount": 3150.00 }
    ]
    </DATA>
    <USER_QUESTION>
    Who is my top vendor?
    </USER_QUESTION>
    **RESPONSE:**
    Your top vendor by spending is Stellar Goods.

    **--- YOUR TASK ---**
    Now, answer the following user question based ONLY on the data provided below. Follow the examples perfectly.

    <DATA>
    ${dataContext}
    </DATA>
    
    <USER_QUESTION>
    ${question}
    </USER_QUESTION>
    
    **RESPONSE:**
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    if (!answer) {
        throw new Error("The AI returned an empty answer.");
    }
    
    return answer.trim();

  } catch (error) {
    console.error("FULL ERROR during Financial Analyst API call:", error);
    throw new Error("The AI analyst could not be reached. Please check the console for details.");
  }
};