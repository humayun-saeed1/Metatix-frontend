import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function ResetPassword() {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [token, setToken] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    // Grab the token from the URL as soon as the page loads
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlToken = params.get("token");
        if (urlToken) {
            setToken(urlToken);
        } else {
            alert("Invalid or missing reset token. Please request a new link.");
            navigate("/login");
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        try {
            const payload = {
                token: token,
                new_password: newPassword
            };

            await axios.post(`${API_BASE_URL}/auth/reset-password`, payload);
            
            // Show the success message
            setSuccessMessage("✅ Password reset successfully! Redirecting to login...");
            
            // Wait 2 seconds, then send them to the login page
            setTimeout(() => {
                navigate("/login");
            }, 2000);
            
        } catch (error) {
            if (error.response) {
                alert("Error: " + error.response.data.detail);
            } else {
                alert("Network error. Is the backend running?");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F5F9] font-['Lato'] p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md flex flex-col gap-6">
                
                <div className="text-center">
                    <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[#6E39CB]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 font-['bebas-neue'] tracking-wide">Create New Password</h2>
                    <p className="text-sm text-gray-500 mt-2">Your new password must be different from previously used passwords.</p>
                </div>

                {/* Success Message Display */}
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-center font-bold text-sm animate-pulse">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-1 block">New Password</label>
                        <input 
                            type="password" 
                            placeholder="Enter new password" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#6E39CB] transition-all"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-1 block">Confirm Password</label>
                        <input 
                            type="password" 
                            placeholder="Confirm new password" 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-[#6E39CB] transition-all"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="w-full mt-2 bg-[#6E39CB] text-white py-3.5 rounded-xl font-bold hover:bg-[#5a2ca0] transition-colors shadow-md"
                    >
                        Reset Password
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;