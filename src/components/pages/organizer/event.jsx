import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidenav";
import LoadingSpinner from "../../sharedcomps/LoadingSpinner"; 

function MyEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("ALL"); // "ALL", "Approved", "Pending", "Rejected"

    const token = localStorage.getItem("access_token");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                // We use the sales endpoint because it perfectly lists all organizer events and their statuses!
                const res = await axios.get("https://metatix-backend-production.up.railway.app/organizer/my-sales", { headers });
                setEvents(res.data.events || []);
            } catch (error) {
                console.error("🚨 Failed to fetch events:", error);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchEvents();
    }, [token]);

    // --- FILTERING LOGIC ---
    const filteredEvents = events.filter(event => {
        const matchesSearch = (event.name || event.title || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "ALL" || event.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // --- HELPER TO CALCULATE CAPACITY ---
    const getCapacityData = (tiers) => {
        if (!tiers || tiers.length === 0) return { capacity: 0, sold: 0, percentage: 0 };
        
        let totalCap = 0;
        let totalSold = 0;
        
        tiers.forEach(tier => {
            totalCap += (tier.total_capacity || tier.available_quantity || 0);
            totalSold += (tier.tickets_sold || 0);
        });

        const percentage = totalCap === 0 ? 0 : Math.min(100, Math.round((totalSold / totalCap) * 100));
        
        return { capacity: totalCap, sold: totalSold, percentage };
    };

    return (
        
        <div className="bg-[#F4F5F9] min-h-screen flex flex-col lg:flex-row font-['Lato'] w-full">
            
            {/* Sticky Sidebar Wrapper */}
            <div className="lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
                <Sidebar />
            </div>

            {/* Added pt-16 md:pt-8 to safely clear the mobile hamburger menu */}
            <div className="flex-1 p-4 pt-16 md:p-8 lg:p-10 w-full max-w-full">
                
                {/* HEADER */}
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end mb-8 gap-6 lg:gap-4">
                    <div className="flex items-center gap-3">
                        {/* Portfolio/Folder SVG Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#6E39CB] shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                        </svg>
                        <div>
                            <h1 className="font-['bebas-neue'] font-bold text-3xl md:text-4xl text-[#2D2D2D] tracking-wide uppercase leading-none pt-1">Event Portfolio</h1>
                            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 md:mt-2">Manage and track all your active listings</p>
                        </div>
                    </div>
                    
                    {/* CONTROLS (Search & Filter) */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                            </svg>
                            <input 
                                type="text" 
                                placeholder="Search events..." 
                                className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6E39CB] outline-none shadow-sm w-full sm:w-64 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        <select 
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#6E39CB] outline-none shadow-sm font-bold text-gray-600 cursor-pointer w-full sm:w-auto"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Approved">Live (Approved)</option>
                            <option value="Pending">In Review (Pending)</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 w-full">
                        <LoadingSpinner message="Fetching Portfolio..." />
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="bg-white p-12 md:p-16 rounded-3xl shadow-sm text-center border border-gray-100 flex flex-col items-center justify-center w-full">
                        <div className="text-5xl md:text-6xl mb-4 opacity-80">🎫</div>
                        <h3 className="font-['bebas-neue'] text-2xl md:text-3xl text-gray-800 tracking-wide mb-2">No Events Found</h3>
                        <p className="text-gray-500 text-xs md:text-sm">You haven't created any events that match this search.</p>
                        <a href="/organizer/create" className="mt-6 bg-[#6E39CB] text-white px-5 py-2.5 md:px-6 md:py-3 rounded-xl font-bold text-xs md:text-sm shadow-md hover:bg-[#5a2ca0] transition-colors whitespace-nowrap">
                            + Draft New Event
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 w-full">
                        {filteredEvents.map(event => {
                            const { capacity, sold, percentage } = getCapacityData(event.tiers);
                            
                            return (
                                <div key={event.event_id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group flex flex-col min-w-0 w-full">
                                    
                                    {/* Card Header (Status Color Bar) */}
                                    <div className={`h-2 w-full ${
                                        event.status === "Approved" ? "bg-green-500" : 
                                        event.status === "Pending" ? "bg-yellow-400" : "bg-red-500"
                                    }`}></div>

                                    <div className="p-5 md:p-6 flex flex-col flex-1 w-full">
                                        <div className="flex justify-between items-start mb-4 gap-2">
                                            <h3 className="font-bold text-base md:text-lg text-gray-800 group-hover:text-[#6E39CB] transition-colors line-clamp-2 wrap-break-words flex-1">
                                                {event.name || event.title}
                                            </h3>
                                            <span className={`text-[8px] md:text-[9px] font-black px-2 py-1 rounded-md uppercase whitespace-nowrap shrink-0 ${
                                                event.status === "Approved" ? "bg-green-50 text-green-700 border border-green-100" : 
                                                event.status === "Pending" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "bg-red-50 text-red-700 border border-red-100"
                                            }`}>
                                                {event.status}
                                            </span>
                                        </div>

                                        {/* Core Stats */}
                                        <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 mt-2 w-full">
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 min-w-0">
                                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 truncate">Revenue</p>
                                                <p className="font-black text-[#6E39CB] text-base md:text-lg leading-none truncate">${event.revenue?.toLocaleString() || 0}</p>
                                            </div>
                                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 min-w-0">
                                                <p className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 truncate">Tickets Sold</p>
                                                <p className="font-black text-gray-700 text-base md:text-lg leading-none truncate">{event.tickets_sold?.toLocaleString() || 0}</p>
                                            </div>
                                        </div>

                                        <div className="mt-auto w-full">
                                            {/* Sell-Out Progress Bar */}
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">Inventory Status</p>
                                                <p className="text-[10px] md:text-xs font-black text-gray-800">{percentage}% Sold</p>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 md:h-2.5 overflow-hidden">
                                                <div 
                                                    className={`h-2 md:h-2.5 rounded-full transition-all duration-1000 ${
                                                        percentage > 90 ? "bg-red-500" : 
                                                        percentage > 50 ? "bg-[#6E39CB]" : "bg-purple-300"
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[9px] md:text-[10px] text-gray-400 font-bold text-right mt-1.5 truncate">
                                                {sold} / {capacity} tickets
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyEvents;
