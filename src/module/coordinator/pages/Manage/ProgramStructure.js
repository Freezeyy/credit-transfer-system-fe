import React, { useEffect, useState } from "react";
import { getProgramStructure, uploadProgramStructure } from "../../hooks/useManageStructureCourses";

export default function ProgramStructure() {
  const [structure, setStructure] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStructure();
  }, []);

  async function loadStructure() {
    setLoading(true);
    const res = await getProgramStructure();
    
    if (res.success) {
      setStructure(res.data.program?.program_structure || null);
    }
    setLoading(false);
  }

  async function handleUpload() {
    if (!pdfFile) return alert("Select file first");

    const formData = new FormData();
    formData.append("program_structure", pdfFile);

    const res = await uploadProgramStructure(formData);
    if (res.success) {
      await loadStructure();
      setPdfFile(null);
      alert("Program structure uploaded successfully!");
    } else {
      alert(res.message || "Upload failed");
    }
  }

  return (
    <div className="p-5">
      <h1 className="text-2xl font-semibold mb-5">Manage Program Structure</h1>

      <div className="bg-white rounded-xl shadow p-5">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : !structure ? (
          <div>
            <p className="text-gray-700 mb-3">No program structure uploaded.</p>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="border p-2 rounded"
              />
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                onClick={handleUpload}
                disabled={!pdfFile}
              >
                Upload PDF
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">Current Program Structure</h2>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="border p-2 rounded"
              />
              <button
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
                onClick={handleUpload}
                disabled={!pdfFile}
              >
                Replace PDF
              </button>
            </div>

            <div className="border rounded-xl overflow-hidden h-[600px]">
              <iframe
                src={`${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}${structure}`}
                title="Program Structure PDF"
                className="w-full h-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

