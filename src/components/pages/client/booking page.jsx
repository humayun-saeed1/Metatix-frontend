import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Card from "../../sharedcomps/card";
import Sidebar from "../../sidenav";
import LoadingSpinner from "../../sharedcomps/LoadingSpinner";

function BookingPage() {
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    
    const eventsPerPage = 10;
    const navigate = useNavigate();
    const eventsSectionRef = useRef(null);
    const userName = localStorage.getItem("user_name") || "Guest";

    // Fetch data from FastAPI on page load
    useEffect(() => {
        // 🚨 You must define the token before you can use it in the Axios call!
        const token = localStorage.getItem("access_token");

        // (Optional but recommended) If they somehow bypassed the bouncer, kick them out
        if (!token) {
            navigate("/login");
            return;
        }

        const fetchEvents = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:8000/events/all_events", {
                    headers: {
                        Authorization: `Bearer ${token}` // Now this works!
                    }
                });
                
                setAllEvents(response.data);
                setLoading(false);
            } catch (error) {
                // ... your existing catch logic
                setLoading(false);
            }
        };

        fetchEvents();
    }, [navigate]);
    
    // Pagination math
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = allEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(allEvents.length / eventsPerPage);

    return (
        <div className="bg-[#F4F5F9] min-h-screen flex flex-row">

            {/* Responsive Sidebar */}
            <Sidebar />

            {/* Events Section */}
            {/* 🚨 THE ONLY CHANGE: w-full added, and p-12 became p-4 pt-24 md:p-12 */}
            <div ref={eventsSectionRef} className="w-full p-4 pt-24 md:p-12 scroll-mt-20"> 
                <h1>Welcome {userName} !</h1>
                <h2 className="font-['Lato'] font-bold text-[24px] mb-6 text-[#2D2D2D]">Upcoming Events</h2>
                
                {loading ? (
                    <div className="py-10">
                        <LoadingSpinner message="Loading events from database..." />
                    </div>
                ) : allEvents.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 text-xl font-['Lato']">No events currently scheduled. Check back soon!</div>
                ) : (
                    <>
                        {/* The Grid mapping FastAPI data to your Card props */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        eventId={event.event_id} 
                        title={event.title}
                        description={event.description}
                        venue={event.venue_name}
                        city={event.city}
                        time={prettyDate} // Pass our extracted pretty date to the card!
                        status={event.status}
                    />
                );
            })}
                        </div>

                        {/* Pagination Controls */}
                        <div className="flex justify-center items-center mt-12 gap-4">
                            <button 
                                onClick={() => {
                                    setCurrentPage(prev => Math.max(prev - 1, 1));
                                    if (eventsSectionRef.current) eventsSectionRef.current.scrollIntoView({ behavior: 'smooth' }); 
                                }}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 hover:bg-gray-50 transition-colors"
                            >
                                Previous
                            </button>
                            
                            <span className="font-['Lato'] font-medium text-gray-700">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button 
                                onClick={() => {
                                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                    if (eventsSectionRef.current) eventsSectionRef.current.scrollIntoView({ behavior: 'smooth' }); 
                                }}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-[#6E39CB] text-white rounded-md disabled:opacity-50 hover:bg-[#5a2ca0] transition-colors"
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

export default BookingPage;