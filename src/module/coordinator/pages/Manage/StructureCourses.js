import React, { useEffect, useState } from "react";
import { getProgramStructure, uploadProgramStructure, updateCourses } from "../../hooks/useManageStructureCourses";

export default function StructureCourses() {
  const [activeTab, setActiveTab] = useState("structure");
  const [structure, setStructure] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const res = await getProgramStructure();
    if (res.success && res.data.length > 0) {
      setStructure(res.data[0]);
      setCourses(res.data[0].courses || []);
    }
  }

  async function handleUpload() {
    if (!pdfFile) return alert("Select file first");

    const formData = new FormData();
    formData.append("program_structure", pdfFile);

    const res = await uploadProgramStructure(formData);
    if (res.success) {
      await loadData();
      setPdfFile(null);
    } else alert(res.message);
  }

  function updateCourseField(index, field, value) {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  }

  function addCourseRow() {
    setCourses([
      ...courses,
      { code: "", name: "", credits: "", transfer_notes: "", allow_transfer: true }
    ]);
  }

  function removeCourseRow(index) {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  }

  async function saveCourses() {
    if (!structure) return alert("No program structure found");

    const payload = { courses };

    const res = await updateCourses(structure.id, payload);
    if (res.success) loadData();
    else alert(res.message);
  }

  return (
    <div className="p-5">

      <h1 className="text-2xl font-semibold mb-5">Manage Program Structure</h1>

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${activeTab === "structure"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
            }`}
          onClick={() => setActiveTab("structure")}
        >
          Program Structure (PDF)
        </button>

        <button
          className={`px-4 py-2 rounded-lg ${activeTab === "courses"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
            }`}
          onClick={() => setActiveTab("courses")}
        >
          Courses
        </button>
      </div>

      {/* TAB: PROGRAM STRUCTURE */}
      {activeTab === "structure" && (
        <div className="bg-white rounded-xl shadow p-5">

          {!structure && (
            <div>
              <p className="text-gray-700 mb-3">No program structure uploaded.</p>

              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
              />

              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg ml-3"
                onClick={handleUpload}
              >
                Upload PDF
              </button>
            </div>
          )}

          {structure && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-semibold">Current Program Structure</h2>

                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />

                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                  onClick={handleUpload}
                >
                  Replace PDF
                </button>
              </div>

              <div className="border rounded-xl overflow-hidden h-[600px]">
                <iframe
                  src={`http://localhost:3000${structure.pdf_path}`}
                  title="PDF Viewer"
                  className="w-full h-full"
                />
              </div>
            </>
          )}

        </div>
      )}

      {/* TAB: COURSES */}
      {activeTab === "courses" && (
        <div className="bg-white rounded-xl shadow p-5">

          {!structure && (
            <p className="text-gray-600">Upload a program structure first.</p>
          )}

          {structure && (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Courses</h2>

                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg"
                  onClick={addCourseRow}
                >
                  + Add Course
                </button>
              </div>

              <div className="overflow-auto max-h-[600px] border rounded-lg">

                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left">Credits</th>
                      {/* <th className="p-3 text-left">Transfer Notes</th> */}
                      <th className="p-3 text-left">Allow</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {courses.map((c, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-3">
                          <input
                            className="border p-2 rounded w-full"
                            value={c.code}
                            onChange={(e) =>
                              updateCourseField(i, "code", e.target.value)
                            }
                          />
                        </td>

                        <td className="p-3">
                          <input
                            className="border p-2 rounded w-full"
                            value={c.name}
                            onChange={(e) =>
                              updateCourseField(i, "name", e.target.value)
                            }
                          />
                        </td>

                        <td className="p-3">
                          <input
                            type="number"
                            className="border p-2 rounded w-full"
                            value={c.credits}
                            onChange={(e) =>
                              updateCourseField(i, "credits", e.target.value)
                            }
                          />
                        </td>

                        {/* <td className="p-3">
                          <input
                            className="border p-2 rounded w-full"
                            value={c.transfer_notes}
                            onChange={(e) =>
                              updateCourseField(i, "transfer_notes", e.target.value)
                            }
                          />
                        </td> */}

                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={c.allow_transfer}
                            onChange={(e) =>
                              updateCourseField(i, "allow_transfer", e.target.checked)
                            }
                          />
                        </td>

                        <td className="p-3">
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => removeCourseRow(i)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>

              <button
                className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg"
                onClick={saveCourses}
              >
                Save Courses
              </button>
            </>
          )}
        </div>
      )}

    </div>
  );
}
