import React, { useEffect, useState } from "react";
import { getAppointmentHistory, updateAppointmentStatus } from "../../hooks/useViewAppointment";
import { PaperClipIcon } from "@heroicons/react/outline";

export default function ViewAppointment() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Approve/Reject popup
  const [selectedApp, setSelectedApp] = useState(null);
  const [popupNotes, setPopupNotes] = useState("");
  const [popupAction, setPopupAction] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Notes modal popup
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesToShow, setNotesToShow] = useState("");

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    setLoading(true);
    const res = await getAppointmentHistory();
    if (res.success) setAppointments(res.data);
    else setAppointments([]);
    setLoading(false);
  };

  const handleActionClick = (app, action) => {
    setSelectedApp(app);
    setPopupAction(action);
    setPopupNotes("");
    setShowPopup(true);
  };

  const handleConfirm = async () => {
    if (!selectedApp) return;
    // Map frontend status to backend status
    const statusMap = {
      'approved': 'approved',
      'rejected': 'rejected',
      'pending': 'scheduled',
    };
    const payload = { status: statusMap[popupAction.toLowerCase()] || popupAction.toLowerCase() };
    if (popupNotes.trim() !== "") payload.notes = popupNotes.trim();

    const res = await updateAppointmentStatus(selectedApp.id, payload);
    if (res.success) {
      alert(`Appointment ${popupAction}!`);
      loadAppointments();
      setShowPopup(false);
    } else {
      alert(res.message || "Failed to update");
    }
  };

  const openNotesModal = (notes) => {
    setNotesToShow(notes);
    setShowNotesModal(true);
  };

  const pendingApps = appointments.filter(a => a.status.toLowerCase() === "pending");
  const approvedApps = appointments.filter(a => a.status.toLowerCase() === "approved");
  const rejectedApps = appointments.filter(a => a.status.toLowerCase() === "rejected");

  const renderTable = (data, showActions = false, showNotes = false) => (
    <div className="overflow-x-auto bg-white shadow rounded p-4 mb-6">
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Student</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Time</th>
            <th className="p-2 border">Status</th>
            {showNotes && <th className="p-2 border">Notes</th>}
            {showActions && <th className="p-2 border">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={showNotes ? 5 : 4} className="p-4 text-center">Loading...</td></tr>
          ) : data.length > 0 ? (
            data.map(app => (
              <tr key={app.id}>
                <td className="p-2 border">{app.student.name}</td>
                <td className="p-2 border">{new Date(app.requestedStart).toLocaleDateString()}</td>
                <td className="p-2 border">{new Date(app.requestedStart).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                <td className="p-2 border">{app.status}</td>
                {showNotes && (
                  <td className="p-2 border text-center">
                    {app.notes ? (
                      <button onClick={() => openNotesModal(app.notes)}>
                        <PaperClipIcon className="h-5 w-5 mx-auto text-gray-600 hover:text-gray-800" />
                      </button>
                    ) : "—"}
                  </td>
                )}
                {showActions && (
                  <td className="p-2 border space-x-2">
                    <button
                      className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      onClick={() => handleActionClick(app, "Approved")}
                    >✔</button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                      onClick={() => handleActionClick(app, "Rejected")}
                    >✖</button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr><td colSpan={showNotes ? 5 : 4} className="p-4 text-center text-gray-500">No appointments</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Pending Appointments</h2>
      {renderTable(pendingApps, true, false)}

      <div className="flex space-x-6">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Approved</h2>
          {renderTable(approvedApps, false, true)}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-4">Rejected</h2>
          {renderTable(rejectedApps, false, true)}
        </div>
      </div>

      {/* Approve/Reject Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h3 className="text-lg font-bold mb-2">{popupAction} Appointment ?</h3>
            <p className="mb-2">Optional notes:</p>
            <textarea
              className="w-full p-2 border rounded mb-4"
              value={popupNotes}
              onChange={(e) => setPopupNotes(e.target.value)}
              placeholder="Enter notes (optional)"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                onClick={() => setShowPopup(false)}
              >Cancel</button>
              <button
                className={`px-3 py-1 rounded text-white ${popupAction === "Approved" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                onClick={handleConfirm}
              >Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h3 className="text-lg font-bold mb-2">Notes</h3>
            <p className="mb-4 whitespace-pre-wrap">{notesToShow}</p>
            <div className="flex justify-end">
              <button
                className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400"
                onClick={() => setShowNotesModal(false)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
