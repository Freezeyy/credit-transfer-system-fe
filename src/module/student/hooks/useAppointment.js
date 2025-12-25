const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
    return localStorage.getItem("cts_token");
}

export async function createAppointment(payload) {
    const token = getToken();
    if (!token) return { success: false, message: "User not authenticated" };

    // Transform payload to match backend API
    const requestBody = {
        coordinator_id: payload.coordinatorId,
        appointment_start: payload.requestedStart,
        appointment_end: payload.requestedEnd,
        appointment_notes: payload.notes || null,
    };

    const res = await fetch(`${API_BASE}/appointment`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
        const errorData = await res.json();
        return { success: false, message: errorData.error || "Server error" };
    }

    const result = await res.json();
    return { success: true, data: result.appointment || result };
}

export async function getAppointmentHistory() {
    const token = getToken();
    if (!token) return { success: false, data: [] };

    const res = await fetch(`${API_BASE}/appointment/student`, {
        headers: {
            Authorization: "Bearer " + token,
        },
    });

    if (!res.ok) return { success: false, data: [] };

    const result = await res.json();
    // Transform backend response to match frontend expectations
    const transformedData = (result.appointments || []).map(app => ({
        id: app.appointment_id,
        coordinatorId: app.coordinator_id,
        coordinator: app.coordinator ? {
            id: app.coordinator.coordinator_id,
            name: app.coordinator.lecturer?.lecturer_name || 'Unknown',
            email: app.coordinator.lecturer?.lecturer_email || '',
            program: app.coordinator.program ? {
                code: app.coordinator.program.program_code,
                name: app.coordinator.program.program_name,
            } : null,
        } : null,
        requestedStart: app.appointment_start,
        requestedEnd: app.appointment_end,
        status: app.appointment_status === 'scheduled' ? 'pending' : app.appointment_status,
        notes: app.appointment_notes,
    }));
    return { success: true, data: transformedData };
}

export async function getCoordinators() {
    const token = getToken();
    if (!token) return { success: false, data: [] };

    const res = await fetch(`${API_BASE}/appointment/coordinators`, {
        headers: {
            Authorization: "Bearer " + token,
        },
    });

    if (!res.ok) return { success: false, data: [] };

    const result = await res.json();
    // Transform backend response to match frontend expectations
    const transformedData = (result.coordinators || []).map(coord => ({
        id: coord.coordinator_id,
        coordinatorId: coord.coordinator_id,
        name: coord.lecturer?.lecturer_name || 'Unknown',
        email: coord.lecturer?.lecturer_email || '',
        program: coord.program ? {
            code: coord.program.program_code,
            name: coord.program.program_name,
        } : null,
    }));
    return { success: true, data: transformedData };
}

// Cancel appointment
export async function cancelAppointment(id) {
    const token = getToken();
    if (!token) return { success: false, message: "User not authenticated" };

    const res = await fetch(`${API_BASE}/appointment/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
            appointment_status: 'cancelled',
        }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        return { success: false, message: errorData.error || "Failed to cancel appointment" };
    }

    const result = await res.json();
    return { success: true, data: result.appointment || result };
}
