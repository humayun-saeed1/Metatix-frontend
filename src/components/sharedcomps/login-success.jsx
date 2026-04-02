import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function LoginSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // 1. Grab the token from the URL (e.g., ?token=eyJh...)
        const params = new URLSearchParams(location.search);
        const token = params.get("token");

        if (token) {
            // 2. Save token to Local Storage
            localStorage.setItem("access_token", token);
            
            // 3. Fetch User Profile to get their Role & Name
            axios.get(`${API_BASE_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then((response) => {
                const role = response.data.role;
                localStorage.setItem("user_role", role);
                localStorage.setItem("user_name", response.data.name);

                // 4. Smart Routing!
                if (role === "Admin") navigate("/admin-dashboard");
                else if (role === "Organizer") navigate("/organizer-dashboard");
                else navigate("/BookingPage"); // Or wherever normal users go
            })
            .catch((err) => {
                console.error("Failed to fetch user profile after Google login:", err);
                alert("Login failed to verify role. Please try again.");
                navigate("/login");
            });

        } else {
            // If no token is found, send them back to login
            navigate("/login");
        }
    }, [location, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F5F9]">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-[#6E39CB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-bold font-['Lato'] text-gray-800">Authenticating with Google...</h2>
                <p className="text-gray-500 font-['Lato'] mt-2">Setting up your dashboard securely.</p>
            </div>
        </div>
    );
}

export default LoginSuccess;