import React, { useEffect, useState } from "react";
import { DocumentDownloadIcon, TrashIcon } from "@heroicons/react/outline";
import { getProgramStructure, updateCourses, getCategories, createCategory, deleteCategory } from "../../hooks/useManageStructureCourses";
import { downloadProgramStructurePdf } from "../../utils/downloadProgramStructurePdf";

const YEAR_OPTIONS = [1, 2, 3, 4];
const SEMESTER_OPTIONS = [1, 2, 3];

function assignSortOrders(courses) {
  const counters = {};
  return courses.map((c, fallbackIndex) => {
    const year = c.academic_year ? parseInt(c.academic_year, 10) : null;
    const sem = c.semester_number ? parseInt(c.semester_number, 10) : null;
    if (!year || !sem) {
      return { ...c, sort_order: fallbackIndex };
    }
    const key = `${year}-${sem}`;
    counters[key] = (counters[key] || 0) + 1;
    return { ...c, sort_order: counters[key] };
  });
}

export default function ManageCourses() {
  const [activeTab, setActiveTab] = useState("courses");
  const [program, setProgram] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    loadCourses();
    loadCategories();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const res = await getProgramStructure();

    if (res.success) {
      setProgram(res.data.program || null);
      const list = (res.data.courses || []).map((c) => ({
        course_id: c.course_id,
        course_code: c.course_code || "",
        course_name: c.course_name || "",
        course_credit: c.course_credit ?? "",
        category_id: c.category_id ?? c.category?.category_id ?? null,
        academic_year: c.academic_year ?? "",
        semester_number: c.semester_number ?? "",
        sort_order: c.sort_order ?? 0,
        prerequisite_course_id: c.prerequisite_course_id ?? "",
        prerequisite_course: c.prerequisite_course || null,
      }));
      setCourses(list);
    }
    setLoading(false);
  }

  async function loadCategories() {
    setLoadingCategories(true);
    const res = await getCategories();

    if (res.success) {
      setCategories(res.data || []);
    }
    setLoadingCategories(false);
  }

  function updateCourseField(index, field, value) {
    const updated = [...courses];
    updated[index][field] = value;
    setCourses(updated);
  }

  function addCourseRow() {
    setCourses([
      ...courses,
      {
        course_code: "",
        course_name: "",
        course_credit: "",
        category_id: null,
        academic_year: "",
        semester_number: "",
        prerequisite_course_id: "",
      },
    ]);
  }

  function removeCourseRow(index) {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  }

  async function saveCourses() {
    setSaving(true);

    const withOrder = assignSortOrders(courses);
    const coursesToSend = withOrder.map((c) => ({
      course_id: c.course_id || undefined,
      course_code: c.course_code,
      course_name: c.course_name,
      course_credit: c.course_credit ? parseInt(c.course_credit, 10) : null,
      category_id: c.category_id ? parseInt(c.category_id, 10) : null,
      academic_year: c.academic_year ? parseInt(c.academic_year, 10) : null,
      semester_number: c.semester_number ? parseInt(c.semester_number, 10) : null,
      sort_order: c.sort_order != null ? parseInt(c.sort_order, 10) : 0,
      prerequisite_course_id: c.prerequisite_course_id
        ? parseInt(c.prerequisite_course_id, 10)
        : null,
    }));

    const res = await updateCourses({ courses: coursesToSend });

    if (res.success) {
      await loadCourses();
      alert("Courses saved successfully!");
    } else {
      alert(res.message || "Failed to save courses");
    }

    setSaving(false);
  }

  function handleDownloadPdf() {
    if (!program?.program_name) {
      alert("Program information is not loaded yet.");
      return;
    }
    if (courses.length === 0) {
      alert("Add at least one course before downloading the programme structure PDF.");
      return;
    }
    const missingPlacement = courses.some(
      (c) => !c.academic_year || !c.semester_number,
    );
    if (missingPlacement) {
      const proceed = window.confirm(
        "Some courses do not have a year and semester set. They will appear in an “unassigned” section at the end of the PDF. Continue?",
      );
      if (!proceed) return;
    }
    downloadProgramStructurePdf({
      programName: program.program_name,
      courses: courses.map((c) => {
        const prereqId = c.prerequisite_course_id
          ? parseInt(c.prerequisite_course_id, 10)
          : null;
        const prereqCourse = prereqId
          ? courses.find((x) => x.course_id === prereqId)
          : null;
        const category = categories.find(
          (cat) => String(cat.category_id) === String(c.category_id),
        );
        return {
          ...c,
          category: category
            ? { category_name: category.category_name }
            : null,
          prerequisite_course: prereqCourse
            ? {
                course_code: prereqCourse.course_code,
                course_name: prereqCourse.course_name,
              }
            : c.prerequisite_course,
        };
      }),
    });
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    const res = await createCategory(newCategoryName.trim());
    if (res.success) {
      setNewCategoryName("");
      await loadCategories();
      alert("Category created successfully!");
    } else {
      alert(res.message || "Failed to create category");
    }
  }

  async function handleDeleteCategory(categoryId, categoryName) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${categoryName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    const res = await deleteCategory(categoryId);
    if (res.success) {
      await loadCategories();
      alert("Category deleted successfully!");
    } else {
      alert(res.message || "Failed to delete category");
    }
  }

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold">Manage Courses</h1>
          {program?.program_name && (
            <p className="text-sm text-gray-600 mt-1">
              Program: <span className="font-medium">{program.program_name}</span>
              {program.program_code ? ` (${program.program_code})` : ""}
            </p>
          )}
        </div>
        {activeTab === "courses" && (
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            onClick={handleDownloadPdf}
            disabled={loading || courses.length === 0}
          >
            <DocumentDownloadIcon className="h-5 w-5" />
            Download programme structure (PDF)
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4 max-w-3xl">
        Assign each course to a <span className="font-medium">year</span> and{" "}
        <span className="font-medium">semester</span> so the PDF matches your official
        programme structure layout. Save before downloading if you changed data.
      </p>

      {/* TABS */}
      <div className="flex gap-3 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === "courses"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("courses")}
        >
          Manage Courses
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === "categories"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab("categories")}
        >
          Manage Categories
        </button>
      </div>

      {/* TAB: MANAGE COURSES */}
      {activeTab === "courses" && (
        <div className="bg-white rounded-xl shadow p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Program Courses</h2>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              onClick={addCourseRow}
            >
              + Add Course
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading courses...</p>
            </div>
          ) : (
            <>
              <div className="overflow-auto max-h-[600px] border rounded-lg">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead className="bg-gray-100 border-b sticky top-0">
                    <tr>
                      <th className="p-3 text-left w-12">No.</th>
                      <th className="p-3 text-left w-16">Year</th>
                      <th className="p-3 text-left w-16">Sem</th>
                      <th className="p-3 text-left">Code</th>
                      <th className="p-3 text-left">Name</th>
                      <th className="p-3 text-left w-16">Cr</th>
                      <th className="p-3 text-left">Category</th>
                      <th className="p-3 text-left">Pre-requisite</th>
                      <th className="p-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-gray-500">
                          No courses yet. Click &quot;Add Course&quot; to get started.
                        </td>
                      </tr>
                    ) : (
                      courses.map((c, i) => (
                        <tr key={c.course_id || `new-${i}`} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-gray-600">{i + 1}</td>
                          <td className="p-3">
                            <select
                              className="border p-2 rounded w-full"
                              value={c.academic_year ?? ""}
                              onChange={(e) =>
                                updateCourseField(i, "academic_year", e.target.value)
                              }
                            >
                              <option value="">—</option>
                              {YEAR_OPTIONS.map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              className="border p-2 rounded w-full"
                              value={c.semester_number ?? ""}
                              onChange={(e) =>
                                updateCourseField(i, "semester_number", e.target.value)
                              }
                            >
                              <option value="">—</option>
                              {SEMESTER_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <input
                              className="border p-2 rounded w-full min-w-[90px]"
                              value={c.course_code || ""}
                              onChange={(e) =>
                                updateCourseField(i, "course_code", e.target.value)
                              }
                              placeholder="ISB10103"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              className="border p-2 rounded w-full min-w-[140px]"
                              value={c.course_name || ""}
                              onChange={(e) =>
                                updateCourseField(i, "course_name", e.target.value)
                              }
                              placeholder="Course name"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              className="border p-2 rounded w-full"
                              value={c.course_credit ?? ""}
                              onChange={(e) =>
                                updateCourseField(i, "course_credit", e.target.value)
                              }
                              placeholder="3"
                            />
                          </td>
                          <td className="p-3">
                            <select
                              className="border p-2 rounded w-full min-w-[120px]"
                              value={c.category_id || ""}
                              onChange={(e) =>
                                updateCourseField(
                                  i,
                                  "category_id",
                                  e.target.value || null,
                                )
                              }
                            >
                              <option value="">No Category</option>
                              {categories.map((cat) => (
                                <option key={cat.category_id} value={cat.category_id}>
                                  {cat.category_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <select
                              className="border p-2 rounded w-full min-w-[140px]"
                              value={c.prerequisite_course_id || ""}
                              onChange={(e) =>
                                updateCourseField(
                                  i,
                                  "prerequisite_course_id",
                                  e.target.value || "",
                                )
                              }
                            >
                              <option value="">None</option>
                              {courses
                                .filter(
                                  (other) =>
                                    other.course_id &&
                                    other.course_id !== c.course_id,
                                )
                                .map((other) => (
                                  <option
                                    key={other.course_id}
                                    value={other.course_id}
                                  >
                                    {other.course_code
                                      ? `${other.course_code} — `
                                      : ""}
                                    {other.course_name || "Course"}
                                  </option>
                                ))}
                            </select>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              className="text-red-600 hover:underline text-sm"
                              onClick={() => removeCourseRow(i)}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <button
                className="mt-5 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={saveCourses}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Courses"}
              </button>
            </>
          )}
        </div>
      )}

      {/* TAB: MANAGE CATEGORIES */}
      {activeTab === "categories" && (
        <div className="bg-white rounded-xl shadow p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3">Course Categories</h2>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                className="border p-2 rounded flex-1"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name (e.g., Common Core, Elective)"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCategory();
                  }
                }}
              />
              <button
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                onClick={handleCreateCategory}
              >
                + Add Category
              </button>
            </div>
          </div>

          {loadingCategories ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[600px] border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="p-3 text-left w-16">No.</th>
                    <th className="p-3 text-left">Category Name</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="p-8 text-center text-gray-500">
                        No categories yet. Add a new category above.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat, idx) => (
                      <tr key={cat.category_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-gray-600">{idx + 1}</td>
                        <td className="p-3 font-medium">{cat.category_name}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            className="text-red-600 hover:underline text-sm"
                            onClick={() =>
                              handleDeleteCategory(cat.category_id, cat.category_name)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
