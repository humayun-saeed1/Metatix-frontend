import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidenav"; 

function OperationsDashboard() {
    // Treasury State
    const [stats, setStats] = useState({ gross_volume: 0, metatix_profit: 0 });
    
    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchFilter, setSearchFilter] = useState("all"); 
    
    // Discount Form State
    const [discountName, setDiscountName] = useState("");
    const [discountStart, setDiscountStart] = useState("");
    const [discountEnd, setDiscountEnd] = useState("");
    const [discountValue, setDiscountValue] = useState(10);

    // Active Campaigns State (Dynamic)
    const [activeCampaigns, setActiveCampaigns] = useState([]);

    const token = localStorage.getItem("access_token");
    const API_BASE = "http://127.0.0.1:8000/admin"; 

    useEffect(() => {
        fetchStats();
        fetchCampaigns();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/treasury/stats`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) { console.error("Failed to fetch treasury stats", err); }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await axios.get(`${API_BASE}/market/active-campaigns`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            setActiveCampaigns(res.data);
        } catch (err) { console.error("Failed to fetch campaigns", err); }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await axios.get(`${API_BASE}/search/universal?query=${searchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSearchResults(res.data);
        } catch (err) { 
            console.error("Search failed", err); 
            alert("Failed to execute search.");
        } finally {
            setIsSearching(false);
        }
    };

    const scheduleDiscount = async () => {
        if (discountValue < 0) return alert("Percentage cannot be negative.");
        if (!discountName || !discountStart || !discountEnd) return alert("Fill out all discount fields.");
        
        try {
            await axios.post(`${API_BASE}/market/schedule-discount`, {
                name: discountName,
                start_date: discountStart,
                end_date: discountEnd,
                percentage: Number(discountValue)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            alert(`Campaign '${discountName}' successfully scheduled.`);
            setDiscountName(""); setDiscountStart(""); setDiscountEnd(""); setDiscountValue(10);
            
            // Re-fetch campaigns to update the UI
            fetchCampaigns();
        } catch (err) {
            alert("Failed to schedule discount campaign.");
        }
    };

    return (
        
        <div className="bg-[#F4F5F9] min-h-screen flex flex-col lg:flex-row font-['Lato'] w-full">
            
            {/* Sticky Sidebar Wrapper */}
            <div className="lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
                <Sidebar />
            </div>
            
            {/* Added pt-16 md:pt-8 to safely clear the mobile hamburger menu */}
            <div className="flex-1 p-4 pt-16 md:p-8 lg:p-12 w-full max-w-full">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        {/* Global Platform / Operations SVG Icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#6E39CB]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                        </svg>
                        <div>
                            <h1 className="font-['bebas-neue'] font-bold text-3xl md:text-4xl text-[#2D2D2D] tracking-wide uppercase leading-none pt-1">
                                Platform Operations
                            </h1>
                            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 md:mt-2">
                                Financial Treasury & Global Controls
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- TREASURY CARDS --- */}
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10 w-full">
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Total Gross Volume</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-800 truncate">${stats.gross_volume.toLocaleString()}</h2>
                    </div>
                    {/* Highlighted Profit Card */}
                    <div className="bg-[#6E39CB] p-6 md:p-8 rounded-3xl shadow-md border border-[#5a2ca0] flex flex-col justify-center relative overflow-hidden min-w-0">
                        <div className="relative z-10">
                            <p className="text-[9px] md:text-[10px] font-black text-purple-200 uppercase tracking-widest mb-1 truncate">Metatix Net Profit</p>
                            <h2 className="text-2xl sm:text-3xl font-black text-white truncate">${stats.metatix_profit.toLocaleString()}</h2>
                        </div>
                        <div className="absolute -right-6 -top-6 w-24 h-24 md:w-32 md:h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                    </div>
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center sm:col-span-2 md:col-span-1 min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Total Paid to Organizers</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-800 truncate">${(stats.gross_volume - stats.metatix_profit).toLocaleString()}</h2>
                    </div>
                </section>

                {/* --- MAIN TOOLS GRID --- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start w-full">
                    
                    {/* LEFT: GLOBAL PLATFORM SEARCH */}
                    <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col w-full overflow-hidden">
                        <div className="mb-6">
                            <h3 className="font-bold text-lg md:text-xl text-gray-800 mb-2">Global Platform Search</h3>
                            <p className="text-[10px] md:text-xs text-gray-500">Locate full user profiles, complete event details, or specific ticket hashes instantly.</p>
                        </div>
                        
                        {/* Search Options / Filters */}
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar w-full">
                            {['all', 'users', 'events', 'tickets'].map(filter => (
                                <button 
                                    key={filter}
                                    onClick={() => setSearchFilter(filter)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors shrink-0 whitespace-nowrap ${
                                        searchFilter === filter 
                                        ? "bg-[#6E39CB] text-white" 
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
                            <input 
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="Email, Event Title, or Hash..."
                                className="w-full sm:flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#6E39CB] outline-none bg-gray-50 focus:bg-white transition-all shadow-sm"
                            />
                            <button 
                                onClick={handleSearch} 
                                disabled={isSearching}
                                className="w-full sm:w-auto bg-[#6E39CB] text-white px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-colors hover:bg-[#5a2ca0] shadow-sm disabled:opacity-70 whitespace-nowrap"
                            >
                                {isSearching ? "Searching..." : "Lookup"}
                            </button>
                        </div>

                        {/* FULL DATA DISPLAY CARDS */}
                        {searchResults && <FullSearchResults data={searchResults} activeFilter={searchFilter} />}
                    </div>

                    {/* RIGHT: MARKET MANIPULATION & ACTIVE CAMPAIGNS */}
                    <div className="space-y-6 lg:space-y-8 w-full">
                        {/* Schedule Campaign */}
                        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 w-full">
                            <div className="mb-6 md:mb-8">
                                <h3 className="font-bold text-lg md:text-xl text-gray-800 mb-2">Schedule Discount Campaign</h3>
                                <p className="text-[10px] md:text-xs text-gray-500">Automate platform-wide price slashes for specific timeframes.</p>
                            </div>
                            
                            <div className="space-y-4 md:space-y-5">
                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Campaign Name</label>
                                    <input 
                                        type="text" placeholder="e.g. Black Friday Blowout"
                                        value={discountName} onChange={e => setDiscountName(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:ring-2 focus:ring-[#6E39CB] outline-none bg-gray-50 focus:bg-white transition-all"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                                    <div>
                                        <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Start Date</label>
                                        <input 
                                            type="datetime-local" 
                                            value={discountStart} onChange={e => setDiscountStart(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:ring-2 focus:ring-[#6E39CB] outline-none bg-gray-50 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">End Date</label>
                                        <input 
                                            type="datetime-local" 
                                            value={discountEnd} onChange={e => setDiscountEnd(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 md:py-3 text-sm focus:ring-2 focus:ring-[#6E39CB] outline-none bg-gray-50 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Percentage Off (%)</label>
                                    <input 
                                        type="number" min="0" max="100"
                                        value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 md:py-3 text-base md:text-lg font-black focus:ring-2 focus:ring-[#6E39CB] outline-none bg-gray-50 focus:bg-white transition-all"
                                    />
                                </div>

                                <button onClick={scheduleDiscount} className="w-full bg-[#6E39CB] text-white font-bold rounded-xl px-4 py-3 md:py-3.5 hover:bg-[#5a2ca0] transition-colors shadow-md mt-6">
                                    Deploy Campaign
                                </button>
                            </div>
                        </div>

                        {/* Active Campaigns List */}
                        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-gray-100 w-full">
                            <div className="mb-4 md:mb-6 flex justify-between items-start md:items-center gap-2">
                                <div>
                                    <h3 className="font-bold text-lg md:text-xl text-gray-800 mb-1">Active Campaigns</h3>
                                    <p className="text-[10px] md:text-xs text-gray-500">Currently running discounts.</p>
                                </div>
                                <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-[9px] md:text-[10px] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live
                                </span>
                            </div>
                            
                            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1 md:pr-2">
                                {activeCampaigns.length === 0 ? (
                                    <p className="text-[10px] md:text-xs text-gray-400 font-bold tracking-widest uppercase text-center py-6">No active campaigns</p>
                                ) : (
                                    activeCampaigns.map(camp => (
                                        <div key={camp.id} className="bg-gray-50 p-3 md:p-4 rounded-xl border border-gray-200 flex justify-between items-center w-full min-w-0">
                                            <div className="min-w-0 flex-1 mr-2">
                                                <p className="font-bold text-gray-800 text-xs md:text-sm truncate">{camp.name}</p>
                                                <p className="text-[9px] md:text-[10px] text-gray-500 font-medium mt-0.5 truncate">{camp.endsAt}</p>
                                            </div>
                                            <div className="flex items-center shrink-0">
                                                <span className="text-[#6E39CB] font-black text-base md:text-lg">-{camp.percentage}%</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component for rich data rendering
const FullSearchResults = ({ data, activeFilter }) => {
    const showUsers = (activeFilter === 'all' || activeFilter === 'users') && data?.users?.length > 0;
    const showEvents = (activeFilter === 'all' || activeFilter === 'events') && data?.events?.length > 0;
    const showTicket = (activeFilter === 'all' || activeFilter === 'tickets') && data?.ticket;

    const hasResults = showUsers || showEvents || showTicket;

    if (!hasResults) {
        return <div className="p-6 md:p-8 text-center text-gray-400 font-bold tracking-widest uppercase text-[10px] md:text-xs bg-gray-50 rounded-2xl border border-gray-100 mt-2">No records found matching query.</div>;
    }

    return (
        // Replaced arbitrary classes with standard tailwind arbitrary values to remove compiler warnings
        <div className="mt-2 space-y-6 max-h-100 md:max-h-125 overflow-y-auto custom-scrollbar pr-1 md:pr-2 w-full">
            
            {/* USERS BLOCK */}
            {showUsers && (
                <div className="w-full">
                    <h4 className="text-[10px] md:text-xs font-bold text-[#6E39CB] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6E39CB]"></span> Found Users
                    </h4>
                    <div className="space-y-3 w-full">
                        {data.users.map((u, i) => (
                            <div key={`u-${i}`} className="bg-gray-50 p-4 md:p-5 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors w-full min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-800 text-sm md:text-base truncate">{u.name || "Unknown Name"}</p>
                                        <p className="text-xs md:text-sm text-gray-600 truncate">{u.email}</p>
                                    </div>
                                    <span className="bg-white px-2 py-1 md:px-2.5 rounded border border-gray-200 text-[9px] md:text-[10px] font-black uppercase text-gray-500 shrink-0">ID #{u.id}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* EVENTS BLOCK */}
            {showEvents && (
                <div className="w-full">
                    <h4 className="text-[10px] md:text-xs font-bold text-[#6E39CB] uppercase tracking-wider mb-3 flex items-center gap-2 mt-6">
                        <span className="w-2 h-2 rounded-full bg-[#6E39CB]"></span> Found Events
                    </h4>
                    <div className="space-y-3 w-full">
                        {data.events.map((e, i) => (
                            <div key={`e-${i}`} className="bg-gray-50 p-4 md:p-5 rounded-xl border border-gray-200 hover:border-purple-200 transition-colors w-full min-w-0">
                                <div className="flex justify-between items-start gap-2 mb-2 md:mb-3">
                                    <p className="font-bold text-gray-800 text-sm md:text-base truncate min-w-0 flex-1">{e.title}</p>
                                    <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 md:px-2.5 md:py-1 rounded-md uppercase shrink-0 ${
                                        e.status?.toUpperCase() === "APPROVED" ? "bg-green-100 text-green-700" : 
                                        e.status?.toUpperCase() === "PENDING" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                                    }`}>
                                        {e.status}
                                    </span>
                                </div>
                                <div className="flex gap-4 text-[10px] md:text-xs text-gray-500 font-medium">
                                    <p>Event ID: <span className="font-bold text-gray-700">#{e.id}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TICKET BLOCK */}
            {showTicket && (
                <div className="w-full">
                    <h4 className="text-[10px] md:text-xs font-bold text-[#6E39CB] uppercase tracking-wider mb-3 flex items-center gap-2 mt-6">
                        <span className="w-2 h-2 rounded-full bg-[#6E39CB]"></span> Found Ticket
                    </h4>
                    <div className="bg-purple-50 p-4 md:p-5 rounded-xl border border-purple-100 w-full min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-purple-900 text-sm md:text-base mb-1 truncate">Ticket Record Found</p>
                                <p className="text-[10px] md:text-xs text-purple-700 break-all font-mono bg-white px-2 py-1 rounded inline-block border border-purple-200 w-full">
                                    {data.ticket.id}
                                </p>
                            </div>
                            <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 md:px-2.5 md:py-1 rounded-md uppercase shrink-0 ${
                                data.ticket.status === "Valid" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-700"
                            }`}>
                                {data.ticket.status}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default OperationsDashboard;