import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Signup() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const handleGoogleSignup = () => {
        window.location.href = `${API_BASE_URL}/auth/google/login`;
    }

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const newErrors = {};
        if (!username.trim()) newErrors.username = "Username is required";
        if (!email.trim()) newErrors.email = "Email is required";
        if (!phone.trim()) newErrors.phone = "Phone number is required";
        if (!password) newErrors.password = "Password is required";
        if (!agreeTerms) newErrors.terms = "You must agree to the Terms of Service to continue";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        try {
            const payload = { 
                name: username, 
                email: email, 
                password: password,
                phone_number: phone 
            };
            
            await axios.post(`${API_BASE_URL}/auth/registeration`, payload);
            navigate("/login");
        } catch (error) {
            if (error.response) {
                const detail = error.response.data.detail;
                setErrors({ general: typeof detail === "string" ? detail : "Registration failed." });
            } else {
                setErrors({ general: "Cannot connect to server. Is it running?" });
            }
        }
    };

    return (
        <div className="flex flex-col lg:flex-row items-center justify-center w-full min-h-screen bg-[#F9FAFB] font-['Lato'] overflow-x-hidden">
            
            {/* Left side: Form container */}
            <div className="w-full lg:w-1/2 h-auto px-6 py-12 sm:px-12 lg:px-24 xl:px-32 flex flex-col justify-center items-center">
                <div className="w-full max-w-sm flex flex-col gap-6">
                    <div className="text-center lg:text-left">
                        <h1 className="text-4xl font-bold text-gray-900 leading-tight">Create Account</h1>
                        <p className="mt-2 text-lg text-gray-600">Get started with Metatix in minutes.</p>
                    </div>
                    
                    {errors.general && (
                        <div className="w-full p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium shadow-sm">
                            {errors.general}
                        </div>
                    )}

                    <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
                        
                        {/* Username Field */}
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Username" 
                                value={username} 
                                onChange={(e) => {
                                    setUsername(e.target.value);
                                    if(errors.username) setErrors({...errors, username: null});
                                }} 
                                className={`w-full h-12 rounded-xl p-3 bg-white border focus:outline-none focus:ring-2 transition ${
                                    errors.username ? "border-red-500" : "border-gray-200 focus:border-[#6E39CB] focus:ring-[#6E39CB]/20"
                                }`}
                            />
                            {errors.username && <p className="text-red-500 text-xs absolute -bottom-4.5 left-1">{errors.username}</p>}
                        </div>

                        {/* Email Field */}
                        <div className="relative">
                            <input 
                                type="email" 
                                placeholder="Email Address" 
                                value={email} 
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if(errors.email) setErrors({...errors, email: null});
                                }} 
                                className={`w-full h-12 rounded-xl p-3 bg-white border focus:outline-none focus:ring-2 transition ${
                                    errors.email ? "border-red-500" : "border-gray-200 focus:border-[#6E39CB] focus:ring-[#6E39CB]/20"
                                }`}
                            />
                            {errors.email && <p className="text-red-500 text-xs absolute -bottom-4.5 left-1">{errors.email}</p>}
                        </div>

                        {/* Phone Number Field */}
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Phone (e.g. +923284660660)" 
                                value={phone} 
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    if(errors.phone) setErrors({...errors, phone: null});
                                }} 
                                className={`w-full h-12 rounded-xl p-3 bg-white border focus:outline-none focus:ring-2 transition ${
                                    errors.phone ? "border-red-500" : "border-gray-200 focus:border-[#6E39CB] focus:ring-[#6E39CB]/20"
                                }`}
                            />
                            {errors.phone && <p className="text-red-500 text-xs absolute -bottom-4.5 left-1">{errors.phone}</p>}
                        </div>
                        
                        {/* Password Field */}
                        <div className="relative w-full">
                            <input 
                                type={passwordVisible ? "text" : "password"} 
                                placeholder="Password" 
                                value={password} 
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if(errors.password) setErrors({...errors, password: null});
                                }} 
                                className={`w-full h-12 rounded-xl p-3 bg-white border focus:outline-none focus:ring-2 transition ${
                                    errors.password ? "border-red-500" : "border-gray-200 focus:border-[#6E39CB] focus:ring-[#6E39CB]/20"
                                }`}
                            />
                            <button 
                                type="button" 
                                onClick={togglePasswordVisibility} 
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                            >
                                {passwordVisible ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5.5 h-5.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5.5 h-5.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                            {errors.password && <p className="text-red-500 text-xs absolute -bottom-4.5 left-1">{errors.password}</p>}
                        </div>
                        
                        {/* Terms Checkbox */}
                        <div className="relative w-full mt-1.5">
                            <label className="flex items-start gap-2.5 font-normal text-sm cursor-pointer text-gray-700">
                                <input 
                                    type="checkbox" 
                                    className="mt-0.5 w-4.5 h-4.5 cursor-pointer accent-[#6E39CB]" 
                                    onChange={(e) => {
                                        setAgreeTerms(e.target.checked);
                                        if(errors.terms) setErrors({...errors, terms: null});
                                    }} 
                                />
                                <span>I agree to the <span className="text-[#6E39CB] hover:underline">Terms of Services</span> and <span className="text-[#6E39CB] hover:underline">Privacy Policy</span>.</span>
                            </label>
                            {errors.terms && <p className="text-red-500 text-xs absolute -bottom-4.5 left-1">{errors.terms}</p>}
                        </div>
                        
                        <button type="submit" className="w-full h-12 mt-3 rounded-xl bg-[#6E39CB] font-bold text-lg text-white hover:bg-[#5A2FB4] transition shadow-md focus:ring-2 focus:ring-[#6E39CB]/30 cursor-pointer">
                            Sign Up
                        </button>
                    </form>

                    <div className="flex items-center w-full my-1">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="px-4 text-xs text-gray-400 font-bold tracking-widest uppercase">Or</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    <button 
                        onClick={handleGoogleSignup}
                        type="button" 
                        className="w-full h-12 flex items-center justify-center gap-3.5 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold hover:bg-gray-50 transition shadow-sm cursor-pointer"
                    >
                        {/* Google Icon SVG */}
                        <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                        Sign up with Google
                    </button>
                    
                    <div className="flex flex-row gap-2.5 items-center justify-center mt-3 text-sm">
                        <span className="font-normal text-gray-700">Already have an account?</span>
                        <button className="text-[#6E39CB] font-semibold cursor-pointer hover:underline" onClick={() => navigate('/login')}>
                            Login
                        </button>
                    </div>
                </div>
            </div>

            {/* Right side: Modern Illustration */}
            <div className="hidden lg:flex items-center justify-center lg:w-1/2 min-h-screen p-16">
                <div className="w-full max-w-xl flex flex-col items-center gap-12 text-center">
                    
                    <svg 
                        viewBox="0 0 500 500" 
                        className="w-full h-auto drop-shadow-2xl transition-transform duration-700 hover:scale-105" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Abstract Background Blobs */}
                        <path d="M400 250C400 332.843 332.843 400 250 400C167.157 400 100 332.843 100 250C100 167.157 167.157 100 250 100C332.843 100 400 167.157 400 250Z" fill="#6E39CB" fillOpacity="0.04"/>
                        <path d="M450 150C450 205.228 405.228 250 350 250C294.772 250 250 205.228 250 150C250 94.7715 294.772 50 350 50C405.228 50 450 94.7715 450 150Z" fill="#6E39CB" fillOpacity="0.08"/>

                        {/* Front Floating Ticket (White) */}
                        <g transform="translate(130, 140) rotate(-12)">
                            <rect x="8" y="8" width="240" height="130" rx="16" fill="#000000" fillOpacity="0.08"/>
                            <rect width="240" height="130" rx="16" fill="white" stroke="#6E39CB" strokeWidth="4"/>
                            
                            {/* Ticket Cutouts */}
                            <circle cx="0" cy="65" r="16" fill="#F9FAFB" stroke="#6E39CB" strokeWidth="4"/>
                            <circle cx="240" cy="65" r="16" fill="#F9FAFB" stroke="#6E39CB" strokeWidth="4"/>
                            
                            {/* Perforation Line */}
                            <line x1="175" y1="12" x2="175" y2="118" stroke="#6E39CB" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round"/>
                            
                            {/* Abstract Event Details */}
                            <rect x="35" y="35" width="110" height="16" rx="8" fill="#6E39CB" fillOpacity="0.2"/>
                            <rect x="35" y="65" width="70" height="12" rx="6" fill="#6E39CB" fillOpacity="0.7"/>
                            <rect x="35" y="90" width="90" height="8" rx="4" fill="#6E39CB" fillOpacity="0.4"/>
                            
                            {/* Stub QR/Icon */}
                            <rect x="190" y="48" width="34" height="34" rx="6" fill="#6E39CB"/>
                        </g>

                        {/* Back Floating Ticket (Solid Purple) */}
                        <g transform="translate(180, 240) rotate(18)">
                            <rect width="210" height="110" rx="16" fill="#6E39CB" fillOpacity="0.95"/>
                            
                            {/* Back Ticket Cutouts */}
                            <circle cx="0" cy="55" r="14" fill="#F9FAFB"/>
                            <circle cx="210" cy="55" r="14" fill="#F9FAFB"/>
                            
                            <line x1="150" y1="10" x2="150" y2="100" stroke="white" strokeWidth="3" strokeDasharray="5 5" strokeOpacity="0.4"/>
                            <rect x="35" y="35" width="80" height="12" rx="6" fill="white" fillOpacity="0.9"/>
                            <rect x="35" y="65" width="50" height="8" rx="4" fill="white" fillOpacity="0.6"/>
                        </g>

                        {/* Floating Elements / Confetti */}
                        <path d="M90 110L102 138L130 145L102 152L90 180L78 152L50 145L78 138L90 110Z" fill="#6E39CB" fillOpacity="0.3"/>
                        <circle cx="390" cy="370" r="10" fill="#6E39CB" fillOpacity="0.5"/>
                        <circle cx="110" cy="390" r="14" fill="#6E39CB" fillOpacity="0.2"/>
                        <circle cx="430" cy="180" r="6" fill="#6E39CB" fillOpacity="0.7"/>
                        
                        {/* Abstract Connecting Line */}
                        <path d="M60 290C80 370 160 440 270 460" stroke="#6E39CB" strokeWidth="4" strokeLinecap="round" strokeDasharray="8 16" strokeOpacity="0.4"/>
                    </svg>

                    <div>
                        <h2 className="text-4xl font-extrabold text-gray-950 leading-tight">Your gateway to the ultimate event experience</h2>
                        <p className="mt-5 text-xl text-gray-700 max-w-lg mx-auto">Discover, connect, and celebrate unforgettable moments with Metatix.</p>
                    </div>
                </div>
            </div>
            
        </div>
    );
}

export default Signup;