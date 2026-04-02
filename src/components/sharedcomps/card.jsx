import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Card({ eventId, title, description, venue, city, time, status }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    
    // --- MODAL STATES ---
    const [showTicketModal, setShowTicketModal] = useState(false);
    const [eventDetails, setEventDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Ticket Selection
    const [selectedTier, setSelectedTier] = useState(null);
    const [quantity, setQuantity] = useState(1);
    
    const navigate = useNavigate();

    // Description truncation logic
    const isLongDescription = description?.length > 100;
    const displayDescription = isExpanded ? description : `${description?.substring(0, 100)}...`;

    // 1. OPEN MODAL & FETCH TIERS
    const handleBookNow = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            setShowLoginModal(true);
            return;
        }

        setLoading(true);
        try {
            console.log("🕵️‍♂️ FETCHING EVENT ID:", eventId);
            const response = await axios.get(`${API_BASE_URL}/events/${eventId}`);
            setEventDetails(response.data);
            setShowTicketModal(true);
        } catch (error) {
            console.error("Failed to fetch event details:", error);
            alert("Could not load ticket information.");
        } finally {
            setLoading(false);
        }
    };

    // 2. THE MAGIC "ADD TO CART" FUNCTION
    const handleAddToCart = (goToCheckout) => {
        if (!selectedTier) {
            alert("Please select a ticket tier first!");
            return;
        }

        // Create the cart item
        const newCartItem = {
            cartItemId: Date.now(),
            eventId: eventId,
            eventTitle: title,
            tierId: selectedTier.id || selectedTier.tier_id, 
            tierName: selectedTier.tier_name,
            price: selectedTier.current_price,
            quantity: quantity,
            total: selectedTier.current_price * quantity
        };

        const existingCart = JSON.parse(localStorage.getItem("tix_cart")) || [];
        existingCart.push(newCartItem);
        
        localStorage.setItem("tix_cart", JSON.stringify(existingCart));

        if (goToCheckout) {
            navigate("/checkout");
        } else {
            setShowTicketModal(false);
            setSelectedTier(null);
            setQuantity(1);
            alert("🎟️ Added to cart! Keep browsing.");
        }
    };

    return (
        <div className="relative border border-gray-200 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col gap-4 bg-white hover:shadow-xl transition-all duration-300 group h-full overflow-hidden w-full">
            
            {/* --- EXISTING CARD UI --- */}
            <div className="flex justify-between items-start gap-3 sm:gap-4 w-full">
                <h2 className="font-bold text-2xl sm:text-[28px] leading-tight tracking-wide text-[#2D2D2D] uppercase wrap-break-words flex-1 min-w-0">
                    {title}
                </h2>
                <div className="bg-[#f3effb] p-2.5 sm:p-3 rounded-full text-[#6E39CB] shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><line x1="13" y1="5" x2="13" y2="19" strokeDasharray="4 4"/></svg>
                </div>
            </div>

            {venue && <div className="text-sm font-bold text-[#6E39CB] -mt-2 wrap-break-words w-full">📍 {venue}</div>}
            
            <div className="grow w-full">
                <p className="font-normal text-sm sm:text-[15px] text-gray-600 leading-relaxed inline wrap-break-all">
                    {isLongDescription ? displayDescription : description}
                </p>
                {isLongDescription && (
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[#6E39CB] font-bold text-sm sm:text-[15px] ml-1 hover:underline cursor-pointer focus:outline-none whitespace-nowrap"
                    >
                        {isExpanded ? "Show Less" : "Read More"}
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 mt-2 py-3 border-y border-gray-100 w-full">
                <div className="flex items-center gap-1.5 text-gray-500 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-medium truncate">🏙️ {city}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
                    <span className="text-[11px] sm:text-[12px] font-medium">🕒 {time}</span>
                </div>
            </div>

            <div className="mt-2 w-full">
                <button 
                    onClick={handleBookNow} 
                    disabled={loading}
                    className="w-full bg-[#6E39CB] text-white py-3 rounded-xl hover:bg-[#5a2ca0] transition-colors font-bold shadow-md disabled:opacity-50 cursor-pointer"
                >
                    {loading ? "Loading..." : "Book Now"}
                </button>
            </div>

            {/* --- NEW LOGIN / SIGNUP MODAL --- */}
            {showLoginModal && (
                <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
                        
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-[#2D2D2D] tracking-wide">
                                Login Required
                            </h3>
                            <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-red-500 text-2xl cursor-pointer">&times;</button>
                        </div>
                        
                        <p className="text-gray-600 mb-6 text-sm">
                            You need an account to book tickets for <span className="font-bold">{title}</span>. Please log in or sign up to continue.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={() => navigate("/login")}
                                className="w-full bg-[#6E39CB] text-white py-3 rounded-xl font-bold hover:bg-[#5a2ca0] transition-colors shadow-md cursor-pointer"
                            >
                                Log In
                            </button>
                            <button 
                                onClick={() => navigate("/signup")}
                                className="w-full border-2 border-[#DBDCDE] text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                                Sign Up
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* --- TICKET SELECTION MODAL --- */}
            {showTicketModal && eventDetails && (
                <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-200">
                        
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-3xl font-bold text-[#2D2D2D] tracking-wide">
                                Select Tickets
                            </h3>
                            <button onClick={() => setShowTicketModal(false)} className="text-gray-400 hover:text-red-500 text-2xl cursor-pointer">&times;</button>
                        </div>
                        
                        <p className="text-[#6E39CB] font-bold mb-4">{title}</p>
                        
                        {/* TIER SELECTION */}
                        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto pr-2">
                            {eventDetails.tiers && eventDetails.tiers.length > 0 ? (
                                eventDetails.tiers.map((tier, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedTier(tier)}
                                        className={`w-full text-left p-4 rounded-lg border-2 transition-all cursor-pointer ${
                                            selectedTier === tier ? "border-[#6E39CB] bg-[#f4f0fa]" : "border-gray-200 hover:border-[#6E39CB]"
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-gray-900">{tier.tier_name}</span>
                                            <span className="font-bold text-[#6E39CB]">${tier.current_price}</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <p className="text-red-500">No ticket tiers available yet.</p>
                            )}
                        </div>

                        {/* QUANTITY SELECTION */}
                        <div className="flex items-center justify-between mb-8 bg-gray-50 p-4 rounded-lg">
                            <span className="font-bold text-gray-700">Quantity</span>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center font-bold cursor-pointer">-</button>
                                <span className="font-bold text-lg w-4 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center font-bold cursor-pointer">+</button>
                            </div>
                        </div>

                        {/* TOTAL & BUTTONS */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-600 font-medium">Subtotal</span>
                                <span className="text-3xl font-bold text-[#2D2D2D]">
                                    ${selectedTier ? selectedTier.current_price * quantity : 0}
                                </span>
                            </div>
                            
                            <div className="flex flex-col gap-3">
                                {/* Button 1: Checkout instantly */}
                                <button 
                                    onClick={() => handleAddToCart(true)}
                                    disabled={!selectedTier}
                                    className="w-full bg-[#6E39CB] text-white py-3.5 rounded-xl font-bold text-lg hover:bg-[#5a2ca0] transition-colors disabled:opacity-50 shadow-md cursor-pointer"
                                >
                                    Proceed to Checkout
                                </button>
                                
                                {/* Button 2: Keep Shopping */}
                                <button 
                                    onClick={() => handleAddToCart(false)}
                                    disabled={!selectedTier}
                                    className="w-full border-2 border-[#DBDCDE] text-gray-700 py-3.5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    Add to Cart & Keep Shopping
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}