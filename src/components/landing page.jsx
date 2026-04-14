import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Card from "./sharedcomps/card";
import LoadingSpinner from "./sharedcomps/LoadingSpinner";


function LandingPage() {
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const eventsPerPage = 10;
    const navigate = useNavigate();
    const eventsSectionRef = useRef(null);

    // Fetch data from FastAPI on page load
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axios.get("https://metatix-backend-production.up.railway.app/events/all_events");
                
                // 🚨 ADD THESE TWO LINES:
                console.log("🕵️‍♂️ EXACT FASTAPI RESPONSE:", response.data);
                console.log("🕵️‍♂️ IS IT AN ARRAY?", Array.isArray(response.data));

                setAllEvents(response.data);
                setLoading(false);
            } catch (error) {
                console.error("🚨 Failed to fetch events:", error);
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const scrollToEvents = () => {
        eventsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleLogin = () => navigate("/login");
    const handleSignup = () => navigate("/signup");

    // Pagination math
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = allEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(allEvents.length / eventsPerPage);

    return (
        <div className="bg-[#F4F5F9] min-h-screen">
            {/* Responsive Header */}
            <header className="flex flex-row justify-between px-4 py-3 md:p-4 items-center border-b border-gray-200 bg-white sticky top-0 z-50">
                <div className="flex flex-row gap-2 sm:gap-5 items-center justify-center">
                    <img src="signup/logo.png" alt="Ticketing System Logo" className="h-8 sm:h-10 md:h-12 object-contain" />
                    <h1 className="font-['Oswald'] font-bold text-[20px] sm:text-[24px] md:text-[30px] text-blue-600 leading-4 tracking-normal">MetaTix</h1>
                </div>
                
                {/* Desktop Buttons */}
                <div className="hidden sm:flex flex-row gap-4 items-center">
                    <button onClick={handleLogin} className="w-24 bg-[#6E39CB] text-white py-2 px-4 rounded-md hover:bg-[#5a2ca0]">Log In</button>
                    <button onClick={handleSignup} className="w-24 bg-white text-[#5a2ca0] border border-[#5a2ca0] py-2 px-4 rounded-md hover:bg-[#f0f0f0]">Sign Up</button>
                </div>

                {/* Mobile Hamburger Button */}
                <button 
                    className="sm:hidden flex flex-col gap-1.5 p-2 cursor-pointer" 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span className="block w-6 h-0.5 bg-[#6E39CB]"></span>
                    <span className="block w-6 h-0.5 bg-[#6E39CB]"></span>
                    <span className="block w-6 h-0.5 bg-[#6E39CB]"></span>
                </button>

                {/* Mobile Dropdown Menu */}
                {isMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 p-4 flex flex-col gap-3 sm:hidden shadow-md">
                        <button onClick={handleLogin} className="w-full bg-[#6E39CB] text-white py-2 px-4 rounded-md hover:bg-[#5a2ca0]">Log In</button>
                        <button onClick={handleSignup} className="w-full bg-white text-[#5a2ca0] border border-[#5a2ca0] py-2 px-4 rounded-md hover:bg-[#f0f0f0]">Sign Up</button>
                    </div>
                )}
            </header>

            {/* Hero Section */}
            {/* Changed height classes for better mobile rendering while preserving desktop */}
            <div className="relative w-full h-[60vh] md:h-125 overflow-hidden">
                <img src="landingpage/hero.png" alt="hero" className="w-full h-full block object-cover object-center" />
                {/* Reduced horizontal padding on mobile (px-6 vs px-12) */}
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-start px-6 md:px-12">
                    {/* Scaled text sizes for mobile while preserving md:text-7xl */}
                    <h2 className="text-white text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mt-4">
                        YOUR GATEWAY TO <br /> <span className="text-[#6E39CB]">UNFORGETTABLE</span> MOMENTS
                    </h2>
                    <p className="text-white text-base md:text-xl mt-3 md:mt-4 max-w-xl">
                        From front-row concert seats to the championship game, MetaTix brings you closer to the events you love.
                    </p>
                    <button 
                        onClick={scrollToEvents}
                        className="mt-6 md:mt-8 bg-[#6E39CB] text-white px-6 md:px-8 py-2 md:py-3 rounded-md font-bold text-base md:text-lg hover:bg-[#5a2ca0] transition-all"
                    >
                        Explore Events
                    </button>
                </div>
            </div>

            {/* Events Section */}
            {/* Reduced overall padding on mobile (p-4 py-8 vs p-12) */}
            <div ref={eventsSectionRef} className="px-4 py-8 md:p-12 scroll-mt-20"> 
                <h2 className="font-bold text-[20px] md:text-[24px] mb-4 md:mb-6 text-[#2D2D2D]">Upcoming Events</h2>
                
                {loading ? (
                    <div className="py-10">
                        <LoadingSpinner message="Loading events from database..." />
                    </div>
                ) : allEvents.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 text-lg md:text-xl">No events currently scheduled. Check back soon!</div>
                ) : (
                    <>
                        {/* The Grid mapping FastAPI data to your Card props */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {currentEvents.map((event) => {
                                // Translate the nested schedule timestamp into a beautiful date
                                let prettyDate = "Date TBA";
                                
                                // Check if the backend sent the schedules array, and if it has at least one schedule!
                                if (event.schedules && event.schedules.length > 0) {
                                    // Grab the start_time from the very first schedule
                                    const rawDate = event.schedules[0].start_time;
                                    const dateObj = new Date(rawDate);
                                    
                                    prettyDate = dateObj.toLocaleString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    });
                                }

                                return (
                                    <Card 
                                        key={event.event_id} 
                                        title={event.title}
                                        description={event.description}
                                        venue={event.venue_name}
                                        city={event.city}
                                        time={prettyDate} 
                                        status={event.status}
                                    />
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {/* Added flex-wrap for very small screens */}
                        <div className="flex flex-wrap justify-center items-center mt-8 md:mt-12 gap-3 md:gap-4">
                            <button 
                                onClick={() => {
                                    setCurrentPage(prev => Math.max(prev - 1, 1));
                                    scrollToEvents(); 
                                }}
                                disabled={currentPage === 1}
                                className="px-3 py-2 md:px-4 md:py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm md:text-base"
                            >
                                Previous
                            </button>
                            
                            <span className="font-medium text-gray-700 text-sm md:text-base">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button 
                                onClick={() => {
                                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                    scrollToEvents(); 
                                }}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 md:px-4 md:py-2 bg-[#6E39CB] text-white rounded-md disabled:opacity-50 hover:bg-[#5a2ca0] transition-colors text-sm md:text-base"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default LandingPage;
