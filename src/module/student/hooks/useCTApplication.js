const API_BASE = "http://localhost:3000/api";

function getToken() {
    return localStorage.getItem("cts_token");
}

// ===============================
// GET Program Structures (PDF + Subjects)
// ===============================
export async function getProgramStructures(programCode) {
    const token = getToken();
    if (!token) return { success: false, data: [] };

    const res = await fetch(`${API_BASE}/program-structures?program_code=${programCode}`, {
        headers: {
            Authorization: "Bearer " + token,
        },
    });

    if (!res.ok) return { success: false, data: [] };

    const result = await res.json();
    return { success: true, data: result.data || [] };
}

// ===============================
// GET My Credit Applications
// ===============================
export async function getMyCreditApplication() {
    const token = getToken();
    if (!token) return { success: false, data: [] };

    const res = await fetch(`${API_BASE}/credit-applications/mine`, {
        headers: {
            Authorization: "Bearer " + token,
        },
    });

    if (!res.ok) return { success: false, data: [] };

    const result = await res.json();
    return { success: true, data: result.data || [] };
}

// ===============================
// CREATE/SUBMIT Credit Transfer Application
// Handles both draft and immediate submission
// ===============================
export async function submitCreditTransfer(formData, draftId = null, isFinalSubmit = false) {
    const token = getToken();
    if (!token) return { success: false, message: "User not authenticated" };

    // If draftId exists, always use PATCH to update the draft
    // Pass submit='true' in formData to indicate final submission
    const url = draftId
        ? `${API_BASE}/credit-applications/${draftId}/draft`
        : `${API_BASE}/credit-applications`;

    const method = draftId ? "PATCH" : "POST";
    
    // If submitting a draft, add submit flag to formData
    if (draftId && isFinalSubmit) {
        formData.append("submit", "true");
    }

    try {
        const res = await fetch(url, {
            method,
            headers: { Authorization: "Bearer " + token },
            body: formData,
        });

        if (!res.ok) {
            const errorData = await res.json();
            return { success: false, message: errorData.error || "Server error" };
        }

        const data = await res.json();
        return { success: true, data };
    } catch (error) {
        console.error("Submit error:", error);
        return { success: false, message: error.message || "Network error" };
    }
}

// ===============================
// DELETE Credit Application (optional)
// ===============================
export async function deleteCreditApplication(applicationId) {
    const token = getToken();
    if (!token) return { success: false, message: "User not authenticated" };

    try {
        const res = await fetch(`${API_BASE}/credit-applications/${applicationId}`, {
            method: "DELETE",
            headers: {
                Authorization: "Bearer " + token,
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            return { success: false, message: errorData.error || "Server error" };
        }

        return { success: true };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, message: error.message || "Network error" };
    }
}