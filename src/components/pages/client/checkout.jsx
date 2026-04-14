import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../sidenav";
import LoadingSpinner from "../../sharedcomps/LoadingSpinner"; 

function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem("access_token");

    // Load cart from local storage on mount
    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem("tix_cart")) || [];
        setCartItems(savedCart);
    }, []);

    const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);

    const removeItem = (cartItemId) => {
        const updatedCart = cartItems.filter(item => item.cartItemId !== cartItemId);
        setCartItems(updatedCart);
        localStorage.setItem("tix_cart", JSON.stringify(updatedCart));
    };

    /**
     * 🚀 THE STRIPE CHECKOUT FLOW
     * 1. Loops through cart to create "Pending" bookings in your DB.
     * 2. Sends those IDs to your new Stripe controller.
     * 3. Redirects the user to the secure Stripe Checkout page.
     */
    const handleCheckout = async () => {
        if (!token) {
            alert("Please log in to checkout.");
            navigate("/login");
            return;
        }

        setLoading(true);
        try {
            const bookingIds = [];
            
            // Step 1: Create Reservations in your Backend
            for (const item of cartItems) {
                const payload = {
                    event_id: item.eventId,
                    tier_id: item.tierId,
                    quantity: item.quantity,
                    payment_amount: item.total
                };

                const response = await axios.post("https://metatix-backend-production.up.railway.app/booking/reserve", payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                bookingIds.push(response.data.booking_id);
            }

            // Step 2: Get the Stripe Checkout URL from your new payment controller
            const stripeRes = await axios.post("https://metatix-backend-production.up.railway.app/stripe/create-cart-session", {
                booking_ids: bookingIds
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Step 3: Success! Clear local cart and redirect to Stripe
            localStorage.removeItem("tix_cart");
            window.location.href = stripeRes.data.url;

        } catch (error) {
            console.error("🚨 Checkout failed:", error);
            const errorMsg = error.response?.data?.detail || "Failed to initiate checkout. Items may be sold out.";
            alert(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#F4F5F9] min-h-screen flex flex-row font-['Lato'] relative">
            <Sidebar />

            <div className="w-full flex-1 p-4 pt-24 md:p-10 lg:p-16 overflow-y-auto">
                
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-200 text-[#6E39CB]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                    </div>
                    <h1 className="font-['bebas-neue'] font-bold text-3xl md:text-4xl text-[#2D2D2D] tracking-wide translate-y-0.5">
                        Your Cart
                    </h1>
                </div>

                {cartItems.length === 0 ? (
                    <div className="bg-white p-8 md:p-16 rounded-3xl shadow-sm text-center border border-gray-200 flex flex-col items-center">
                        <div className="bg-gray-50 p-6 rounded-full mb-6 text-gray-300 border-2 border-dashed border-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8 text-sm md:text-base max-w-md">Looks like you haven't added any tickets yet.</p>
                        <button onClick={() => navigate("/BookingPage")} className="w-full sm:w-auto bg-[#6E39CB] text-white px-10 py-3.5 rounded-xl font-bold hover:bg-[#5a2ca0] shadow-md transition-colors">
                            Browse Events
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* LEFT SIDE: Items Review */}
                        <div className="flex-1">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                                {cartItems.map((item) => (
                                    <div key={item.cartItemId} className="p-5 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-purple-50 p-3 rounded-xl text-[#6E39CB] shrink-0 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg md:text-xl text-gray-900 mb-1">{item.eventTitle}</h3>
                                                <p className="text-gray-500 text-sm">
                                                    <span className="font-bold text-[#6E39CB] bg-purple-50 px-2 py-0.5 rounded-md">{item.tierName}</span> 
                                                    <span className="mx-2">•</span> 
                                                    {item.quantity} {item.quantity === 1 ? 'ticket' : 'tickets'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-gray-100 pt-4 mt-2 sm:mt-0 sm:border-0 sm:pt-0">
                                            <p className="font-bold text-2xl text-gray-900">${item.total}</p>
                                            <button onClick={() => removeItem(item.cartItemId)} className="text-gray-400 bg-white border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all p-2.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT SIDE: Summary & CTA */}
                        <div className="w-full lg:w-96">
                            <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-200 sticky top-8">
                                <div className="flex items-center gap-3 border-b border-gray-100 pb-5 mb-5">
                                    <div className="bg-purple-50 p-2 rounded-xl text-[#6E39CB]">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-xl text-gray-900">Order Summary</h3>
                                </div>
                                
                                <div className="flex justify-between text-gray-600 mb-3 text-sm md:text-base font-medium">
                                    <span>Subtotal</span>
                                    <span>${cartTotal}</span>
                                </div>
                                <div className="flex justify-between text-gray-600 mb-5 border-b border-gray-100 pb-5 text-sm md:text-base font-medium">
                                    <span>Platform Fee</span>
                                    <span>$0.00</span>
                                </div>
                                
                                <div className="flex justify-between items-center mb-8">
                                    <span className="font-bold text-gray-400 uppercase tracking-wider text-sm">Total</span>
                                    <span className="font-bold text-[#6E39CB] text-3xl md:text-4xl">${cartTotal}</span>
                                </div>

                                <button 
                                    onClick={handleCheckout}
                                    disabled={loading}
                                    className="w-full bg-[#6E39CB] text-white py-4 rounded-xl font-bold text-base md:text-lg hover:bg-[#5a2ca0] transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            Pay with Card
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-gray-400 text-xs mt-4">
                                    Secured by Stripe
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Cart;
