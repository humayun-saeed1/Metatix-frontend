import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidenav";
import LoadingSpinner from "../../sharedcomps/LoadingSpinner"; 

function Profile() {
    const [profile, setProfile] = useState({ name: "", email: "", role: "", is_organizer_pending: false, profile_pic_url: null, auth_provider: "local" });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false); 

    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");

    // 🚨 NEW: Error & Status States
    const [errors, setErrors] = useState({});
    const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

    const token = localStorage.getItem("access_token");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get("https://metatix-backend-production.up.railway.app/users/me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfile(response.data);
                setEditName(response.data.name);
                setEditEmail(response.data.email);
                setLoading(false);
            } catch (error) {
                console.error("🚨 Failed to fetch profile:", error);
                setErrors({ general: "Failed to load profile data." });
                setLoading(false);
            }
        };

        if (token) fetchProfile();
    }, [token]);

    // 🚨 STRICT VALIDATIONS
    // 🚨 ULTIMATE ANTI-MASH NAME VALIDATION 🚨
    const validateName = (name) => {
        // Clean up double spaces immediately
        const trimmed = name.trim().replace(/\s+/g, ' '); 
        
        if (!trimmed) return "Name cannot be empty.";
        if (trimmed.length < 2) return "Name must be at least 2 characters.";
        if (trimmed.length > 35) return "Name cannot exceed 35 characters."; 
        
        // 1. Basic Character Check
        if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) return "Name can only contain letters, spaces, hyphens, and apostrophes.";
        
        // 2. Anti-Spam: No 3 identical letters in a row (catches "aaa", "bbb")
        if (/(.)\1{2,}/i.test(trimmed)) return "Name contains too many repeating characters.";
        
        // 3. Anti-Mash: No 5 consonants in a row (catches "sdfgh")
        if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(trimmed)) return "Please enter a valid real name.";
        
        // 4. Anti-Mash: No 5 vowels in a row (catches "aeiou")
        if (/[aeiouy]{5,}/i.test(trimmed)) return "Please enter a valid real name.";

        // 5. Word-by-Word Analysis
        const words = trimmed.split(' ');
        if (words.length > 4) return "Name contains too many words."; // Usually First, Middle, Last, Suffix
        
        for (let word of words) {
            if (word.length > 15) return "A single word in the name cannot exceed 15 characters.";
            if (!/[aeiouy]/i.test(word)) return "Every part of your name must contain a vowel.";
        }

        return null;
    };

    const validateEmail = (email) => {
        const trimmed = email.trim();
        if (!trimmed) return "Email cannot be empty.";
        if (trimmed.length > 80) return "Email is too long.";
        
        // This regex ensures the domain part (after the @) is between 2 and 63 characters 
        // and the extension (like .com) is between 2 and 6 characters.
        const strictEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]{2,63}\.[a-zA-Z]{2,6}$/;
        
        if (!strictEmailRegex.test(trimmed)) return "Please enter a valid email address.";
        return null;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrors({ general: "Please select a valid image file." });
            return;
        }

        setUploading(true);
        setStatusMessage({ type: "", text: "Uploading image..." });
        
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axios.post("https://metatix-backend-production.up.railway.app/users/me/profile-pic", formData, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });

            setProfile(prev => ({ ...prev, profile_pic_url: response.data.profile_pic_url }));
            setStatusMessage({ type: "success", text: "Profile picture updated!" });
            setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
        } catch (error) {
            console.error("🚨 Upload failed:", error);
            setErrors({ general: "Failed to upload profile picture." });
            setStatusMessage({ type: "", text: "" });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (field) => {
        if (field === "name") {
            const nameError = validateName(editName);
            if (nameError) {
                setErrors({ ...errors, name: nameError });
                return;
            }
        }

        if (field === "email") {
            const emailError = validateEmail(editEmail);
            if (emailError) {
                setErrors({ ...errors, email: emailError });
                return;
            }
        }

        setErrors({ ...errors, [field]: null, general: null });
        setStatusMessage({ type: "", text: "" });

        try {
            const payload = {};
            if (field === "name") payload.name = editName.trim().replace(/\s+/g, ' '); 
            if (field === "email") payload.email = editEmail.trim().toLowerCase();

            const response = await axios.patch("https://metatix-backend-production.up.railway.app/users/update_me", payload, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            setProfile(response.data);
            if (field === "name") setIsEditingName(false);
            if (field === "email") setIsEditingEmail(false);
            if (field === "name") localStorage.setItem("user_name", response.data.name);

            setStatusMessage({ type: "success", text: "Profile updated successfully!" });
            setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000); 

        } catch (error) {
            console.error("🚨 Failed to update profile:", error);
            if (error.response && error.response.data && error.response.data.detail) {
                setErrors({ ...errors, [field]: error.response.data.detail });
            } else {
                setErrors({ ...errors, general: "Could not update profile. Please try again." });
            }
        }
    };

    const handleOrganizerRequest = async () => {
        setStatusMessage({ type: "", text: "" });
        try {
            await axios.post("https://metatix-backend-production.up.railway.app/users/request_organizer", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile((prev) => ({ ...prev, is_organizer_pending: true }));
            setStatusMessage({ type: "success", text: "🎉 Request sent! An admin will review your account shortly." });
        } catch (error) {
            console.error("🚨 Failed to request organizer status:", error);
            setStatusMessage({ type: "error", text: "Failed to send request. You might have already sent one!" });
        }
    };

    const cancelEdit = (field) => {
        if (field === "name") {
            setIsEditingName(false);
            setEditName(profile.name); 
            setErrors({ ...errors, name: null });
        } else {
            setIsEditingEmail(false);
            setEditEmail(profile.email); 
            setErrors({ ...errors, email: null });
        }
    };

    return (
        <div className="bg-[#F4F5F9] min-h-screen flex flex-row">
            <Sidebar />

            <div className="w-full flex-1 p-4 pt-24 md:p-10 lg:p-16 overflow-y-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-200 text-[#6E39CB]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.99l1.004.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </div>
                    <h1 className="font-bold text-4xl text-[#2D2D2D] tracking-wide translate-y-0.5">
                        Account Settings
                    </h1>
                </div>

                {loading ? (
                    <LoadingSpinner message="Loading your details..." size="small" />
                ) : (
                    <div className="max-w-3xl bg-white rounded-3xl shadow-sm border border-gray-200 p-5 md:p-8 flex flex-col gap-8 relative">
                        
                        {/* General Error / Success Banner */}
                        {(errors.general || statusMessage.text) && (
                            <div className={`w-full p-3 rounded-xl text-sm font-bold border ${errors.general || statusMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                {errors.general || statusMessage.text}
                            </div>
                        )}

                        {/* --- AVATAR HEADER WITH UPLOAD --- */}
                        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                            <div className="relative group shrink-0">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-50 shadow-sm bg-purple-50 flex items-center justify-center">
                                    {profile.profile_pic_url ? (
                                        <img 
                                            src={profile.profile_pic_url} 
                                            alt="Profile" 
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-black text-[#6E39CB] uppercase">
                                            {profile.name ? profile.name.charAt(0) : "?"}
                                        </span>
                                    )}
                                    
                                    {/* Upload Spinner Overlay */}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>

                                {/* Camera Icon / Hidden Input */}
                                <label title="Update Profile Picture" className="absolute bottom-0 right-0 bg-[#6E39CB] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#5a2ca0] transition-all shadow-md border-2 border-white group-hover:scale-110">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                    </svg>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>

                            <div>
                                <h2 className="text-2xl font-black text-gray-900">{profile.name}</h2>
                                <p className="text-gray-500 font-medium">{profile.email}</p>
                                
                                {profile.auth_provider === "google" && (
                                    <div className="inline-flex items-center gap-1.5 mt-2 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
                                        <svg viewBox="0 0 24 24" width="12" height="12" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Google Account</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 1. NAME AND EDIT */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-purple-50 p-1.5 rounded-lg text-[#6E39CB]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Full Name</p>
                                </div>
                                
                                {isEditingName ? (
                                    <div className="relative w-full sm:max-w-xs">
                                        <input 
                                            type="text" 
                                            value={editName} 
                                            onChange={(e) => {
                                                setEditName(e.target.value);
                                                if(errors.name) setErrors({...errors, name: null});
                                            }}
                                            className={`w-full p-3 bg-gray-50 border rounded-xl focus:outline-none transition-all font-medium text-gray-900 ${
                                                errors.name ? 'border-red-500 focus:ring-red-200' : 'border-[#6E39CB] focus:ring-purple-200 focus:ring-2'
                                            }`}
                                        />
                                        {errors.name && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.name}</p>}
                                    </div>
                                ) : (
                                    <p className="text-xl text-gray-900 font-medium pl-1">{profile.name}</p>
                                )}
                            </div>
                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                {isEditingName ? (
                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                        <button onClick={() => cancelEdit("name")} className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-colors">Cancel</button>
                                        <button onClick={() => handleUpdate("name")} className="flex-1 sm:flex-none px-5 py-2.5 bg-[#6E39CB] text-white rounded-xl hover:bg-[#5a2ca0] font-bold shadow-md transition-colors">Save</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setIsEditingName(true)} className="w-full sm:w-auto text-[#6E39CB] bg-purple-50 hover:bg-purple-100 px-5 py-2.5 rounded-xl font-bold transition-colors">Edit Name</button>
                                )}
                            </div>
                        </div>

                        {/* 2. EMAIL AND EDIT */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-100 gap-4">
                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-purple-50 p-1.5 rounded-lg text-[#6E39CB]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Email Address</p>
                                </div>

                                {isEditingEmail ? (
                                    <div className="relative w-full sm:max-w-xs">
                                        <input 
                                            type="email" 
                                            value={editEmail} 
                                            onChange={(e) => {
                                                setEditEmail(e.target.value);
                                                if(errors.email) setErrors({...errors, email: null});
                                            }}
                                            className={`w-full p-3 bg-gray-50 border border-[#6E39CB] rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all font-medium text-gray-900 ${
                                                errors.email ? 'border-red-500 focus:ring-red-200' : 'border-[#6E39CB] focus:ring-purple-200 focus:ring-2'
                                            }`}
                                            disabled={profile.auth_provider === "google"}
                                        />
                                        {errors.email && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.email}</p>}
                                    </div>
                                ) : (
                                    <p className="text-xl text-gray-900 font-medium pl-1">{profile.email}</p>
                                )}
                            </div>
                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                {isEditingEmail ? (
                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                        <button onClick={() => cancelEdit("email")} className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-colors">Cancel</button>
                                        <button onClick={() => handleUpdate("email")} className="flex-1 sm:flex-none px-5 py-2.5 bg-[#6E39CB] text-white rounded-xl hover:bg-[#5a2ca0] font-bold shadow-md transition-colors" disabled={profile.auth_provider === "google"}>Save</button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsEditingEmail(true)} 
                                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold transition-colors ${profile.auth_provider === "google" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "text-[#6E39CB] bg-purple-50 hover:bg-purple-100"}`}
                                        disabled={profile.auth_provider === "google"}
                                        title={profile.auth_provider === "google" ? "Managed by Google" : ""}
                                    >
                                        Edit Email
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 3. ROLE */}
                        <div className="pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="bg-purple-50 p-1.5 rounded-lg text-[#6E39CB]">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Current Role</p>
                            </div>
                            <span className="inline-block bg-[#e0d4f7] text-[#6E39CB] font-bold px-5 py-2 rounded-xl text-sm shadow-sm ml-1">
                                {profile.role}
                            </span>
                        </div>

                        {/* 4. ORGANIZER PRIVILEGES */}
                        <div className="pt-2">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="text-yellow-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-xl text-gray-900">Want to host your own events?</h3>
                            </div>
                            
                            {profile.role === "Organizer" || profile.role === "Admin" ? (
                                <div className="text-green-700 font-bold bg-green-50 p-5 rounded-2xl border border-green-200 flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    You already have Organizer privileges!
                                </div>
                            ) : profile.is_organizer_pending ? (
                                <div className="text-orange-700 font-bold bg-orange-50 p-5 rounded-2xl border border-orange-200 flex items-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-spin shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    <span>Your request to become an Organizer is currently pending Admin approval.</span>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-5 md:p-6 rounded-2xl border border-gray-100">
                                    <p className="text-gray-600 mb-5 leading-relaxed">
                                        Apply for an Organizer account to create, manage, and sell tickets to your own events directly on our platform.
                                    </p>
                                    <button 
                                        onClick={handleOrganizerRequest}
                                        className="w-full sm:w-auto bg-[#2D2D2D] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-black transition-colors shadow-md flex items-center justify-center gap-2"
                                    >
                                        Request Organizer Privileges
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" /></svg>
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;
