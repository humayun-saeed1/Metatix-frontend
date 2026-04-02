import { useState, useEffect } from "react";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";
import Sidebar from "../../sidenav"; // Adjust path if needed
import LoadingSpinner from "../../sharedcomps/LoadingSpinner";

function AdminDashboard() {
    // Platform Stats State
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Organizer Spotlight States
    const [organizers, setOrganizers] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState(null);
    const [orgStats, setOrgStats] = useState(null);
    const [orgLoading, setOrgLoading] = useState(false);

    const token = localStorage.getItem("access_token");

    // 1. Initial Load: Platform Stats + Organizer List
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const [statsRes, orgsRes] = await Promise.all([
                    axios.get("http://127.0.0.1:8000/admin/platform-stats", { headers }),
                    axios.get("http://127.0.0.1:8000/admin/approved-organizers", { headers })
                ]);
                
                setStats(statsRes.data);
                setOrganizers(orgsRes.data);
                
                // Auto-select first person to populate table
                if (orgsRes.data.length > 0) {
                    handleOrganizerClick(orgsRes.data[0].user_id);
                }
            } catch (error) {
                console.error("🚨 Dashboard fetch failed:", error);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchDashboardData();
    }, [token]);

    // 2. Fetch specific Stats for a selected Organizer/Admin
    const handleOrganizerClick = async (organizerId) => {
        setSelectedOrgId(organizerId);
        setOrgLoading(true);
        try {
            const response = await axios.get(`http://127.0.0.1:8000/admin/particular-organizer-stats/${organizerId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrgStats(response.data);
        } catch (error) {
            console.error("Failed to fetch organizer stats:", error);
        } finally {
            setOrgLoading(false);
        }
    };

    // Card Helper
    const StatCard = ({ title, value, icon, prefix = "" }) => (
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow h-full">
            <div className="bg-[#f3effb] w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-[#6E39CB] shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest mb-0.5 leading-tight wrap-break-words">{title}</p>
                <p className="text-lg font-['bebas-neue'] text-[#2D2D2D] tracking-wide leading-none mt-1 wrap-break-words">
                    {prefix}{value?.toLocaleString() || 0}
                </p>
            </div>
        </div>
    );

    if (loading || !stats) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F5F9]">
                <div className="w-12 h-12 border-4 border-purple-200 border-t-[#6E39CB] rounded-full animate-spin mb-4"></div>
                <p className="text-xl font-bold text-[#6E39CB] animate-pulse">Initializing System...</p>
            </div>
        );
    }

    const userPieData = [
        { name: "Regular Users", value: Math.max(0, stats.total_users - stats.total_organizers) },
        { name: "Organizers", value: stats.total_organizers }
    ];
    const COLORS = ["#FFFF00", "#32CD32"];

    return (
      
        <div className="bg-[#F4F5F9] min-h-screen flex flex-col lg:flex-row font-['Lato'] w-full">
            
            {/* Added a sticky wrapper around the Sidebar so it follows you down the page until the layout ends */}
            <div className="lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
                <Sidebar />
            </div>

            {/* Removed overflow-y-auto to kill the double scrollbar */}
            <div className="flex-1 p-4 pt-16 md:p-8 lg:p-12 w-full max-w-full">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#6E39CB]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        <h1 className="font-['bebas-neue'] font-bold text-3xl md:text-4xl text-[#2D2D2D] tracking-wide uppercase pt-1">Command Center</h1>
                    </div>
                    <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full border border-green-100 text-xs font-bold tracking-widest uppercase flex items-center gap-2 shrink-0">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> System Live
                    </div>
                </div>

                {/* --- TOP ROW CARDS --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-8 w-full">
                    <StatCard title="Total Revenue" value={stats.total_revenue} prefix="$" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>} />
                    <StatCard title="Tickets Sold" value={stats.total_tickets_sold} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" /></svg>} />
                    <StatCard title="Total Events" value={stats.total_events} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>} />
                    <StatCard title="Total Users" value={stats.total_users} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>} />
                    <StatCard title="Organizers" value={stats.total_organizers} icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>} />
                </div>

                {/* --- GRAPHS ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 w-full">
                    <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden w-full">
                        <h3 className="font-bold text-gray-800 text-lg mb-6">Revenue Over Time</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.revenue_trend || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                    <YAxis width={60} axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                                    <ChartTooltip cursor={{ fill: '#f3effb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="revenue" fill="#6E39CB" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 w-full">
                        <h3 className="font-bold text-gray-800 text-lg mb-2">Platform Split</h3>
                        <div style={{ width: '100%', height: 260, marginTop: '16px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={userPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                                        {userPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* --- ORGANIZER SPOTLIGHT (WITH SEARCH) --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pt-8 border-t border-gray-200">
                    <div>
                        <h2 className="font-['bebas-neue'] font-bold text-3xl text-[#2D2D2D] tracking-wide uppercase leading-none">Organizer Spotlight</h2>
                    </div>
                    
                    <div className="relative w-full md:w-80 group">
                        <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                        </span>
                        <input 
                            type="text" 
                            placeholder="Search name or email..." 
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#6E39CB] focus:border-transparent outline-none transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
                    {/* Metrics Dashboard */}
                    <div className="lg:col-span-2 bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-gray-100 min-h-75 w-full">
                        {orgLoading ? (
                            <div className="h-full flex items-center justify-center min-h-62.5">
                                <LoadingSpinner message="Fetching Data..." />
                            </div>
                        ) : !orgStats ? (
                            <div className="h-full flex items-center justify-center text-gray-400 italic min-h-62.5">Select an organizer to view their impact.</div>
                        ) : (
                            <div className="w-full">
                                {/* Changed to grid-cols-1 sm:grid-cols-3 to stack these on mobile properly */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 w-full">
                                    <div className="bg-[#F8F7FF] p-4 md:p-6 rounded-2xl border border-purple-50 text-center min-w-0">
                                        <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 truncate">Created</p>
                                        <p className="text-3xl md:text-4xl font-['bebas-neue'] text-[#6E39CB] truncate">{orgStats.total_events_created}</p>
                                    </div>
                                    <div className="bg-[#F8F7FF] p-4 md:p-6 rounded-2xl border border-purple-50 text-center min-w-0">
                                        <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 truncate">Sold</p>
                                        <p className="text-3xl md:text-4xl font-['bebas-neue'] text-[#6E39CB] truncate">{orgStats.total_tickets_sold}</p>
                                    </div>
                                    <div className="bg-[#F8F7FF] p-4 md:p-6 rounded-2xl border border-purple-50 text-center min-w-0">
                                        <p className="text-gray-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 truncate">Revenue</p>
                                        <p className="text-3xl md:text-4xl font-['bebas-neue'] text-[#6E39CB] truncate">${orgStats.total_revenue}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto w-full pb-2">
                                    <table className="w-full text-left min-w-75">
                                        <thead className="bg-gray-50 rounded-xl">
                                            <tr>
                                                <th className="py-3 md:py-4 px-4 md:px-6 text-gray-500 text-[9px] md:text-[10px] font-bold uppercase">Event</th>
                                                <th className="py-3 md:py-4 px-4 md:px-6 text-gray-500 text-[9px] md:text-[10px] font-bold uppercase">Tickets</th>
                                                <th className="py-3 md:py-4 px-4 md:px-6 text-gray-500 text-[9px] md:text-[10px] font-bold uppercase text-right">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orgStats.events?.length === 0 ? (
                                                <tr><td colSpan="3" className="py-12 text-center text-gray-400">No events found.</td></tr>
                                            ) : (
                                                orgStats.events?.map(event => (
                                                    <tr key={event.event_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group text-sm md:text-base">
                                                        <td className="py-3 md:py-4 px-4 md:px-6 font-bold text-gray-700 group-hover:text-[#6E39CB]">{event.name}</td>
                                                        <td className="py-3 md:py-4 px-4 md:px-6 text-gray-500">{event.tickets_sold}</td>
                                                        <td className="py-3 md:py-4 px-4 md:px-6 text-green-600 font-black text-right">${event.revenue}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Scrollable User List */}
                    <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col max-h-100 lg:max-h-137.5 w-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest">Active Personnel</h3>
                            <span className="bg-purple-50 text-[#6E39CB] text-[10px] font-black px-2 py-1 rounded-lg">
                                {organizers.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase())).length}
                            </span>
                        </div>
                        <div className="overflow-y-auto pr-2 space-y-2 flex-1 custom-scrollbar w-full">
                            {organizers
                                .filter(o => 
                                    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                    o.email.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map(org => (
                                <button
                                    key={org.user_id}
                                    onClick={() => handleOrganizerClick(org.user_id)}
                                    className={`w-full text-left p-3 md:p-4 rounded-2xl transition-all border block ${
                                        selectedOrgId === org.user_id 
                                            ? "bg-[#6E39CB] border-[#6E39CB] text-white shadow-lg scale-[1.02]" 
                                            : "bg-white border-gray-100 hover:border-purple-200 hover:bg-purple-50 text-gray-800"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 md:gap-4 w-full">
                                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                            selectedOrgId === org.user_id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                                        }`}>
                                            {org.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1 gap-1 sm:gap-0">
                                                <p className="font-bold text-xs md:text-sm truncate leading-none w-full sm:w-auto">{org.name}</p>
                                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter w-fit shrink-0 ${
                                                    selectedOrgId === org.user_id 
                                                    ? "bg-purple-400 text-white" 
                                                    : org.role === "Admin" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                                }`}>{org.role}</span>
                                            </div>
                                            <p className={`text-[9px] md:text-[10px] truncate w-full ${selectedOrgId === org.user_id ? "text-purple-200" : "text-gray-400"}`}>{org.email}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;