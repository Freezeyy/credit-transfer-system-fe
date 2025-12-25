import React, { useState, useEffect, useCallback } from 'react';
import {
  getLecturers,
  getStaffAssignments,
  updateLecturerRole,
  endStaffRole,
  getCoursesForProgram,
  getPrograms,
  getAllCourses,
} from '../hooks/useStaffManagement';

export default function ManageStaff() {
  const [lecturers, setLecturers] = useState([]);
  const [staffAssignments, setStaffAssignments] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [formData, setFormData] = useState({
    role_type: '',
    program_id: '',
    course_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  });

  const loadData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    
    const [lecturersRes, assignmentsRes, programsRes] = await Promise.all([
      getLecturers(currentPage, searchQuery),
      getStaffAssignments(),
      getPrograms(),
    ]);

    if (lecturersRes.success) {
      setLecturers(lecturersRes.data);
      setPagination(lecturersRes.pagination);
    }

    if (assignmentsRes.success) {
      setStaffAssignments(assignmentsRes.data);
    }

    if (programsRes.success) {
      setPrograms(programsRes.data);
    }
    
    if (isInitial) {
      setInitialLoading(false);
    } else {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  // Initial load - only run once on mount
  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subsequent loads when page or search changes
  useEffect(() => {
    if (!initialLoading) {
      loadData(false);
    }
  }, [initialLoading, loadData]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleAssignRole = async (lecturerId) => {
    const lecturer = lecturers.find(l => l.lecturer_id === lecturerId);
    setSelectedLecturer(lecturer);
    setFormData({
      role_type: '',
      program_id: '',
      course_id: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
    });
    setShowAssignModal(true);
  };

  const handleRoleTypeChange = async (roleType) => {
    setFormData(prev => ({ ...prev, role_type: roleType, course_id: '', program_id: '' }));
    
    if (roleType === 'sme') {
      // Load all courses for admin's campus (no program required for SME)
      const res = await getAllCourses();
      if (res.success) {
        setCourses(res.data);
      }
    } else {
      setCourses([]);
    }
  };

  const handleProgramChange = async (programId) => {
    setFormData(prev => ({ ...prev, program_id: programId }));
    
    // Only load courses for program if role is coordinator
    if (formData.role_type === 'coordinator' && programId) {
      const res = await getCoursesForProgram(programId);
      if (res.success) {
        setCourses(res.data);
      }
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    if (!selectedLecturer) return;

    const roleData = {
      role_type: formData.role_type,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
    };

    if (formData.role_type === 'coordinator') {
      if (!formData.program_id) {
        alert('Please select a program for Coordinator role');
        return;
      }
      roleData.program_id = parseInt(formData.program_id);
    } else if (formData.role_type === 'sme') {
      if (!formData.course_id) {
        alert('Please select a course for SME role');
        return;
      }
      roleData.course_id = parseInt(formData.course_id);
      // Remove program_id for SME - not required
      delete roleData.program_id;
    }

    const res = await updateLecturerRole(selectedLecturer.lecturer_id, roleData);
    
    if (res.success) {
      alert('Role assigned successfully!');
      setShowAssignModal(false);
      loadData();
    } else {
      alert(res.message || 'Failed to assign role');
    }
  };

  const handleEndRole = async (roleType, roleId, event) => {
    event.stopPropagation(); // Prevent any parent click handlers
    if (!window.confirm(`Are you sure you want to end this ${roleType} assignment?`)) return;

    const res = await endStaffRole(roleType, roleId);
    
    if (res.success) {
      alert('Role ended successfully!');
      loadData();
    } else {
      alert(res.message || 'Failed to end role');
    }
  };

  const getLecturerRoles = (lecturerId) => {
    const roles = [];
    
    if (staffAssignments?.coordinators) {
      const coord = staffAssignments.coordinators.find(c => c.lecturer?.lecturer_id === lecturerId);
      if (coord) roles.push({ type: 'Coordinator', data: coord });
    }
    
    if (staffAssignments?.subjectMethodExperts) {
      const smes = staffAssignments.subjectMethodExperts.filter(s => s.lecturer?.lecturer_id === lecturerId);
      smes.forEach(sme => roles.push({ type: 'SME', data: sme }));
    }
    
    if (staffAssignments?.headOfSections) {
      const hos = staffAssignments.headOfSections.find(h => h.lecturer?.lecturer_id === lecturerId);
      if (hos) roles.push({ type: 'Head of Section', data: hos });
    }
    
    return roles;
  };

  // Get all courses for a lecturer (for SME roles)
  const getLecturerCourses = (lecturerId) => {
    if (!staffAssignments?.subjectMethodExperts) return [];
    const smes = staffAssignments.subjectMethodExperts.filter(s => s.lecturer?.lecturer_id === lecturerId);
    return smes.map(sme => sme.course).filter(Boolean);
  };

  if (initialLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading staff data...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Manage Role</h1>
          <p className="text-gray-600">Assign roles (Coordinator, SME, Head of Section) to staff members</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={handleSearch}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lecturers List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Lecturers</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course (SME)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                        Loading...
                      </div>
                    </td>
                  </tr>
                ) : lecturers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No lecturers found
                    </td>
                  </tr>
                ) : (
                  lecturers.map((lecturer) => {
                    const roles = getLecturerRoles(lecturer.lecturer_id);
                    const smeCourses = getLecturerCourses(lecturer.lecturer_id);
                    return (
                      <tr key={lecturer.lecturer_id}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{lecturer.lecturer_name}</div>
                            <div className="text-sm text-gray-500">{lecturer.lecturer_email}</div>
                            {lecturer.is_admin && (
                              <span className="inline-block mt-1 text-xs text-purple-600 font-medium">Admin</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {roles.length > 0 ? (
                              roles.map((role, idx) => {
                                const roleId = role.type === 'Coordinator' ? role.data.coordinator_id :
                                              role.type === 'SME' ? role.data.sme_id :
                                              role.data.hos_id;
                                const roleType = role.type === 'Coordinator' ? 'coordinator' :
                                               role.type === 'SME' ? 'sme' : 'hos';
                                return (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {role.type}
                                    {role.type === 'Coordinator' && role.data.program && (
                                      <span>({role.data.program.program_code})</span>
                                    )}
                                    {role.type === 'SME' && role.data.course && (
                                      <span>({role.data.course.course_code})</span>
                                    )}
                                    <button
                                      onClick={(e) => handleEndRole(roleType, roleId, e)}
                                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors flex items-center justify-center"
                                      title={`End ${role.type} role`}
                                    >
                                      <span className="text-xs font-bold">×</span>
                                    </button>
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-sm text-gray-400 italic">No roles assigned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {smeCourses.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {smeCourses.map((course, idx) => (
                                <span key={idx}>
                                  {course.course_code} - {course.course_name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleAssignRole(lecturer.lecturer_id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Assign Role
                          </button>
                        </td>
                      </tr>
                    );
                  })
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

        {/* Assign Role Modal */}
        {showAssignModal && selectedLecturer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Assign Role to {selectedLecturer.lecturer_name}</h3>
              
              <form onSubmit={handleSubmitAssignment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role Type *
                    </label>
                    <select
                      value={formData.role_type}
                      onChange={(e) => handleRoleTypeChange(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="">Select Role</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="sme">Subject Method Expert (SME)</option>
                      <option value="hos">Head of Section</option>
                    </select>
                  </div>

                  {formData.role_type === 'coordinator' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program *
                      </label>
                      <select
                        value={formData.program_id}
                        onChange={(e) => handleProgramChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                      >
                        <option value="">Select Program</option>
                        {programs.map(prog => (
                          <option key={prog.program_id} value={prog.program_id}>
                            {prog.program_code} - {prog.program_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.role_type === 'sme' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Course *
                      </label>
                      <select
                        value={formData.course_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, course_id: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        required
                        disabled={courses.length === 0}
                      >
                        <option value="">{courses.length === 0 ? 'Loading courses...' : 'Select Course'}</option>
                        {courses.map(course => (
                          <option key={course.course_id} value={course.course_id}>
                            {course.course_code} - {course.course_name}
                            {course.programs && course.programs.length > 0 && (
                              ` (${course.programs.map(p => p.program_code).join(', ')})`
                            )}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        SME can be assigned to any course regardless of program
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Assign Role
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
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

