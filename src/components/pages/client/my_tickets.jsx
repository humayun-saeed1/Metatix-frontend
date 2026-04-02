import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import Sidebar from "../../sidenav";
import LoadingSpinner from "../../sharedcomps/LoadingSpinner";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function MyTickets() {
    // --- States ---
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [refunding, setRefunding] = useState(false);
    const [activeBookingId, setActiveBookingId] = useState(null);
    
    // Filter & Sort States
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortOrder, setSortOrder] = useState("newest");

    // Stripe Modal States
    const [searchParams, setSearchParams] = useSearchParams();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    const token = localStorage.getItem("access_token");

    // --- 1. Fetch Logic ---
    const fetchTickets = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/booking/my_tickets`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data);
            
            if (response.data.length > 0 && !activeBookingId) {
                // Find first valid booking to set as active
                const validBookings = response.data.filter(b => b.status !== "Cancelled" && b.status !== "Refunded");
                if (validBookings.length > 0) setActiveBookingId(validBookings[0].booking_id);
            }
        } catch (error) {
            console.error("🚨 Failed to fetch tickets:", error);
        } finally {
            setLoading(false);
        }
    }, [token, activeBookingId]);

    useEffect(() => {
        if (token) fetchTickets();
    }, [token, fetchTickets]);

    // --- 2. Stripe Success Handling ---
    useEffect(() => {
        const success = searchParams.get("success");
        const sessionId = searchParams.get("session_id");

        if (success === "true" && sessionId) {
            axios.post(`${API_BASE_URL}/stripe/verify-checkout/${sessionId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            .then(() => {
                setShowSuccessModal(true);
                fetchTickets(); 
                const timer = setTimeout(() => setShowSuccessModal(false), 3000);
                return () => clearTimeout(timer);
            })
            .catch(error => console.error("🚨 Verification failed:", error))
            .finally(() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("success");
                newParams.delete("session_id");
                setSearchParams(newParams);
            });
        } else if (success === "true") {
            setShowSuccessModal(true);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("success");
            setSearchParams(newParams);
            const timer = setTimeout(() => setShowSuccessModal(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, setSearchParams, token, fetchTickets]);

    // --- 3. Manual Sync ---
    const handleSyncStatus = async (bookingId) => {
        setSyncing(true);
        try {
            await axios.post(`${API_BASE_URL}/booking/sync/${bookingId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchTickets();
        } catch (error) {
            console.error("🚨 Sync failed:", error);
            alert("Payment verification pending. If you just paid, please wait a minute.");
        } finally {
            setSyncing(false);
        }
    };

    // --- 4. Refund API ---
    const handleRefund = async (bookingId) => {
        setRefunding(true);
        try {
            await axios.post(`${API_BASE_URL}/payouts/refund`, 
                { booking_id: bookingId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("Refund processed successfully.");
            await fetchTickets(); 
        } catch (error) {
            console.error("🚨 Refund failed:", error);
            alert("Failed to process refund. Please try again.");
        } finally {
            setRefunding(false);
        }
    };

    // --- 5. Generate PDF ---
    const downloadTicketPDF = (ticket, booking) => {
        const pdf = new jsPDF("landscape", "mm", [200, 100]);

        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, 200, 100, "F");
        pdf.setFillColor(110, 57, 203);
        pdf.rect(0, 0, 8, 100, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(24);
        pdf.setTextColor(45, 45, 45);
        pdf.text(booking.event?.title || "Event Ticket", 15, 25);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(12);
        pdf.setTextColor(110, 57, 203);
        pdf.text(`Venue: ${booking.event?.venue_name || "TBA"}`, 15, 40);

        pdf.setTextColor(100, 100, 100);
        pdf.text(`Order: #${booking.booking_id}`, 15, 60);
        pdf.text(`Ticket ID: #${ticket.ticket_id}`, 15, 68);
        pdf.text(`Seat: ${ticket.seat_identifier || "General Admission"}`, 15, 76);
        
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(110, 57, 203);
        pdf.text(`STATUS: ${ticket.status.toUpperCase()}`, 15, 88);

        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDash([2, 2], 0);
        pdf.line(140, 5, 140, 95);

        // Fallback for getting the right Canvas whether it's mobile or desktop
        const qrCanvas = document.getElementById(`qr-mobile-${ticket.ticket_id}`) || document.getElementById(`qr-desktop-${ticket.ticket_id}`);
        if (qrCanvas) {
            const qrImage = qrCanvas.toDataURL("image/png");
            pdf.addImage(qrImage, "PNG", 148, 25, 40, 40);
        }

        pdf.save(`Ticket_${ticket.ticket_id}.pdf`);
    };

    // --- 6. Filtering & Sorting ---
    const filteredBookings = useMemo(() => {
        return bookings
            // 🚨 FRONTEND SHIELD: Completely remove Refunded/Cancelled orders
            .filter((booking) => booking.status !== "Cancelled" && booking.status !== "Refunded")
            .filter((booking) => {
                const searchLower = searchTerm.toLowerCase();
                const titleMatch = booking.event?.title?.toLowerCase().includes(searchLower);
                const venueMatch = booking.event?.venue_name?.toLowerCase().includes(searchLower);
                const matchesSearch = titleMatch || venueMatch;

                const matchesStatus = statusFilter === "all" || 
                                      booking.status.toLowerCase() === statusFilter.toLowerCase();

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortOrder === "newest") return b.booking_id - a.booking_id;
                if (sortOrder === "oldest") return a.booking_id - b.booking_id;
                return 0;
            });
    }, [bookings, searchTerm, sortOrder, statusFilter]);

    const activeBooking = filteredBookings.find(b => b.booking_id === activeBookingId) || filteredBookings[0];

    // --- 7. Reusable Ticket Detail Component (For Desktop & Mobile Accordion) ---
    const renderTicketDetails = (booking, isMobile = false) => (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 mb-6 gap-6">
                <div>
                    {/* Hide Title on mobile accordion since it's already on the card header */}
                    {!isMobile && (
                        <h2 className="font-['bebas-neue'] text-3xl md:text-4xl text-gray-900 mb-2 leading-none">{booking.event?.title}</h2>
                    )}
                    <div className="flex items-center gap-4">
                        <p className="text-gray-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${booking.status === 'Confirmed' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                            {booking.status}
                        </p>
                        <span className="text-gray-200 text-xl">|</span>
                        <p className="text-gray-500 font-bold text-sm">Order #{booking.booking_id}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    {booking.status === "Pending" && (
                        <button onClick={(e) => { e.stopPropagation(); handleSyncStatus(booking.booking_id); }} disabled={syncing} className="bg-[#6E39CB] hover:bg-[#5a2ea8] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-purple-100 flex items-center gap-2 disabled:opacity-50">
                            {syncing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                            {syncing ? "Checking..." : "Verify"}
                        </button>
                    )}
                    {booking.status === "Confirmed" && (
                        <button onClick={(e) => { e.stopPropagation(); handleRefund(booking.booking_id); }} disabled={refunding} className="bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50">
                            {refunding && <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>}
                            {refunding ? "Processing..." : "Refund"}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {booking.tickets.map((ticket) => (
                    <div key={ticket.ticket_id} className="bg-gray-50 border border-gray-100 rounded-[2rem] overflow-hidden group hover:shadow-md transition-all">
                        <div className={`h-2 w-full ${booking.status === 'Confirmed' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                        
                        <div className="p-6 md:p-8 flex flex-col items-center bg-white border-b border-dashed border-gray-200">
                            {booking.status === 'Confirmed' ? (
                                <QRCodeCanvas id={`qr-${isMobile ? 'mobile' : 'desktop'}-${ticket.ticket_id}`} value={ticket.qr_code_hash} size={130} />
                            ) : (
                                <div className="h-[130px] flex flex-col items-center justify-center text-gray-200 gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                    <p className="text-[10px] font-black tracking-widest">LOCKED</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 md:p-8">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pass ID</p>
                            <p className="font-bold text-gray-900 text-lg mb-6">#{ticket.ticket_id}</p>
                            
                            {booking.status === 'Confirmed' ? (
                                <button onClick={(e) => { e.stopPropagation(); downloadTicketPDF(ticket, booking); }} className="w-full bg-white border-2 border-gray-100 text-gray-400 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-[#6E39CB] hover:text-[#6E39CB] transition-all">
                                    Download PDF
                                </button>
                            ) : (
                                <p className="text-center text-[10px] font-bold text-orange-400 uppercase">Verification Pending</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-[#F4F5F9] min-h-screen flex flex-col lg:flex-row font-['Lato'] relative">
            
            {/* Success Modal */}
            {showSuccessModal && (
                <div onClick={() => setShowSuccessModal(false)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 transition-opacity cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 font-['bebas-neue'] tracking-wide">Payment Successful!</h2>
                        <p className="text-gray-500 text-sm font-medium">Your tickets are ready in your wallet.</p>
                    </div>
                </div>
            )}

            <div className="lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
                <Sidebar />
            </div>

            <div className="w-full flex-1 p-4 pt-24 md:p-8 lg:p-12 overflow-hidden">
                
                {/* Header & Filter Controls */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2.5 rounded-xl shadow-sm border border-gray-200 text-[#6E39CB]">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" /></svg>
                        </div>
                        <div>
                            <h1 className="font-['bebas-neue'] font-bold text-4xl text-[#2D2D2D] tracking-wide">My Digital Wallet</h1>
                            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1">Manage your event access</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <input type="text" placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#6E39CB] outline-none text-sm font-medium bg-white shadow-sm" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 bg-white cursor-pointer shadow-sm">
                            <option value="all">All Status</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending</option>
                        </select>
                        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 bg-white cursor-pointer shadow-sm">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <LoadingSpinner message="Retrieving Wallet Data..." />
                ) : filteredBookings.length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl text-center border border-gray-100 flex flex-col items-center">
                        <h2 className="text-2xl font-black text-gray-800">Wallet is Empty</h2>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 items-start relative lg:h-[calc(100vh-200px)]">
                        
                        {/* LEFT PANE / MOBILE ACCORDION: Orders List */}
                        <div className="w-full lg:w-[380px] flex flex-col gap-4 lg:h-full lg:overflow-y-auto pr-0 lg:pr-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1">
                                Purchase History ({filteredBookings.length})
                            </h3>
                            {filteredBookings.map((booking) => {
                                const isActive = activeBooking?.booking_id === booking.booking_id;
                                return (
                                    <div key={booking.booking_id} className={`p-6 rounded-[1.5rem] transition-all border-2 ${isActive ? "bg-white lg:bg-[#6E39CB] border-[#6E39CB] lg:text-white shadow-xl lg:translate-x-1" : "bg-white border-transparent hover:border-purple-100 shadow-sm"}`}>
                                        
                                        {/* Header / Clickable Area */}
                                        <div onClick={() => setActiveBookingId(booking.booking_id)} className="cursor-pointer">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-[#6E39CB] lg:text-purple-200' : 'text-gray-400'}`}>ID: #{booking.booking_id}</span>
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${isActive ? 'bg-[#6E39CB] text-white lg:bg-white/20 lg:text-white' : 'bg-orange-50 text-orange-600'}`}>{booking.status}</span>
                                            </div>
                                            <h3 className="font-bold text-lg leading-tight">{booking.event?.title || "Unknown Event"}</h3>
                                            <p className={`text-xs mt-2 font-medium ${isActive ? 'text-gray-500 lg:text-purple-100' : 'text-gray-400'}`}>{booking.event?.venue_name}</p>
                                        </div>

                                        {/* 🚨 MOBILE ACCORDION: Only visible on small screens when Active */}
                                        {isActive && (
                                            <div className="block lg:hidden mt-6 pt-6 border-t border-gray-100">
                                                {renderTicketDetails(booking, true)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* RIGHT PANE: Ticket Details (Sticky Desktop View) */}
                        <div className="hidden lg:block flex-1 lg:sticky lg:top-0 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {activeBooking ? (
                                renderTicketDetails(activeBooking, false)
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-300 font-black uppercase tracking-widest">
                                    <p>Select an order to view tickets</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyTickets;