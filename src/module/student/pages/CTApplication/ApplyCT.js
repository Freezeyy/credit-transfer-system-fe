import React, { useMemo, useState, useRef, useEffect } from "react";
import { getProgramStructure, submitCreditTransfer, getMyCreditApplication, getStudentProfile, reapplyOneSubject } from "../../hooks/useCTApplication";
import { getMyProcessWindow } from "../../../admin/hooks/useProcessWindowManagement";
import { getMyMappingBanks } from "../../hooks/useMappingBanks";

export default function ApplyCT() {
  const reapplyParams = useMemo(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const reapply = sp.get("reapply") === "1";
      const ct_id = sp.get("ct_id");
      const application_subject_id = sp.get("application_subject_id");
      return {
        reapply,
        ct_id: ct_id ? parseInt(ct_id, 10) : null,
        application_subject_id: application_subject_id ? parseInt(application_subject_id, 10) : null,
      };
    } catch {
      return { reapply: false, ct_id: null, application_subject_id: null };
    }
  }, []);

  const isReapplyMode = !!(reapplyParams.reapply && reapplyParams.ct_id && reapplyParams.application_subject_id);
  const [programCode, setProgramCode] = useState("");
  const [programName, setProgramName] = useState("");
  const [tableData, setTableData] = useState([]);
  const [showPDF, setShowPDF] = useState(false);
  const [showMappingBank, setShowMappingBank] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [pdfPath, setPdfPath] = useState("");
  const [mappingBanks, setMappingBanks] = useState([]);
  const [selectedMappingBankIndex, setSelectedMappingBankIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [canApply, setCanApply] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [processClosed, setProcessClosed] = useState(false);

  
  // Previous Study Details
  const [previousProgramName, setPreviousProgramName] = useState("");
  const [previousInstitution, setPreviousInstitution] = useState("");
  const [transcriptFile, setTranscriptFile] = useState(null);
  
  const tableWrapperRef = useRef(null);

  // Load student profile to get previous study details
  useEffect(() => {
    async function loadStudentProfile() {
      const res = await getStudentProfile();
      if (res.success && res.data) {
        // Set previous study details from registration
        if (res.data.oldCampus?.old_campus_name) {
          setPreviousInstitution(res.data.oldCampus.old_campus_name);
        }
        if (res.data.prev_programme_name) {
          setPreviousProgramName(res.data.prev_programme_name);
        }
      }
    }
    loadStudentProfile();
  }, []);

  // Load program structure and courses on mount
  useEffect(() => {
    async function loadProgramData() {
      // Get program structure AND courses in single request
      const res = await getProgramStructure(true); // includeCourses = true
      
      if (res.success) {
        // Set program info
        if (res.program) {
          setProgramCode(res.program.program_code || "");
          setProgramName(res.program.program_name || "");
          setPdfPath(res.program.program_structure || "");
          
          // Check if program structure is null - if so, prevent application
          if (!res.program.program_structure) {
            setCanApply(false);
            setCheckingStatus(false);
            return;
          }
        }
        
        // Set courses for dropdown
        if (res.courses) {
          setSubjects(res.courses);
        }
      } else {
        // If program structure fetch fails, prevent application
        setCanApply(false);
        setCheckingStatus(false);
      }
    }

    loadProgramData();
  }, []);

  // Load assigned course analysis summaries (separate feature; does not affect CT flow)
  useEffect(() => {
    let mounted = true;
    async function loadBanks() {
      const res = await getMyMappingBanks();
      if (!mounted) return;
      if (res.success) {
        setMappingBanks(res.data || []);
        setSelectedMappingBankIndex(0);
      } else {
        setMappingBanks([]);
      }
    }
    loadBanks();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    async function checkProcessWindow() {
      try {
        const w = await getMyProcessWindow();
        const now = Date.now();
        const start = w.ct_start_at ? new Date(w.ct_start_at).getTime() : null;
        const end = w.ct_end_at ? new Date(w.ct_end_at).getTime() : null;
        const open = (start == null || now >= start) && (end == null || now <= end);
        setProcessClosed(!open);
        if (!open) setCanApply(false);
      } catch {
        // If settings not available, default to allow
      }
    }
    checkProcessWindow();
  }, []);

  useEffect(() => {
    async function loadApplications() {
      // Don't load applications if program structure is missing
      // (This will be checked in the first useEffect)
      if (!pdfPath) {
        setCheckingStatus(false);
        return;
      }
      
      setCheckingStatus(true);
  
      const res = await getMyCreditApplication();
  
      if (res.success) {
        const apps = res.applications || res.data || [];
  
        // if NO applications at all → allow apply (only if program structure exists)
        if (apps.length === 0) {
          setCanApply(true);
          setCheckingStatus(false);
          return;
        }
  
        // check if there is any NON-draft (submitted / approved / rejected)
        const hasSubmitted = apps.some(app => app.ct_status !== "draft");
  
        if (hasSubmitted) {
          // In reapply mode, allow editing the specific subject inside the existing application
          if (!isReapplyMode) {
            setCanApply(false);
            setCheckingStatus(false);
            return;
          }
        }
  
        // In reapply mode, load the existing application by ct_id (can be submitted).
        // Otherwise, load latest draft.
        const targetApp = isReapplyMode
          ? apps.find(a => a.ct_id === reapplyParams.ct_id)
          : null;

        const drafts = apps.filter(app => app.ct_status === "draft");
        const latest = isReapplyMode ? targetApp : drafts[drafts.length - 1];

        if (!latest) {
          setCheckingStatus(false);
          setCanApply(false);
          return;
        }
  
        // In reapply mode we still reuse draftId variable as "current application id".
        setDraftId(latest.ct_id);
  
        if (latest.prev_programme_name) {
          setPreviousProgramName(latest.prev_programme_name);
        }
        if (latest.prev_campus_name) {
          setPreviousInstitution(latest.prev_campus_name);
        }
        if (latest.transcript_path) {
          setTranscriptFile({
            name: latest.transcript_path.split("/").pop(),
            path: latest.transcript_path,
          });
        }
  
        const mappingRowsAll =
          latest.newApplicationSubjects?.map((subject, idx) => ({
            id: Date.now() + idx,
            currentSubject: subject.application_subject_name || "",
            course_id: subject.course_id || subject.course?.course_id || null,
            application_subject_id: subject.application_subject_id,
            pastSubjects:
              subject.pastApplicationSubjects?.map((past, j) => ({
                id: Date.now() + idx + j + 1000,
                code: past.pastSubject_code || "",
                name: past.pastSubject_name || "",
                grade: past.pastSubject_grade || "",
                credit: past.pastSubject_credit || "",
                syllabus: past.pastSubject_syllabus_path
                  ? {
                      // Keep a handle to the already-uploaded syllabus so reapply can preserve it
                      existingPath: past.pastSubject_syllabus_path,
                    }
                  : null,
              })) || [
                { id: Date.now() + idx + 1000, code: "", name: "", grade: "", credit: "", syllabus: null },
              ],
            status: "Pending",
          })) || [];
  
        // If reapply mode, show only the target subject row
        if (isReapplyMode) {
          const only = mappingRowsAll.filter((r) => r.application_subject_id === reapplyParams.application_subject_id);
          setTableData(only.length ? only : mappingRowsAll);
        } else {
          setTableData(mappingRowsAll);
        }
        setCanApply(true);
      }
  
      setCheckingStatus(false);
    }
  
    loadApplications();
  }, [pdfPath, isReapplyMode, reapplyParams.application_subject_id, reapplyParams.ct_id]);
  

  const handleCurrentSubjectChange = (rowId, courseId) => {
    // Find the selected course to get its name for display
    const selectedCourse = subjects.find(sub => sub.course_id === parseInt(courseId));
    
    setTableData((prev) =>
      prev.map((row) =>
        row.id === rowId 
          ? { 
              ...row, 
              course_id: courseId ? parseInt(courseId) : null,
              currentSubject: selectedCourse ? selectedCourse.course_name : "" 
            } 
          : row
      )
    );
  };

  const handlePastSubjectChange = (rowId, pastId, field, value) => {
    setTableData((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const updated = row.pastSubjects.map((p) =>
          p.id === pastId ? { ...p, [field]: value } : p
        );
        return { ...row, pastSubjects: updated };
      })
    );
  };

  const addTableRow = () => {
    setTableData((prev) => [
      ...prev,
      {
        id: Date.now(),
        currentSubject: "",
        course_id: null,
        application_subject_id: null,
        pastSubjects: [
          { id: Date.now() + 1, code: "", name: "", grade: "", credit: "", syllabus: null }
        ],
        status: "Pending",
      },
    ]);
  };

  const removeTableRow = (rowId) =>
    setTableData((prev) => prev.filter((row) => row.id !== rowId));

  const addPastSubject = (rowId) => {
    setTableData((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              pastSubjects: [
                ...row.pastSubjects,
                { id: Date.now(), code: "", name: "", grade: "", credit: "", syllabus: null },
              ],
            }
          : row
      )
    );
  };

  const removePastSubject = (rowId, pastId) => {
    setTableData((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              pastSubjects: row.pastSubjects.filter((p) => p.id !== pastId),
            }
          : row
      )
    );
  };

  const handleSyllabusUpload = (rowId, pastId, file) => {
    handlePastSubjectChange(rowId, pastId, "syllabus", file);
  };

  // Prepare FormData for API
  const prepareFormData = (isDraft = false) => {
    const formData = new FormData();
    
    // Add program code
    formData.append("programCode", programCode);
    
    // Add status
    formData.append("status", isDraft ? "draft" : "submitted");
    
    // Add draftId if updating existing draft
    if (draftId) {
      formData.append("draftId", draftId);
    }
    
    // Add previous study details
    formData.append("prevProgrammeName", previousProgramName);
    formData.append("prevCampusName", previousInstitution);
    if (transcriptFile && transcriptFile instanceof File) {
      formData.append("transcript", transcriptFile);
    }
    
    // Prepare mappings JSON
    const mappings = tableData.map((row) => ({
      currentSubject: row.currentSubject, // Keep for display/backward compatibility
      course_id: row.course_id, // Send course_id (preferred)
      pastSubjects: row.pastSubjects.map((p) => ({
        code: p.code,
        name: p.name,
        grade: p.grade,
        credit: p.credit || null,
        syllabus: p.syllabus ? p.syllabus.name : null,
      })),
    }));
    
    formData.append("mappings", JSON.stringify(mappings));
    
    // Add files in order (important: order matches pastSubjects order)
    tableData.forEach((row) => {
      row.pastSubjects.forEach((p) => {
        if (p.syllabus && p.syllabus instanceof File) {
          formData.append("syllabus", p.syllabus);
        }
      });
    });
    
    return formData;
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    if (!programCode) {
      alert("Program not loaded. Please refresh the page.");
      return;
    }

    if (!previousProgramName || !previousInstitution) {
      alert("Previous study details are missing. Please ensure you completed your registration with previous institution and programme name. Contact support if you need to update your registration details.");
      return;
    }

    // if (tableData.length === 0) {
    //   alert("Please add at least one mapping");
    //   return;
    // }

    setIsSubmitting(true);
    try {
      const formData = prepareFormData(true);
      const result = await submitCreditTransfer(formData, draftId, false);
      
      if (result.success) {
        alert("Draft saved successfully!");
        if (result.data?.application_id) {
          setDraftId(result.data.application_id);
        }
      } else {
        alert("Failed to save draft: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Error saving draft: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Application
  const handleSubmit = async () => {
    // Reapply mode: update ONLY one existing current subject
    if (isReapplyMode) {
      if (!reapplyParams.ct_id || !reapplyParams.application_subject_id) {
        alert("Missing reapply parameters.");
        return;
      }
      if (tableData.length !== 1) {
        alert("Reapply mode expects exactly 1 course row.");
        return;
      }
      const row = tableData[0];
      const hasEmptyFields = row.pastSubjects.some((p) => !p.code || !p.name || !p.grade);
      if (hasEmptyFields) {
        alert("Please fill in all required fields before submitting");
        return;
      }

      // Build mapping payload expected by backend
      const mapping = {
        pastSubjects: row.pastSubjects.map((p) => ({
          code: p.code,
          name: p.name,
          grade: p.grade,
          credit: p.credit,
          // Only send syllabus "name" when a new File is uploaded.
          // Existing syllabi are preserved via syllabus_existing_path.
          syllabus: p.syllabus instanceof File ? p.syllabus.name : null,
          syllabus_existing_path:
            p.syllabus && !(p.syllabus instanceof File) ? p.syllabus.existingPath || null : null,
        })),
      };

      const files = row.pastSubjects
        .map((p) => (p.syllabus && p.syllabus instanceof File ? p.syllabus : null))
        .filter(Boolean);

      setIsSubmitting(true);
      try {
        const result = await reapplyOneSubject({
          ct_id: reapplyParams.ct_id,
          application_subject_id: reapplyParams.application_subject_id,
          mapping,
          files,
        });
        if (result.success) {
          alert("Reapply submitted successfully!");
          window.location.href = "/student/history";
          return;
        }
        alert("Failed to submit reapply: " + (result.message || "Unknown error"));
      } catch (e) {
        alert("Error submitting reapply: " + (e.message || e));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!programCode) {
      alert("Program not loaded. Please refresh the page.");
      return;
    }

    if (!previousProgramName || !previousInstitution) {
      alert("Previous study details are missing. Please ensure you completed your registration with previous institution and programme name. Contact support if you need to update your registration details.");
      return;
    }
    if (!transcriptFile) {
      alert("Please upload your transcript/result slip");
      return;
    }

    if (tableData.length === 0) {
      alert("Please add at least one mapping");
      return;
    }

    // Validate all fields are filled
    const hasEmptyFields = tableData.some((row) => {
      // Check if course_id is selected (preferred) or currentSubject is filled (backward compatibility)
      if (!row.course_id && !row.currentSubject) return true;
      return row.pastSubjects.some(
        (p) => !p.code || !p.name || !p.grade
      );
    });

    if (hasEmptyFields) {
      alert("Please fill in all required fields before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = prepareFormData(false);
      const result = await submitCreditTransfer(formData, draftId, true);
      
      if (result.success) {
        alert("Application submitted successfully!");
        // Reset form
        setTableData([]);
        setDraftId(null);
        setPreviousProgramName("");
        setPreviousInstitution("");
        setTranscriptFile(null);
      } else {
        alert("Failed to submit: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Error submitting: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };



  if (checkingStatus) {
    return <div className="p-6">Checking application status...</div>;
  }
  
  if (!canApply) {
    // Check if it's because program structure is missing
    if (!pdfPath) {
      return (
        <div className="p-6 max-w-xl mx-auto bg-red-50 border border-red-300 rounded">
          <h2 className="text-lg font-semibold mb-2 text-red-800">Program Structure Not Available</h2>
          <p className="text-gray-700">
            Your program coordinator has not yet uploaded the program structure.
            Please contact your program coordinator to upload the program structure before you can submit a credit transfer application.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Program: <strong>{programName || "N/A"}</strong> ({programCode || "N/A"})
          </p>
        </div>
      );
    }

    if (processClosed) {
      return (
        <div className="p-6 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-red-800">Credit Transfer Process Closed</h2>
          <p className="text-gray-700">
            The credit transfer process window is currently closed for your campus.
            Please contact your administrator for the next intake window.
          </p>
        </div>
      );
    }
    
    // Otherwise, it's because an application already exists
    return (
      <div className="p-6 max-w-xl mx-auto bg-yellow-50 border border-yellow-300 rounded">
        <h2 className="text-lg font-semibold mb-2">Credit Transfer Application Exists</h2>
        <p className="text-gray-700">
          You have already submitted a Credit Transfer application.
          Please check your current application in the
          <strong> Credit Transfer History</strong> page.
        </p>
      </div>
    );
  }
  
  

  return (
    <div className="p-6 max-w-full mx-auto flex flex-col gap-6 overflow-x-hidden">

      {/* Program Info Display */}
      <div className="mb-6 w-full flex items-center gap-4 flex-wrap">
        <div className="flex flex-col">
          <label className="font-medium text-sm text-gray-600">Your Program:</label>
          <div className="font-semibold text-lg">
            {programName || "Loading..."} ({programCode || "..."})
          </div>
        </div>

        {programCode && pdfPath && (
          <button
            type="button"
            onClick={() => setShowPDF((prev) => !prev)}
            className={`px-3 py-1 rounded text-white ${
              showPDF ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {showPDF ? "Hide Program Structure" : "Show Program Structure"}
          </button>
        )}

        {mappingBanks.length > 0 && (
          <button
            type="button"
            onClick={() => setShowMappingBank((prev) => !prev)}
            className={`px-3 py-1 rounded text-white ${
              showMappingBank ? "bg-red-500" : "bg-indigo-600"
            }`}
          >
            {showMappingBank ? "Hide course analysis summary" : "Show course analysis summary"}
          </button>
        )}

        {draftId && (
          <span className="text-sm text-blue-600 ml-auto bg-blue-50 px-3 py-1 rounded">
            📝 Editing Draft ID: {draftId}
          </span>
        )}
      </div>

      {programCode && (
        <div className="flex flex-col gap-6">

          {/* Details of Previous Study Section */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Details of Previous Study
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Previous Program Name */}
              <div className="flex flex-col">
                <label className="font-medium text-sm text-gray-700 mb-2">
                  Programme Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={previousProgramName}
                  onChange={(e) => setPreviousProgramName(e.target.value)}
                  placeholder="e.g., Bachelor of Computer Science"
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={true}
                  readOnly
                  title="This information is from your registration. Please contact support if you need to update it."
                />
                {!previousProgramName && (
                  <p className="text-xs text-red-500 mt-1">Please complete your registration with previous study details</p>
                )}
              </div>

              {/* Previous Institution */}
              <div className="flex flex-col">
                <label className="font-medium text-sm text-gray-700 mb-2">
                  University/College/Institute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={previousInstitution}
                  onChange={(e) => setPreviousInstitution(e.target.value)}
                  placeholder="Previous Institution"
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  disabled={true}
                  readOnly
                  title="This information is from your registration. Please contact support if you need to update it."
                />
                {!previousInstitution && (
                  <p className="text-xs text-red-500 mt-1">Please complete your registration with previous study details</p>
                )}
              </div>

              {/* Transcript Upload */}
              <div className="flex flex-col md:col-span-2">
                <label className="font-medium text-sm text-gray-700 mb-2">
                  Transcript/Result Slip <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(PDF only, required for submission)</span>
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setTranscriptFile(e.target.files[0])}
                  className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                {transcriptFile && (
                  <a
                    href={transcriptFile.path ? `${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}${transcriptFile.path}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 mt-2 hover:underline cursor-pointer inline-block"
                    onClick={(e) => {
                      if (!transcriptFile.path) {
                        e.preventDefault();
                      }
                    }}
                  >
                    ✓ {transcriptFile.name}
                  </a>
                )}
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Note:</strong> The transcript/result slip will be used by the coordinator to verify 
              the grades of courses you're applying for credit transfer.
            </div>
          </div>

          {/* Course mapping table and PDF viewer */}
          <div className="flex flex-col md:flex-row gap-6">

            {/* TABLE */}
            <div className="flex-1 w-full overflow-x-auto" ref={tableWrapperRef}>
              <div className="inline-block min-w-[800px]">
                <table className="border-collapse border w-full">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="p-2 border w-12">#</th>
                      <th className="p-2 border w-44">UniKL course</th>
                      <th className="p-2 border w-[500px]">Previous courses</th>
                      <th className="p-2 border w-32">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {tableData.map((row, index) => (
                      <tr key={row.id}>
                        <td className="p-2 border text-center">{index + 1}</td>

                        {/* Current subject dropdown */}
                        <td className="p-2 border">
                          <select
                            value={row.course_id || ""}
                            onChange={(e) =>
                              handleCurrentSubjectChange(row.id, e.target.value)
                            }
                            className="border p-1 rounded w-full min-w-[150px]"
                            disabled={isSubmitting}
                          >
                            <option value="">Select course</option>
                            {subjects.map((sub) => (
                              <option key={sub.course_id} value={sub.course_id}>
                                {sub.course_code} - {sub.course_name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Past subjects */}
                        <td className="p-2 border">
                          {row.pastSubjects.map((p) => (
                            <div
                              key={p.id}
                              className="flex gap-2 mb-2 flex-nowrap w-full"
                              style={{ minWidth: "450px" }}
                            >
                              <input
                                type="text"
                                placeholder="Code"
                                value={p.code}
                                onChange={(e) =>
                                  handlePastSubjectChange(
                                    row.id,
                                    p.id,
                                    "code",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-20 flex-shrink-0"
                                disabled={isSubmitting}
                              />

                              <input
                                type="text"
                                placeholder="Name"
                                value={p.name}
                                onChange={(e) =>
                                  handlePastSubjectChange(
                                    row.id,
                                    p.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-40 flex-shrink-0"
                                disabled={isSubmitting}
                              />

                              <input
                                type="text"
                                placeholder="Grade"
                                value={p.grade}
                                onChange={(e) =>
                                  handlePastSubjectChange(
                                    row.id,
                                    p.id,
                                    "grade",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-16 flex-shrink-0"
                                disabled={isSubmitting}
                              />

                              <input
                                type="number"
                                placeholder="Credit"
                                value={p.credit}
                                onChange={(e) =>
                                  handlePastSubjectChange(
                                    row.id,
                                    p.id,
                                    "credit",
                                    e.target.value
                                  )
                                }
                                className="border p-1 rounded w-16 flex-shrink-0"
                                disabled={isSubmitting}
                                min="0"
                              />

                              <div className="flex flex-col w-40 flex-shrink-0">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={(e) =>
                                    handleSyllabusUpload(
                                      row.id,
                                      p.id,
                                      e.target.files[0]
                                    )
                                  }
                                  className="border p-1 rounded text-xs"
                                  disabled={isSubmitting}
                                />
                                {p.syllabus && (
                                  <span className="text-xs text-green-600 mt-1">
                                    ✓ {p.syllabus.name}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removePastSubject(row.id, p.id)}
                                className="bg-red-500 text-white px-2 rounded flex-shrink-0 disabled:opacity-50"
                                disabled={isSubmitting}
                              >
                                ✖
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => addPastSubject(row.id)}
                            className="bg-green-500 text-white px-2 rounded mt-1 text-sm disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            + Add previous course
                          </button>
                        </td>

                        <td className="p-2 border text-center">
                          <button
                            type="button"
                            onClick={() => removeTableRow(row.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-sm disabled:opacity-50"
                            disabled={isSubmitting}
                          >
                            ✖ Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex gap-2 flex-wrap">
                  {!isReapplyMode && (
                    <button
                    type="button"
                    onClick={addTableRow}
                    className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    + Add Row
                    </button>
                  )}

                  {!isReapplyMode && (
                    <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "💾 Save as Draft"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : isReapplyMode ? "✓ Submit Reapply" : "✓ Submit Application"}
                  </button>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            {showPDF && pdfPath && (
              <div className="flex-1 border rounded overflow-auto max-w-full h-[600px] min-w-0">
                <embed
                  src={`${process.env.REACT_APP_API_ORIGIN || 'http://localhost:3000'}${pdfPath}`}
                  type="application/pdf"
                  className="w-full h-full block"
                />
              </div>
            )}

            {/* Course analysis summary viewer */}
            {showMappingBank && mappingBanks.length > 0 && mappingBanks[selectedMappingBankIndex] && (
              <div className="flex-1 flex flex-col border rounded overflow-auto max-w-full h-[600px] min-w-0">
                {mappingBanks.length > 1 && (
                  <div className="bg-white p-3 border-b">
                    <div className="flex flex-wrap gap-2">
                      {mappingBanks.map((b, idx) => (
                        <button
                          key={b.mb_id || idx}
                          type="button"
                          onClick={() => setSelectedMappingBankIndex(idx)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedMappingBankIndex === idx
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {b.mb_name || `Summary ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 bg-gray-100 px-4 py-2 rounded">
                      <p className="text-sm font-semibold text-gray-700">
                        {mappingBanks[selectedMappingBankIndex]?.mb_name || "Course analysis summary"}
                      </p>
                      <p className="text-xs text-gray-600">
                        Previous campus: {mappingBanks[selectedMappingBankIndex]?.oldCampus?.old_campus_name || "N/A"}
                        {mappingBanks[selectedMappingBankIndex]?.intake_year
                          ? ` | Intake: ${mappingBanks[selectedMappingBankIndex].intake_year}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-auto">
                  <embed
                    src={`${process.env.REACT_APP_API_ORIGIN || "http://localhost:3000"}${mappingBanks[selectedMappingBankIndex].file_upload}`}
                    type="application/pdf"
                    className="w-full h-full block"
                    style={{ minHeight: "500px" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}