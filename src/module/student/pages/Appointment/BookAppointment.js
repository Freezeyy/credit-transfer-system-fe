import React, { useState, useEffect } from "react";
import { createAppointment, getAppointmentHistory, getCoordinators, cancelAppointment } from "../../hooks/useAppointment";
import { PaperClipIcon } from "@heroicons/react/outline";

export default function BookAppointment() {
    const [appointments, setAppointments] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [coordinators, setCoordinators] = useState([]);

    const [form, setForm] = useState({ coordinatorId: "", date: "", time: "" });

    const [showNotesModal, setShowNotesModal] = useState(false);
    const [notesToShow, setNotesToShow] = useState("");

    useEffect(() => {
        loadHistory();
        loadCoordinators();
    }, []);

    const loadHistory = async () => {
        setLoadingHistory(true);
        const res = await getAppointmentHistory();
        if (res.success) setAppointments(res.data);
        else setAppointments([]);
        setLoadingHistory(false);
    };

    const loadCoordinators = async () => {
        const res = await getCoordinators();
        if (res.success) setCoordinators(res.data);
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if a pending appointment already exists
        const hasPending = appointments.some(app => app.status.toLowerCase() === "pending");
        if (hasPending) {
            alert("You already have a pending appointment. Please wait for it or cancel before booking a new one.");
            return;
        }

        if (!form.coordinatorId || !form.date || !form.time) {
            alert("Please select a coordinator, date, and time.");
            return;
        }

        const requestedStart = new Date(`${form.date}T${form.time}:00`).toISOString();
        const requestedEnd = new Date(new Date(requestedStart).getTime() + 30 * 60000).toISOString();

        const payload = {
            coordinatorId: parseInt(form.coordinatorId),
            requestedStart,
            requestedEnd,
        };

        const res = await createAppointment(payload);
        if (res.success) {
            alert("Appointment booked!");
            loadHistory();
            setForm({ coordinatorId: "", date: "", time: "" });
        } else {
            alert(res.message || "Failed to book appointment");
        }
    };

    const openNotesModal = (notes) => {
        setNotesToShow(notes);
        setShowNotesModal(true);
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

        const res = await cancelAppointment(id);
        if (res.success) {
            alert("Appointment cancelled!");
            loadHistory();
        } else {
            alert(res.message || "Failed to cancel appointment");
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Book Appointment Form */}
            <div className="bg-white shadow rounded p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">Book Appointment</h2>
                <form className="grid gap-4 max-w-lg" onSubmit={handleSubmit}>
                    <div>
                        <label className="font-medium">Program Coordinator</label>
                        <select name="coordinatorId" value={form.coordinatorId} onChange={handleChange} className="w-full mt-1 p-2 border rounded" required>
                            <option value="">Select Coordinator</option>
                            {coordinators.map(pc => <option key={pc.id} value={pc.id}>{pc.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="font-medium">Date</label>
                        <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full mt-1 p-2 border rounded" required />
                    </div>
                    <div>
                        <label className="font-medium">Time</label>
                        <input type="time" name="time" value={form.time} onChange={handleChange} className="w-full mt-1 p-2 border rounded" required />
                    </div>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded mt-2">Book Appointment</button>
                </form>
            </div>

            {/* Appointment History Table */}
            <div className="bg-white shadow rounded p-6">
                <h2 className="text-xl font-bold mb-4">Your Appointments</h2>
                <div className="overflow-x-auto">
                    <table className="w-full border">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 border">PC</th>
                                <th className="p-2 border">Date</th>
                                <th className="p-2 border">Time</th>
                                <th className="p-2 border">Status</th>
                                <th className="p-2 border">Notes</th>
                                <th className="p-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingHistory ? (
                                <tr><td colSpan="6" className="p-4 text-center">Loading appointments...</td></tr>
                            ) : appointments.length > 0 ? (
                                [...appointments]
                                .sort((a, b) => {
                                    const order = { pending: 1, rejected: 2, cancelled: 3 };
                                    return (order[a.status.toLowerCase()] || 99) - (order[b.status.toLowerCase()] || 99);
                                })
                                .map(app => (
                                    <tr key={app.id}>
                                    <td className="p-2 border">{app.coordinator.name}</td>
                                    <td className="p-2 border">{new Date(app.requestedStart).toLocaleDateString()}</td>
                                    <td className="p-2 border">{new Date(app.requestedStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td className="p-2 border">{app.status}</td>
                                    <td className="p-2 border text-center">
                                        {app.notes ? (
                                        <button onClick={() => openNotesModal(app.notes)}>
                                            <PaperClipIcon className="h-5 w-5 mx-auto text-gray-600 hover:text-gray-800" />
                                        </button>
                                        ) : "—"}
                                    </td>
                                    <td className="p-2 border text-center">
                                        {app.status.toLowerCase() === "pending" && (
                                        <button
                                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                            onClick={() => handleCancel(app.id)}
                                        >
                                            ✖
                                        </button>
                                        )}
                                    </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-4 text-center text-gray-500">No appointments yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h3 className="text-lg font-bold mb-2">Notes</h3>
                        <p className="mb-4 whitespace-pre-wrap">{notesToShow}</p>
                        <div className="flex justify-end">
                            <button className="bg-gray-300 px-3 py-1 rounded hover:bg-gray-400" onClick={() => setShowNotesModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
