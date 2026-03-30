import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import useRegister, {
  getProgramsForRegistration,
  getCampusesForRegistration,
  getUniTypesForRegistration,
  getInstitutionsForRegistration,
  getOldCampusesByInstitutionForRegistration,
} from "../hooks/useRegister";
import UNIKLlogo from "../../assets/logo.png";

export default function Register() {
  const { formData, handleChange, loading, error, onSubmitRegister } = useRegister();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [uniTypes, setUniTypes] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [oldCampuses, setOldCampuses] = useState([]);
  const [showOldCampusSelect, setShowOldCampusSelect] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [loadingOldCampuses, setLoadingOldCampuses] = useState(false);

  // Load campuses and old campuses on mount
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      const [campusesRes, uniTypesRes] = await Promise.all([
        getCampusesForRegistration(),
        getUniTypesForRegistration(),
      ]);
      if (campusesRes.success) {
        setCampuses(campusesRes.data);
      }
      if (uniTypesRes.success) setUniTypes(uniTypesRes.data);
      setLoadingData(false);
    }
    loadData();
  }, []);

  // Load programs when campus is selected
  useEffect(() => {
    async function loadProgramsForCampus() {
      if (!formData.campus_id) {
        setPrograms([]);
        // Reset program selection when campus is cleared
        if (formData.program_id) {
          handleChange("program_id", "");
        }
        return;
      }

      setLoadingPrograms(true);
      const programsRes = await getProgramsForRegistration(formData.campus_id);
      if (programsRes.success) {
        setPrograms(programsRes.data);
        // Reset program selection when campus changes
        handleChange("program_id", "");
      }
      setLoadingPrograms(false);
    }
    loadProgramsForCampus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.campus_id]);

  // Load institutions when uni type is selected
  useEffect(() => {
    async function loadInstitutions() {
      setInstitutions([]);
      setOldCampuses([]);
      setShowOldCampusSelect(false);
      if (formData.institution_id) handleChange("institution_id", "");
      if (formData.old_campus_id) handleChange("old_campus_id", "");
      if (!formData.uni_type_id) return;

      setLoadingInstitutions(true);
      const res = await getInstitutionsForRegistration(formData.uni_type_id);
      if (res.success) setInstitutions(res.data);
      setLoadingInstitutions(false);
    }
    loadInstitutions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.uni_type_id]);

  // Load old campuses when institution is selected
  useEffect(() => {
    async function loadOldCampuses() {
      setOldCampuses([]);
      setShowOldCampusSelect(false);
      if (formData.old_campus_id) handleChange("old_campus_id", "");
      if (!formData.institution_id) return;

      setLoadingOldCampuses(true);
      const res = await getOldCampusesByInstitutionForRegistration(formData.institution_id);
      const list = res.success ? res.data : [];
      setOldCampuses(list);

      if (list.length === 1) {
        handleChange("old_campus_id", String(list[0].old_campus_id));
        setShowOldCampusSelect(false);
      } else if (list.length > 1) {
        setShowOldCampusSelect(true);
      } else {
        // 0 campuses: should never happen (backend requires old_campus_id)
        setShowOldCampusSelect(false);
      }
      setLoadingOldCampuses(false);
    }
    loadOldCampuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.institution_id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <img src={UNIKLlogo} alt="Logo" className="mx-auto mb-4 h-16" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Registration</h1>
          <p className="text-gray-600">Create your account to apply for credit transfer</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmitRegister} className="space-y-6">
          {/* Personal Information */}
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@university.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="+60123456789"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Account Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Current Program Information */}
          <div className="border-b pb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Current Program Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campus <span className="text-red-500">*</span>
                </label>
                {loadingData ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    Loading campuses...
                  </div>
                ) : (
                  <select
                    value={formData.campus_id}
                    onChange={(e) => handleChange("campus_id", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Campus First</option>
                    {campuses.map((campus) => (
                      <option key={campus.campus_id} value={campus.campus_id}>
                        {campus.campus_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program <span className="text-red-500">*</span>
                </label>
                {!formData.campus_id ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                    Please select a campus first
                  </div>
                ) : loadingPrograms ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    Loading programs...
                  </div>
                ) : (
                  <select
                    value={formData.program_id}
                    onChange={(e) => handleChange("program_id", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                    disabled={!formData.campus_id || loadingPrograms}
                  >
                    <option value="">Select Program</option>
                    {programs.length === 0 ? (
                      <option value="" disabled>No programs available for this campus</option>
                    ) : (
                      programs.map((program) => (
                        <option key={program.program_id} value={program.program_id}>
                          {program.program_code} - {program.program_name}
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Previous Study Information */}
          <div className="pb-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Previous Study Information</h2>
            <p className="text-sm text-gray-600 mb-4">
              Please provide details about your previous institution and program. This information will be used when you apply for credit transfer.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Type <span className="text-red-500">*</span>
                </label>
                {loadingData ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    Loading institution types...
                  </div>
                ) : (
                  <select
                    value={formData.uni_type_id}
                    onChange={(e) => handleChange("uni_type_id", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Type</option>
                    {uniTypes.map((t) => (
                      <option key={t.uni_type_id} value={t.uni_type_id}>
                        {t.uni_type_code} - {t.uni_type_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Institution <span className="text-red-500">*</span>
                </label>
                {!formData.uni_type_id ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                    Please select an institution type first
                  </div>
                ) : loadingInstitutions ? (
                  <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                    Loading institutions...
                  </div>
                ) : (
                  <select
                    value={formData.institution_id}
                    onChange={(e) => handleChange("institution_id", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Institution</option>
                    {institutions.map((inst) => (
                      <option key={inst.institution_id} value={inst.institution_id}>
                        {inst.institution_name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {showOldCampusSelect && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Previous Institution Campus <span className="text-red-500">*</span>
                  </label>
                  {!formData.institution_id ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                      Please select an institution first
                    </div>
                  ) : loadingOldCampuses ? (
                    <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100">
                      Loading campuses...
                    </div>
                  ) : (
                    <select
                      value={formData.old_campus_id}
                      onChange={(e) => handleChange("old_campus_id", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Campus</option>
                      {oldCampuses.map((oc) => (
                        <option key={oc.old_campus_id} value={oc.old_campus_id}>
                          {oc.old_campus_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Programme Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.prev_programme_name}
                  onChange={(e) => handleChange("prev_programme_name", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Bachelor of Computer Science"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loadingData}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
