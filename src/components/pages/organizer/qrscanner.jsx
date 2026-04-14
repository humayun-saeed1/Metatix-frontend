import { useState, useRef } from "react";
import axios from "axios";
import { Scanner } from '@yudiel/react-qr-scanner';
import jsQR from "jsqr";

import * as pdfjsLib from "pdfjs-dist";

import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url"; 
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

import Sidebar from "../../sidenav"; 

function ScanTickets() {
    const [ticketHash, setTicketHash] = useState("");
    const [scanStatus, setScanStatus] = useState("idle"); 
    const [ticketData, setTicketData] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isCameraActive, setIsCameraActive] = useState(false);
    
    const fileInputRef = useRef(null);
    const token = localStorage.getItem("access_token");

    // --- 1. LIVE CAMERA SCANNER ---
    const handleCameraScan = (text) => {
        setIsCameraActive(false); 
        processTicket(text);
    };

    // --- 2. THE NEW HYBRID UPLOADER ---
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setScanStatus("loading");

        if (file.type === "application/pdf") {
            await processPDF(file);
        } else if (file.type.startsWith("image/")) {
            processImage(file);
        } else {
            setScanStatus("error");
            setErrorMessage("Unsupported file type. Please upload an image or PDF.");
        }
        
        e.target.value = ""; 
    };

    // --- 3. 🚨 UPGRADED PDF PROCESSING ENGINE 🚨 ---
    const processPDF = async (file) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Assume the ticket QR code is on the first page
            const page = await pdf.getPage(1); 
            
            // Use a safer scale (1.5 instead of 2.0) to prevent memory crashes on giant images
            const viewport = page.getViewport({ scale: 1.5 }); 
            
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true }); // Optimization for extracting pixels
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            // 🚨 THE FIX: Fill the canvas with solid white first! 
            // If the PDF has a transparent background, jsQR will fail to read it.
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Render the PDF page onto our canvas
            await page.render({ canvasContext: ctx, viewport }).promise;

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code) {
                processTicket(code.data);
            } else {
                setScanStatus("error");
                setErrorMessage("No QR code found on the first page. Ensure the ticket is clearly visible.");
            }
        } catch (err) {
            // Log the exact error to the console so we can see what went wrong!
            console.error("🚨 PDF Processing Error:", err);
            setScanStatus("error");
            setErrorMessage("Failed to read the PDF. Check the browser console (F12) for exact details.");
        }
    };

    // --- 4. IMAGE PROCESSING ENGINE ---
    const processImage = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d", { willReadFrequently: true });
                
                // 🚨 Also fill images with white just in case they upload a transparent PNG
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    processTicket(code.data);
                } else {
                    setScanStatus("error");
                    setErrorMessage("No QR code found in that image. Try a clearer screenshot.");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    // --- 5. MANUAL ENTRY ---
    const handleManualScan = async (e) => {
        e.preventDefault();
        if (!ticketHash.trim()) return;
        setIsCameraActive(false);
        processTicket(ticketHash);
    };

    // --- CORE PROCESSOR ---
    const processTicket = async (hash) => {
        console.log("🔍 THE SCANNER FOUND THIS TEXT:", hash);
        if (scanStatus === "loading") return;

        setScanStatus("loading");
        setErrorMessage("");
        setTicketData(null);

        try {
            const headers = { Authorization: `Bearer ${token}` };
            const res = await axios.post(`https://metatix-backend-production.up.railway.app/organizer/scan/${hash}`, {}, { headers });
            
            setTicketData(res.data);
            setScanStatus("success");
            setTicketHash(""); 
            
        } catch (error) {
            setScanStatus("error");
            setErrorMessage(error.response?.data?.detail || "Invalid or unrecognized ticket.");
            setTicketHash(""); 
        }
    };

    const resetScanner = () => {
        setScanStatus("idle");
        setTicketData(null);
        setErrorMessage("");
    };

    return (
        
        <div className="bg-[#F4F5F9] min-h-screen flex flex-col lg:flex-row font-['Lato'] relative w-full">
            
            {/* Sticky Sidebar */}
            <div className="lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
                <Sidebar />
            </div>

            {/* pt-16 for mobile hamburger menu clearance */}
            <div className="flex-1 p-4 pt-16 md:p-8 lg:p-10 w-full max-w-full flex flex-col items-center">
                
                {/* Header */}
                <div className="w-full max-w-2xl mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-2">
                        {/* QR Code / Scanner SVG Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#6E39CB] shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
                        </svg>
                        <h1 className="font-['bebas-neue'] font-bold text-3xl md:text-4xl text-[#2D2D2D] tracking-wide uppercase leading-none text-center">Access Control</h1>
                    </div>
                    <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest text-center">Verify tickets at the door</p>
                </div>

                <div className="w-full max-w-2xl bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative min-h-100 md:min-h-125 flex flex-col">
                    
                    {/* --- IDLE STATE --- */}
                    {scanStatus === "idle" && (
                        <div className="flex-1 flex flex-col">
                            <div className={`flex-1 flex flex-col items-center justify-center transition-all min-h-125 ${isCameraActive ? 'bg-black' : 'bg-[#fcfbfe] border-b border-gray-100'}`}>
                                {isCameraActive ? (
                                    <div className="w-full h-full relative">
                                        <Scanner 
                                            onResult={handleCameraScan} 
                                            onError={(error) => console.log(error?.message)}
                                            options={{ delayBetweenScanAttempts: 1000 }}
                                        />
                                        <button 
                                            onClick={() => setIsCameraActive(false)}
                                            className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center p-6 md:p-8 w-full">
                                        <div className="w-20 h-20 md:w-24 md:h-24 bg-purple-50 text-[#6E39CB] rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-inner">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 md:w-12 md:h-12"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" /></svg>
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-lg md:text-xl mb-2">Ready to Scan</h3>
                                        <p className="text-gray-500 text-xs md:text-sm mb-6 max-w-xs mx-auto">Open the live camera or upload a ticket (PDF/Image) to verify.</p>
                                        
                                        <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 w-full max-w-sm mx-auto">
                                            <button 
                                                onClick={() => setIsCameraActive(true)}
                                                className="bg-[#6E39CB] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-[#5a2ca0] transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                                            >
                                                Open Camera
                                            </button>
                                            
                                            <input 
                                                type="file" 
                                                accept="image/*,application/pdf" 
                                                className="hidden" 
                                                ref={fileInputRef} 
                                                onChange={handleFileUpload} 
                                            />
                                            <button 
                                                onClick={() => fileInputRef.current.click()}
                                                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 border border-gray-200 w-full sm:w-auto"
                                            >
                                                Upload File
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 md:p-6 bg-white w-full">
                                <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Or verify manually</p>
                                <form onSubmit={handleManualScan} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Ticket Hash..." 
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#6E39CB] outline-none font-mono text-center sm:text-left w-full"
                                        value={ticketHash}
                                        onChange={(e) => setTicketHash(e.target.value)}
                                    />
                                    <button type="submit" className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-black transition-colors w-full sm:w-auto">
                                        Verify
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* --- LOADING STATE --- */}
                    {scanStatus === "loading" && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white min-h-100">
                            <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-purple-100 border-t-[#6E39CB] rounded-full animate-spin mb-4 md:mb-6"></div>
                            <h3 className="font-['bebas-neue'] text-2xl md:text-3xl text-gray-800 tracking-wide mb-2">Verifying Ticket...</h3>
                            <p className="text-gray-500 text-xs md:text-sm">Extracting and checking validity.</p>
                        </div>
                    )}

                    {/* --- SUCCESS STATE --- */}
                    {scanStatus === "success" && ticketData && (
                        <div className="flex-1 flex flex-col bg-green-500 p-6 md:p-8 text-white relative overflow-hidden min-h-100">
                            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-white opacity-10 rounded-bl-full pointer-events-none"></div>
                            
                            <div className="flex flex-col items-center text-center mt-2 md:mt-4 mb-6 md:mb-8 relative z-10">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-green-500 shadow-xl mb-3 md:mb-4 transform animate-[bounceIn_0.5s_ease-out]">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                </div>
                                <h2 className="font-['bebas-neue'] text-4xl md:text-6xl tracking-wide leading-none">VALID TICKET</h2>
                                <p className="text-green-100 font-bold uppercase tracking-widest text-[10px] md:text-sm mt-2 bg-green-600 px-3 py-1 md:px-4 md:py-1 rounded-full">Access Granted</p>
                            </div>

                            <div className="bg-green-600/50 rounded-2xl p-4 md:p-6 backdrop-blur-sm border border-green-400/50 relative z-10 mb-6 md:mb-8 max-w-sm mx-auto w-full">
                                <div className="flex flex-col gap-3 md:gap-4 text-center">
                                    <div>
                                        <p className="text-green-200 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1">Event</p>
                                        <p className="font-bold text-lg md:text-xl leading-tight truncate px-2">{ticketData.event_title}</p>
                                    </div>
                                    <div className="h-px bg-green-400/30 w-full"></div>
                                    <div>
                                        <p className="text-green-200 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1">Tier / Section</p>
                                        <p className="font-black text-xl md:text-2xl text-white leading-tight truncate px-2">{ticketData.tier_name}</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={resetScanner} className="mt-auto w-full max-w-sm mx-auto bg-white text-green-600 px-4 py-3 md:px-6 md:py-4 rounded-xl font-black text-base md:text-lg shadow-xl hover:bg-green-50 transition-transform active:scale-95 uppercase tracking-widest relative z-10">
                                Scan Next
                            </button>
                        </div>
                    )}

                    {/* --- ERROR STATE --- */}
                    {scanStatus === "error" && (
                        <div className="flex-1 flex flex-col bg-red-500 p-6 md:p-8 text-white relative overflow-hidden min-h-100">
                            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-black opacity-10 rounded-bl-full pointer-events-none"></div>
                            
                            <div className="flex flex-col items-center text-center mt-2 md:mt-4 mb-6 md:mb-8 relative z-10 transform animate-[shake_0.4s_ease-in-out]">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full flex items-center justify-center text-red-500 shadow-xl mb-3 md:mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                </div>
                                <h2 className="font-['bebas-neue'] text-4xl md:text-6xl tracking-wide leading-none">REJECTED</h2>
                                <p className="text-red-100 font-bold uppercase tracking-widest text-[10px] md:text-sm mt-2 bg-red-600 px-3 py-1 md:px-4 md:py-1 rounded-full">Access Denied</p>
                            </div>

                            <div className="bg-red-600/50 rounded-2xl p-5 md:p-8 backdrop-blur-sm border border-red-400/50 relative z-10 mb-6 md:mb-8 max-w-sm mx-auto w-full flex flex-col items-center justify-center text-center">
                                <p className="text-red-200 text-[9px] md:text-xs font-bold uppercase tracking-widest mb-2 md:mb-3">System Reason</p>
                                <p className="font-bold text-lg md:text-2xl leading-tight px-2 wrap-break-words">{errorMessage}</p>
                            </div>

                            <button onClick={resetScanner} className="mt-auto w-full max-w-sm mx-auto bg-white text-red-600 px-4 py-3 md:px-6 md:py-4 rounded-xl font-black text-base md:text-lg shadow-xl hover:bg-red-50 transition-transform active:scale-95 uppercase tracking-widest relative z-10">
                                Try Another
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <style jsx>{`
                @keyframes bounceIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    50% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    50% { transform: translateX(5px); }
                    75% { transform: translateX(-5px); }
                }
            `}</style>
        </div>
    );
}

export default ScanTickets;
