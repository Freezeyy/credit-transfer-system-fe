import React, { useState, useRef, useEffect } from "react";

export default function ApplyCT() {
  const [course, setCourse] = useState("");
  const [tableData, setTableData] = useState([]);
  const [showPDF, setShowPDF] = useState(false);
  const tableWrapperRef = useRef(null);
  const [isScrollable, setIsScrollable] = useState(false);

  const mockSubjects = {
    BSE: ["Math", "Physics", "Chemistry"],
    BNWS: ["Biology", "English", "Economics"],
    BCRM: ["Accounting", "Marketing", "Finance"]
  };

  // Adjust horizontal scroll based on table width
  useEffect(() => {
    const handleResize = () => {
      if (!tableWrapperRef.current) return;
      const tableWidth = tableWrapperRef.current.scrollWidth;
      const containerWidth = tableWrapperRef.current.clientWidth;
      setIsScrollable(tableWidth > containerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [tableData, showPDF]);

  const handleCourseChange = (e) => {
    setCourse(e.target.value);
    if (e.target.value) {
      setTableData([
        {
          id: Date.now(),
          currentSubject: "",
          pastSubjects: [{ id: Date.now() + 1, code: "", name: "", grade: "", syllabus: null }],
          status: "Pending"
        }
      ]);
    } else setTableData([]);
  };

  const handleCurrentSubjectChange = (rowId, value) => {
    setTableData(prev =>
      prev.map(row => (row.id === rowId ? { ...row, currentSubject: value } : row))
    );
  };

  const handlePastSubjectChange = (rowId, pastId, field, value) => {
    setTableData(prev =>
      prev.map(row => {
        if (row.id !== rowId) return row;
        const newPastSubjects = row.pastSubjects.map(p =>
          p.id === pastId ? { ...p, [field]: value } : p
        );
        return { ...row, pastSubjects: newPastSubjects };
      })
    );
  };

  const addTableRow = () => {
    setTableData(prev => [
      ...prev,
      {
        id: Date.now(),
        currentSubject: "",
        pastSubjects: [{ id: Date.now() + 1, code: "", name: "", grade: "", syllabus: null }],
        status: "Pending"
      }
    ]);
  };

  const removeTableRow = (rowId) => setTableData(prev => prev.filter(row => row.id !== rowId));
  const addPastSubject = (rowId) => {
    setTableData(prev =>
      prev.map(row =>
        row.id === rowId
          ? {
              ...row,
              pastSubjects: [...row.pastSubjects, { id: Date.now(), code: "", name: "", grade: "", syllabus: null }]
            }
          : row
      )
    );
  };
  const removePastSubject = (rowId, pastId) => {
    setTableData(prev =>
      prev.map(row =>
        row.id === rowId
          ? { ...row, pastSubjects: row.pastSubjects.filter(p => p.id !== pastId) }
          : row
      )
    );
  };
  const handleSyllabusUpload = (rowId, pastId, file) => {
    handlePastSubjectChange(rowId, pastId, "syllabus", file);
  };
  const handleSubmit = () => {
    const payload = tableData.map(row => ({
      currentSubject: row.currentSubject,
      pastSubjects: row.pastSubjects.map(p => ({
        code: p.code,
        name: p.name,
        grade: p.grade,
        syllabus: p.syllabus ? p.syllabus.name : null
      })),
      status: row.status
    }));
    console.log("Payload:", payload);
    alert("Check console!");
  };

  return (
    <div className="p-6 max-w-full mx-auto flex flex-col gap-6 overflow-x-hidden">
      {/* Course selector */}
      <div className="mb-6 w-full flex items-center gap-4">
        <label className="font-medium mr-2">Select Course/Program:</label>
        <select value={course} onChange={handleCourseChange} className="border p-2 rounded">
          <option value="">Select</option>
          <option value="BSE">BSE</option>
          <option value="BNWS">BNWS</option>
          <option value="BCRM">BCRM</option>
        </select>
        {course && (
          <button
            type="button"
            onClick={() => setShowPDF(prev => !prev)}
            className={`px-3 py-1 rounded text-white ${showPDF ? "bg-red-500" : "bg-green-500"}`}
          >
            {showPDF ? "Hide Program Structure" : "Show Program Structure"}
          </button>
        )}
      </div>

      {course && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Table */}
          <div className={`flex-1 w-full overflow-x-auto`} ref={tableWrapperRef}>
            <div className="inline-block min-w-[800px]">
              <table className="border-collapse border w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="p-2 border w-12">#</th>
                    <th className="p-2 border w-44">Current Subject</th>
                    <th className="p-2 border w-[500px]">Past Subjects</th>
                    <th className="p-2 border w-24">Status</th>
                    <th className="p-2 border w-32">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={row.id}>
                      <td className="p-2 border text-center">{index + 1}</td>
                      <td className="p-2 border">
                        <select
                          value={row.currentSubject}
                          onChange={(e) => handleCurrentSubjectChange(row.id, e.target.value)}
                          className="border p-1 rounded w-full min-w-[150px]"
                        >
                          <option value="">Select Subject</option>
                          {mockSubjects[course].map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 border">
                        {row.pastSubjects.map(p => (
                          <div key={p.id} className="flex gap-2 mb-2 flex-nowrap w-full" style={{ minWidth: "450px" }}>
                            <input
                              type="text"
                              placeholder="Code"
                              value={p.code}
                              onChange={(e) => handlePastSubjectChange(row.id, p.id, "code", e.target.value)}
                              className="border p-1 rounded w-20 flex-shrink-0"
                            />
                            <input
                              type="text"
                              placeholder="Name"
                              value={p.name}
                              onChange={(e) => handlePastSubjectChange(row.id, p.id, "name", e.target.value)}
                              className="border p-1 rounded w-40 flex-shrink-0"
                            />
                            <input
                              type="text"
                              placeholder="Grade"
                              value={p.grade}
                              onChange={(e) => handlePastSubjectChange(row.id, p.id, "grade", e.target.value)}
                              className="border p-1 rounded w-16 flex-shrink-0"
                            />
                            <input
                              type="file"
                              onChange={(e) => handleSyllabusUpload(row.id, p.id, e.target.files[0])}
                              className="border p-1 rounded w-40 flex-shrink-0"
                            />
                            <button
                              type="button"
                              onClick={() => removePastSubject(row.id, p.id)}
                              className="bg-red-500 text-white px-2 rounded flex-shrink-0"
                            >
                              ✖
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addPastSubject(row.id)} className="bg-green-500 text-white px-2 rounded mt-1">
                          + Add Past Subject
                        </button>
                      </td>
                      <td className="p-2 border text-center">{row.status}</td>
                      <td className="p-2 border text-center">
                        <button type="button" onClick={() => removeTableRow(row.id)} className="bg-red-500 text-white px-2 rounded">
                          ✖ Remove Row
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex gap-2 flex-wrap">
                <button type="button" onClick={addTableRow} className="bg-blue-500 text-white px-3 py-1 rounded">
                  + Add Row
                </button>
                <button type="button" onClick={handleSubmit} className="bg-indigo-600 text-white px-3 py-1 rounded">
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* PDF Viewer */}
          {showPDF && (
            <div className="flex-1 border rounded overflow-auto max-w-full h-[600px] min-w-0">
              <embed
                src="/assets/BSE - Programme Structure.pdf"
                type="application/pdf"
                className="w-full h-full block"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
