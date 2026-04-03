import { useState } from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Login() {
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const navigate = useNavigate();
    const location = useLocation();
    
    // State for the Forgot Password modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [resetEmail, setResetEmail] = useState("")

    // Error states
    const [errors, setErrors] = useState({})
    const [modalMessage, setModalMessage] = useState({ type: "", text: "" }) // Handles both error and success in modal

    const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Local Validation
        const newErrors = {};
        if (!email.trim()) newErrors.email = "Email is required";
        if (!password) newErrors.password = "Password is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});

        try {
            const params = new URLSearchParams();
            params.append("username", email); 
            params.append("password", password);

            const response = await axios.post(`${API_BASE_URL}/auth/login`, params, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
            const token = response.data.access_token;
            localStorage.setItem("access_token", token);
            
            const profileResponse = await axios.get(`${API_BASE_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const role = profileResponse.data.role;
            localStorage.setItem("user_role", role);
            localStorage.setItem("user_name", profileResponse.data.name);

            if (role === "Admin") navigate("/admin-dashboard");
            else if (role === "Organizer") navigate("/organizer-dashboard");
            else navigate("/BookingPage");
            
        } catch (error) {
            if (error.response) {
                setErrors({ general: error.response.data.detail });
            } else if (error.request) {
                setErrors({ general: "No response from backend! Is Uvicorn running?" });
            } else {
                setErrors({ general: "React Code Error: " + error.message });
            }
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/google/login`;
    }

    const handleResetPassword = async () => {
        if (!resetEmail) {
            setModalMessage({ type: "error", text: "Please enter your email address." });
            return;
        }

        setModalMessage({ type: "", text: "" });

        try {
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
                email: resetEmail
            });
            
            setModalMessage({ type: "success", text: "If that email exists, a reset link has been sent!" });
            setResetEmail("");
        } catch (error) {
            if (error.response) {
                setModalMessage({ type: "error", text: error.response.data.detail });
            } else {
                setModalMessage({ type: "error", text: "Network error. Is the backend running?" });
            }
        }
    }

    // Clear modal messages when closing it
    const closeModal = () => {
        setIsModalOpen(false);
        setModalMessage({ type: "", text: "" });
        setResetEmail("");
    }

  return (
    <div className="flex flex-col lg:flex-row justify-center lg:justify-between items-center w-full min-h-screen relative font-['Lato']">
        {/* Left side banner */}
        <div className="hidden lg:block w-154.75 h-140 my-5 ml-5 rounded-[15px] rotate-0 opacity-100 bg-[#6E39CB]">
            <div className="w-93.5 h-36 top-31 left-15 ml-15 mt-31 rotate-0 opacity-100">
                <h1 className="font-['Lato'] font-bold text-[40px] leading-[100%] tracking-[0%] text-[#FFFFFF]">Secure access to your tickets and events. Log in to Metatix.</h1>
            </div>
          <img src="signup/woman.png" alt="Welcome"  className="relative -top-30 left-35 rotate-0 opacity-100"/>
        </div>
        
        {/* Right side form */}
        <div className="w-full lg:w-auto h-auto lg:h-140 px-6 py-10 sm:px-12 lg:px-38.75 lg:py-51.25 flex flex-col gap-5 justify-center items-center" >
            <div className="flex flex-col gap-6 w-full max-w-sm lg:max-w-none relative">
                <div className="text-center lg:text-left">
                    <h1 className="text-3xl lg:text-4xl font-bold">Login</h1>
                    <p className="mt-2 text-gray-600">Welcome back! Please enter your details</p>
                </div>

                {/* General Backend Error Banner */}
                {errors.general && (
                    <div className="absolute -top-12 left-0 w-full lg:w-82.5 p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-bold shadow-sm z-10">
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
                    
                    {/* Email Field */}
                    <div className="relative w-full lg:w-82.5">
                        <input 
                            type="email" 
                            placeholder="Email" 
                            className={`w-full h-11.5 rounded-lg p-3 bg-[#F4F5F9] border focus:outline-none transition-colors ${
                                errors.email ? "border-red-500 focus:border-red-500" : "border-[#DBDCDE] focus:border-[#6E39CB]"
                            }`}
                            value={email} 
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if(errors.email) setErrors({...errors, email: null});
                            }}
                        />
                        {errors.email && <p className="text-red-500 text-[11px] absolute -bottom-4 left-1">{errors.email}</p>}
                    </div>
                    
                    {/* Password Field */}
                    <div className="relative w-full lg:w-82.5">
                        <input 
                            type={passwordVisible ? "text" : "password"} 
                            placeholder="Password" 
                            className={`w-full h-11.5 rounded-lg p-3 bg-[#F4F5F9] border focus:outline-none transition-colors ${
                                errors.password ? "border-red-500 focus:border-red-500" : "border-[#DBDCDE] focus:border-[#6E39CB]"
                            }`} 
                            value={password} 
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if(errors.password) setErrors({...errors, password: null});
                            }}
                        />
                        <button 
                            type="button" 
                            onClick={togglePasswordVisibility} 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                            {passwordVisible ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            )}
                        </button>
                        {errors.password && <p className="text-red-500 text-[11px] absolute -bottom-4 left-1">{errors.password}</p>}
                    </div>

                    <div className="w-full flex justify-end lg:justify-start">
                        <button type="button" onClick={() => setIsModalOpen(true)} className="text-[#6E39CB] font-bold text-sm cursor-pointer hover:underline">
                            Forgot Password?
                        </button>
                    </div>
                    
                    <button type="submit" className="w-full lg:w-82.5 h-11.5 rounded-lg bg-[#6E39CB] font-bold text-[16px] text-[#FFFFFF] hover:bg-opacity-90 transition-all shadow-md">
                        Sign in
                    </button>
                </form>

                <div className="flex items-center w-full lg:w-82.5">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="px-3 text-xs text-gray-400 font-bold tracking-widest uppercase">Or</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <button 
                    onClick={handleGoogleLogin}
                    type="button" 
                    className="w-full lg:w-82.5 h-11.5 flex items-center justify-center gap-3 rounded-lg border border-[#DBDCDE] bg-white text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                    Continue with Google
                </button>
            </div>

            <div className="flex flex-row gap-2 items-center justify-center mt-2">
                <span className="text-sm">Don't have an account?</span>
                <button className="text-[#6E39CB] font-bold text-sm cursor-pointer hover:underline" onClick={() => navigate('/signup')}>
                    Sign Up Now
                </button>
            </div>
        </div>

        {/* Forgot Password Modal Overlay */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white p-6 sm:p-8 rounded-[15px] shadow-xl flex flex-col gap-4 w-[90%] max-w-md relative">
                    <h2 className="text-2xl font-bold font-['bebas-neue'] tracking-wide text-gray-800">Reset Password</h2>
                    <p className="text-sm text-gray-600">Enter your email address and we will send you instructions to reset your password.</p>
                    
                    {/* Modal Error/Success Messages */}
                    {modalMessage.text && (
                        <div className={`w-full p-2 rounded-lg text-xs font-bold border ${modalMessage.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                            {modalMessage.text}
                        </div>
                    )}

                    <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className={`w-full h-11.5 mt-2 rounded-lg p-3 bg-[#F4F5F9] border focus:outline-none transition-colors ${
                            modalMessage.type === 'error' && !resetEmail ? "border-red-500 focus:border-red-500" : "border-[#DBDCDE] focus:border-[#6E39CB]"
                        }`}
                        value={resetEmail} 
                        onChange={(e) => {
                            setResetEmail(e.target.value);
                            if (modalMessage.type === 'error') setModalMessage({ type: "", text: "" });
                        }} 
                        autoFocus
                    />
                    
                    <div className="flex flex-row justify-end gap-3 mt-4">
                        <button 
                            type="button" 
                            onClick={closeModal} 
                            className="px-4 py-2 rounded-lg border border-[#DBDCDE] font-bold text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            onClick={handleResetPassword} 
                            className="px-4 py-2 rounded-lg bg-[#6E39CB] font-bold text-[#FFFFFF] hover:bg-opacity-90 cursor-pointer transition-colors shadow-sm"
                        >
                            Send Link
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default Login;