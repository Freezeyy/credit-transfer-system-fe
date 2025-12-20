import React, { useState, useEffect } from "react";
import {
  getTemplate3Mappings,
} from "../../hooks/useReviewApplication";

export default function Template3() {
  const [template3List, setTemplate3List] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters for viewing
  const [filters, setFilters] = useState({
    old_campus_name: "",
    old_programme_name: "",
  });

  useEffect(() => {
    loadTemplate3List();
  }, []);

  async function loadTemplate3List() {
    setLoading(true);
    const res = await getTemplate3Mappings(filters);
    if (res.success) {
      setTemplate3List(res.data);
    }
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">View Template3 Mappings</h1>
      <p className="text-gray-600 mb-6">
        Template3 mappings are created after SME evaluation. Coordinators can only view existing mappings.
      </p>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="font-semibold mb-3">Search Filters</h2>
        <p className="text-sm text-gray-600 mb-4">
          You can search by old institution details. Results are automatically filtered to your program.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium">Old Institution Name</label>
            <input
              type="text"
              value={filters.old_campus_name}
              onChange={(e) => setFilters(prev => ({ ...prev, old_campus_name: e.target.value }))}
              className="w-full border rounded p-2"
              placeholder="e.g., GMI"
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium">Old Institution Programme Name</label>
            <input
              type="text"
              value={filters.old_programme_name}
              onChange={(e) => setFilters(prev => ({ ...prev, old_programme_name: e.target.value }))}
              className="w-full border rounded p-2"
              placeholder="e.g., Diploma in Software Engineering"
            />
          </div>
        </div>
        <button
          onClick={loadTemplate3List}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
        >
          Search
        </button>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">
            Results ({template3List.length} {template3List.length === 1 ? 'mapping' : 'mappings'})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">ID</th>
                <th className="p-3 text-left">Old Institution</th>
                <th className="p-3 text-left">Old Programme</th>
                <th className="p-3 text-left">Old Subject</th>
                <th className="p-3 text-left">New Subject</th>
                <th className="p-3 text-left">Current Programme</th>
                <th className="p-3 text-left">Similarity</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center">Loading...</td>
                </tr>
              ) : template3List.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-gray-500">
                    No mappings found. Try adjusting your search filters.
                  </td>
                </tr>
              ) : (
                template3List.map((t3) => (
                  <tr key={t3.template3_id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{t3.template3_id}</td>
                    <td className="p-3">
                      <p className="font-medium text-xs">{t3.oldCampus?.old_campus_name || "N/A"}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs">{t3.old_programme_name}</p>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{t3.old_subject_code}</p>
                        <p className="text-xs text-gray-600">{t3.old_subject_name}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium">{t3.new_subject_code}</p>
                        <p className="text-xs text-gray-600">{t3.course?.course_name}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="font-medium text-xs">{t3.program?.program_code || "N/A"}</p>
                        <p className="text-xs text-gray-600">{t3.program?.program_name}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                        {t3.similarity_percentage}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        t3.is_active 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {t3.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}