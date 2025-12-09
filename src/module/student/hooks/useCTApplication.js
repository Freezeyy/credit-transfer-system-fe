const API_BASE = "http://localhost:3000/api";

function getToken() {
    return localStorage.getItem("cts_token");
}

// ===============================
// GET Program Structure (for logged-in student)
// ===============================
export async function getProgramStructure() {
    const token = getToken();
    if (!token) return { success: false, data: null };
    
    try {
        const res = await fetch(`${API_BASE}/program/structure`, {
            headers: { Authorization: "Bearer " + token },
        });
        
        if (!res.ok) return { success: false, data: null };
        const result = await res.json();
        return { success: true, data: result.program || null };
    } catch (error) {
        console.error("Get program structure error:", error);
        return { success: false, data: null };
    }
}

// ===============================
// GET Program Courses (for logged-in student)
// ===============================
export async function getProgramCourses() {
    const token = getToken();
    if (!token) return { success: false, data: [] };
    
    try {
        const res = await fetch(`${API_BASE}/program/courses`, {
            headers: { Authorization: "Bearer " + token },
        });
        
        if (!res.ok) return { success: false, data: [] };
        const result = await res.json();
        return { success: true, data: result.courses || [] };
    } catch (error) {
        console.error("Get program courses error:", error);
        return { success: false, data: [] };
    }
}

// ===============================
// GET My Credit Applications
// ===============================
export async function getMyCreditApplication() {
    const token = getToken();
    if (!token) return { success: false, data: [] };
    
    try {
        const res = await fetch(`${API_BASE}/credit-transfer/applications`, {
            headers: { Authorization: "Bearer " + token },
        });
        
        if (!res.ok) return { success: false, data: [] };
        const result = await res.json();
        return { success: true, data: result.applications || [] };
    } catch (error) {
        console.error("Get applications error:", error);
        return { success: false, data: [] };
    }
}

// ===============================
// SUBMIT Credit Transfer Application (supports drafts)
// ===============================
export async function submitCreditTransfer(formData, draftId = null, isFinalSubmit = false) {
    const token = getToken();
    if (!token) return { success: false, message: "User not authenticated" };
    
    // Add draftId to formData if updating existing draft
    if (draftId) {
        formData.append("draftId", draftId);
    }
    
    try {
        const res = await fetch(`${API_BASE}/credit-transfer/apply`, {
            method: "POST", // Always POST, even for draft updates
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