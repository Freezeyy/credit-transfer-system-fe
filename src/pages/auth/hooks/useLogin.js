// src/pages/auth/hooks/useLogin.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function useLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const users = {
    "student@university.edu": { password: "student123", role: "Student" },
    "coordinator@university.edu": { password: "coordinator123", role: "Program Coordinator" },
    "expert@university.edu": { password: "expert123", role: "Subject Method Expert" },
    "hos@university.edu": { password: "hos123", role: "Head Of Section" },
    "admin@university.edu": { password: "admin123", role: "Administrator" },
    };

    const login = (onSuccess) => {
        setError("");
        setLoading(true);

        setTimeout(() => {
        const user = users[email];
        if (user && user.password === password) {
            const session = { email, role: user.role };
            localStorage.setItem("cts_user", JSON.stringify(session));
            onSuccess(session);
        } else {
            setError("Invalid email or password");
        }
        setLoading(false);
        }, 700);
    };

    const navigate = useNavigate();

    const handleLoginSuccess = (u) => {
        if (u.role === "Student") navigate("/student");
        if (u.role === "Program Coordinator") navigate("/coordinator");
        if (u.role === "Subject Method Expert") navigate("/expert");
        if (u.role === "Head Of Section") navigate("/hos");
        if (u.role === "Administrator") navigate("/admin");
    };

    const onSubmitLogin = (e) => {
        e.preventDefault();
        login(handleLoginSuccess);
    };

    return { email, setEmail, password, setPassword, loading, error, onSubmitLogin, };
}
