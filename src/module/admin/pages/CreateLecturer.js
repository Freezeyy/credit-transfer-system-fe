import React, { useState, useEffect, useCallback } from 'react';
import { createLecturer, getLecturers } from '../hooks/useStaffManagement';

export default function CreateLecturer() {
  const [adminCampusId, setAdminCampusId] = useState(null);
  const [adminCampusName, setAdminCampusName] = useState('');
  const [lecturers, setLecturers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLecturers, setLoadingLecturers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [formData, setFormData] = useState({
    lecturer_name: '',
    lecturer_email: '',
    lecturer_password: '',
    is_admin: false,
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadLecturers = useCallback(async () => {
    if (!adminCampusId) return;
    setLoadingLecturers(true);
    const res = await getLecturers(currentPage, searchQuery);
    if (res.success) {
      setLecturers(res.data);
      setPagination(res.pagination);
    }
    setLoadingLecturers(false);
  }, [adminCampusId, currentPage, searchQuery]);

  useEffect(() => {
    if (adminCampusId) {
      loadLecturers();
    }
  }, [adminCampusId, loadLecturers]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Get admin's campus_id from API
      const token = localStorage.getItem("cts_token");
      const user = JSON.parse(localStorage.getItem("cts_user"));
      
      console.log("🔍 Loading admin data...");
      console.log("📧 Current user email:", user?.email);
      
      // Fetch with higher limit or search by email to ensure we get the current admin
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:3000/api'}/admin/lecturers?page=1&limit=100&search=${encodeURIComponent(user?.email || '')}`, {
        headers: { Authorization: "Bearer " + token },
      });
      
      console.log("📡 API response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("📦 API data received:", data);
        console.log("👥 Number of lecturers:", data.lecturers?.length);
        
        // Find the current admin user
        const adminLecturer = data.lecturers?.find(
          l => l.lecturer_email === user.email
        );
        
        console.log("🎯 Found admin lecturer:", adminLecturer);
        
        if (adminLecturer && adminLecturer.campus_id) {
          console.log("✅ Campus ID found:", adminLecturer.campus_id);
          console.log("🏫 Campus name:", adminLecturer.campus?.campus_name);
          
          setAdminCampusId(adminLecturer.campus_id);
          setAdminCampusName(adminLecturer.campus?.campus_name || 'Unknown Campus');
        } else {
          console.error("❌ Admin lecturer not found or missing campus_id");
          console.error("Available lecturers:", data.lecturers?.map(l => ({ email: l.lecturer_email, campus_id: l.campus_id })));
          alert('Unable to determine your campus. Please contact support.');
        }
      } else {
        console.error("❌ API request failed:", res.status, res.statusText);
        const errorText = await res.text();
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("💥 Error loading admin data:", error);
      alert('Error loading admin data. Please refresh the page.');
    }
    setLoading(false);
  };


  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.lecturer_name || !formData.lecturer_email || !formData.lecturer_password) {
      alert('Please fill in all required fields');
      return;
    }

    if (!adminCampusId) {
      alert('Unable to determine your campus. Please contact support.');
      return;
    }

    setSubmitting(true);
    
    const lecturerData = {
      lecturer_name: formData.lecturer_name,
      lecturer_email: formData.lecturer_email,
      lecturer_password: formData.lecturer_password,
      campus_id: adminCampusId,
      is_admin: formData.is_admin,
    };

    const res = await createLecturer(lecturerData);
    
    if (res.success) {
      alert('Lecturer created successfully!');
      // Reset form and close modal
      setFormData({
        lecturer_name: '',
        lecturer_email: '',
        lecturer_password: '',
        is_admin: false,
      });
      setShowCreateModal(false);
      // Reload lecturers list
      loadLecturers();
    } else {
      alert(res.message || 'Failed to create account');
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
        <p className="text-gray-600">Manage lecturers for your campus. Create new accounts and view existing ones.</p>
      </div>

      {/* Search and Create Button */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearch}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Create Account
          </button>
        </div>
      </div>

      {/* Lecturers List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Lecturers ({adminCampusName})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingLecturers ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    Loading lecturers...
                  </td>
                </tr>
              ) : lecturers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No lecturers found
                  </td>
                </tr>
              ) : (
                lecturers.map((lecturer) => (
                  <tr key={lecturer.lecturer_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lecturer.lecturer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lecturer.lecturer_email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lecturer.is_admin ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Admin
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lecturer.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} lecturers
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Create New Account</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.lecturer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, lecturer_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.lecturer_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, lecturer_email: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.lecturer_password}
                  onChange={(e) => setFormData(prev => ({ ...prev, lecturer_password: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campus
                </label>
                <input
                  type="text"
                  value={adminCampusName || 'Loading...'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lecturers can only be created for your campus
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={formData.is_admin}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_admin: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-700">
                  Grant Admin Access
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Lecturer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      lecturer_name: '',
                      lecturer_email: '',
                      lecturer_password: '',
                      is_admin: false,
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
