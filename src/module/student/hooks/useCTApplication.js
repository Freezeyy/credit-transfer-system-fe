const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

function getToken() {
    return localStorage.getItem("cts_token");
}

// ===============================
// GET Program Structure (and optionally courses for logged-in student)
// Query params: includeCourses=true to also get courses
// ===============================
export async function getProgramStructure(includeCourses = false) {
    const token = getToken();
    if (!token) return { success: false, data: null };
    
    try {
        const url = includeCourses 
            ? `${API_BASE}/program/structure?includeCourses=true`
            : `${API_BASE}/program/structure`;
            
        const res = await fetch(url, {
            headers: { Authorization: "Bearer " + token },
        });
        
        if (!res.ok) return { success: false, data: null };
        const result = await res.json();
        return { 
            success: true, 
            program: result.program || null,
            courses: result.courses || null
        };
    } catch (error) {
        console.error("Get program structure error:", error);
        return { success: false, data: null };
    }
}


// ===============================
// GET Student Profile (for previous study details)
// ===============================
export async function getStudentProfile() {
    const token = getToken();
    if (!token) return { success: false, data: null };
    
    try {
        const res = await fetch(`${API_BASE}/student/profile`, {
            headers: { Authorization: "Bearer " + token },
        });
        
        if (!res.ok) return { success: false, data: null };
        const result = await res.json();
        return { success: true, data: result.student || result };
    } catch (error) {
        console.error("Get student profile error:", error);
        return { success: false, data: null };
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