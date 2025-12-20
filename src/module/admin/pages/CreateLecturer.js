import React, { useState, useEffect } from 'react';
import { createLecturer } from '../hooks/useStaffManagement';

export default function CreateLecturer() {
  const [adminCampusId, setAdminCampusId] = useState(null);
  const [adminCampusName, setAdminCampusName] = useState('');
  const [formData, setFormData] = useState({
    lecturer_name: '',
    lecturer_email: '',
    lecturer_password: '',
    is_admin: false,
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // Get admin's campus_id from API
      const token = localStorage.getItem("cts_token");
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:3000/api'}/admin/lecturers`, {
        headers: { Authorization: "Bearer " + token },
      });
      
      if (res.ok) {
        const data = await res.json();
        // Find the current admin user
        const user = JSON.parse(localStorage.getItem("cts_user"));
        const adminLecturer = data.lecturers?.find(
          l => l.lecturer_email === user.email
        );
        
        if (adminLecturer && adminLecturer.campus_id) {
          setAdminCampusId(adminLecturer.campus_id);
          // Get campus name from included campus data
          setAdminCampusName(adminLecturer.campus?.campus_name || 'Unknown Campus');
        } else {
          alert('Unable to determine your campus. Please contact support.');
        }
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      alert('Error loading admin data. Please refresh the page.');
    }
    setLoading(false);
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
      campus_id: adminCampusId, // Use admin's campus_id
      is_admin: formData.is_admin,
      // Don't send role_type - roles are assigned separately via Manage Staff page
    };

    const res = await createLecturer(lecturerData);
    
    if (res.success) {
      alert('Lecturer created successfully!');
      // Reset form
      setFormData({
        lecturer_name: '',
        lecturer_email: '',
        lecturer_password: '',
        is_admin: false,
      });
    } else {
      alert(res.message || 'Failed to create lecturer');
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
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Lecturer</h1>
          <p className="text-gray-600">Create a new lecturer account for your campus. Roles can be assigned later via Manage Staff.</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
              <div className="space-y-4">
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
              </div>
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
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

