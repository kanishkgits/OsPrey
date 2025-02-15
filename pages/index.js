import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [pastReports, setPastReports] = useState([]);

  useEffect(() => {
    const savedReports = JSON.parse(localStorage.getItem("pastReports")) || [];
    setPastReports(savedReports);
  }, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  const clearPastReports = () => {
    setPastReports([]);
    localStorage.removeItem("pastReports");
  };

  const extractKeyValues = (text) => {
    return {
      Hemoglobin: text.match(/Hemoglobin[:\s]*([\d.]+)/i)?.[1] || "N/A",
      RBC: text.match(/RBC[:\s]*([\d.]+)/i)?.[1] || "N/A",
      WBC: text.match(/WBC[:\s]*([\d.]+)/i)?.[1] || "N/A",
      PlateletCount: text.match(/Platelet\s*Count[:\s]*([\d,]+)/i)?.[1] || "N/A",
    };
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert("Please select a file");

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch("/api/extract", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    setExtractedText(data.text);
    setLoading(false);

    const extractedValues = extractKeyValues(data.text);
    const newReport = { fileName: selectedFile.name, extractedValues };
    const updatedReports = [...pastReports, newReport];

    setPastReports(updatedReports);
    localStorage.setItem("pastReports", JSON.stringify(updatedReports));
  };

  const downloadCSV = () => {
    const csvContent =
      "Parameter,Value\n" +
      Object.entries(extractKeyValues(extractedText))
        .map(([key, value]) => `${key},${value}`)
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "blood_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Blood Report", 10, 10);
    autoTable(doc, {
      startY: 20,
      head: [["Parameter", "Value"]],
      body: Object.entries(extractKeyValues(extractedText)),
    });
    doc.save("blood_report.pdf");
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-gray-100">
      <div className="shadow-lg rounded-xl p-6 max-w-lg w-full text-center bg-white">
        <h1 className="text-3xl font-bold text-blue-600">🩸 Blood Report Parser</h1>

        <label className="cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-blue-600 transition mt-4 inline-block">
          Choose File
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>

        {previewURL && (
          <div className="mt-4">
            <img src={previewURL} alt="Preview" className="max-w-xs mx-auto rounded-lg shadow" />
          </div>
        )}

        <button
          onClick={handleUpload}
          className={`mt-4 bg-green-500 text-white py-2 px-6 rounded-lg shadow-md ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:bg-green-600"
          } transition`}
          disabled={loading}
        >
          {loading ? "Extracting..." : "Extract Report Data"}
        </button>

        {loading && <div className="mt-4 animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>}

        {extractedText && (
          <div className="mt-6 p-4 bg-gray-50 border rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800">Extracted Data:</h2>
            <table className="w-full mt-2 border-collapse border border-gray-300">
              <tbody>
                {Object.entries(extractKeyValues(extractedText)).map(([key, value], index) => (
                  <tr key={index} className="border border-gray-300">
                    <td className="p-2 font-semibold">{key}</td>
                    <td className="p-2">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {extractedText && (
          <div className="mt-4 flex justify-center gap-4">
            <button onClick={downloadCSV} className="bg-yellow-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-yellow-600">
              Download CSV
            </button>
            <button onClick={downloadPDF} className="bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600">
              Download PDF
            </button>
          </div>
        )}
      </div>

      {pastReports.length > 0 && (
  <div className="mt-10 max-w-lg w-full">
    <h2 className="text-xl font-bold mb-2">📜 Past Reports</h2>
    <div className="bg-gray-200 p-4 rounded-lg shadow">
      {pastReports.map((report, index) => (
        <div key={index} className="p-2 border-b last:border-none">
          <p className="font-semibold">{report.fileName}</p>
          <p className="text-sm text-gray-600">Hemoglobin: {report.extractedValues.Hemoglobin}</p>
        </div>
      ))}
    </div>
    <button 
      onClick={clearPastReports} 
      className="mt-4 bg-red-500 text-white py-2 px-4 rounded-lg shadow-md hover:bg-red-600">
      Clear Past Reports
    </button>
  </div>
)}

    </div>
  );
}
