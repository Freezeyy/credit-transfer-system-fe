import React, { useEffect, useState } from "react";
import { getProgramStructure, updateCourses, getCategories, createCategory, deleteCategory } from "../../hooks/useManageStructureCourses";

export default function ManageCourses() {
  const [activeTab, setActiveTab] = useState("courses");
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
      setCourses(res.data.courses || []);
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
        category_id: null
      }
    ]);
  }

  function removeCourseRow(index) {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  }

  async function saveCourses() {
    setSaving(true);
    
    // Map UI fields to backend fields
    const coursesToSend = courses.map(c => ({
      course_id: c.course_id || undefined, // Include for updates, omit for new
      course_code: c.course_code,
      course_name: c.course_name,
      course_credit: c.course_credit ? parseInt(c.course_credit) : null,
      category_id: c.category_id ? parseInt(c.category_id) : null,
    }));

    const payload = { courses: coursesToSend };
    const res = await updateCourses(payload);
    
    if (res.success) {
      await loadCourses();
      alert("Courses saved successfully!");
    } else {
      alert(res.message || "Failed to save courses");
    }
    
    setSaving(false);
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
    if (!window.confirm(`Are you sure you want to delete "${categoryName}"? This action cannot be undone.`)) {
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
      <h1 className="text-2xl font-semibold mb-5">Manage Courses</h1>

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
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b sticky top-0">
                  <tr>
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Credits</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        No courses yet. Click "Add Course" to get started.
                      </td>
                    </tr>
                  ) : (
                    courses.map((c, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <input
                            className="border p-2 rounded w-full"
                            value={c.course_code || ""}
                            onChange={(e) =>
                              updateCourseField(i, "course_code", e.target.value)
                            }
                            placeholder="e.g., CS201"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            className="border p-2 rounded w-full"
                            value={c.course_name || ""}
                            onChange={(e) =>
                              updateCourseField(i, "course_name", e.target.value)
                            }
                            placeholder="e.g., Data Structures"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            className="border p-2 rounded w-full"
                            value={c.course_credit || ""}
                            onChange={(e) =>
                              updateCourseField(i, "course_credit", e.target.value)
                            }
                            placeholder="e.g., 3"
                          />
                        </td>
                        <td className="p-3">
                          <select
                            className="border p-2 rounded w-full"
                            value={c.category_id || ""}
                            onChange={(e) =>
                              updateCourseField(i, "category_id", e.target.value || null)
                            }
                          >
                            <option value="">No Category</option>
                            {categories.map(cat => (
                              <option key={cat.category_id} value={cat.category_id}>
                                {cat.category_name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <button
                            className="text-red-600 hover:underline text-sm"
                            onClick={() => removeCourseRow(i)}
                          >
                            Remove
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
                  if (e.key === 'Enter') {
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
                    <th className="p-3 text-left">Category Name</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="p-8 text-center text-gray-500">
                        No categories yet. Add a new category above.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.category_id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{cat.category_name}</td>
                        <td className="p-3">
                          <button
                            className="text-red-600 hover:underline text-sm"
                            onClick={() => handleDeleteCategory(cat.category_id, cat.category_name)}
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

