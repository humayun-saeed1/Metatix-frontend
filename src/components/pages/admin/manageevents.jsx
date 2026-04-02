import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidenav";
import LoadingSpinner from "../../sharedcomps/LoadingSpinner"; 

function ManageEvents() {
    const [activeTab, setActiveTab] = useState("pending"); // "pending", "all", "create", "venues"
    
    // Data States
    const [pendingEvents, setPendingEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [venues, setVenues] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Rejection Modal States
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    // Danger Cancel Modal State
    const [cancelModal, setCancelModal] = useState({ isOpen: false, eventId: null });

    // Form States
    const [venueForm, setVenueForm] = useState({ name: "", city: "", capacity: "" });
    const [eventForm, setEventForm] = useState({ title: "", description: "", venue_id: "" });
    const [schedules, setSchedules] = useState([{ schedule_name: "Main Event", start_time: "", end_time: "" }]);
    const [tiers, setTiers] = useState([{ tier_name: "General Admission", price: "", available_quantity: "" }]);

    const [venueSearchTerm, setVenueSearchTerm] = useState("");
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);

    // Sleek Modals, Toasts, and Errors
    const [errors, setErrors] = useState({ schedules: {}, tiers: {}, venue: {}, event: {} });
    const [toast, setToast] = useState({ visible: false, text: "", type: "success" });
    const [successModal, setSuccessModal] = useState({ isOpen: false, title: "", text: "" });

    // Custom Date Picker State
    const [pickerConfig, setPickerConfig] = useState({ isOpen: false, index: null, field: null });
    const [calDate, setCalDate] = useState(new Date());
    const [selDate, setSelDate] = useState(new Date());
    const [timeConfig, setTimeConfig] = useState({ h: '12', m: '00', ampm: 'PM' });

    const token = localStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    // --- FETCH DATA ---
    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === "pending") {
                const res = await axios.get("http://127.0.0.1:8000/admin/event-requests", { headers });
                setPendingEvents(res.data);
            } else if (activeTab === "all") {
                const res = await axios.get("http://127.0.0.1:8000/events/all_events", { headers });
                setAllEvents(res.data);
            } else if (activeTab === "create") {
                const res = await axios.get("http://127.0.0.1:8000/events/venues", { headers }); 
                setVenues(res.data);
            }
        } catch (error) {
            console.error("🚨 Failed to fetch data:", error);
            showToast("Failed to load data from server.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && activeTab !== "venues") fetchData();
        else setLoading(false);
    }, [activeTab, token]);

    // --- ☢️ THE NUCLEAR ANTI-MASH VALIDATOR ☢️ ---
    const validateText = (text, min, max, fieldName) => {
        const trimmed = text.trim().replace(/\s+/g, ' ');
        if (!trimmed) return `${fieldName} cannot be empty.`;
        if (trimmed.length < min) return `${fieldName} must be at least ${min} characters.`;
        if (trimmed.length > max) return `${fieldName} cannot exceed ${max} characters.`;
        if (/(.)\1{3,}/i.test(trimmed)) return `${fieldName} contains too many repeating characters.`;

        const mashPatterns = /(asdf|qwer|zxcv|hjkl|uiop|tyui|vbnm|qaz|wsx|edc|rfv|tgb|yhn)/i;
        if (mashPatterns.test(trimmed)) return `Keyboard mashing is not allowed in ${fieldName}.`;
        if (/[bcdfghjklmnpqrstvwxz]{7,}/i.test(trimmed)) return `${fieldName} looks like gibberish.`;
        if (/[aeiou]{5,}/i.test(trimmed)) return `${fieldName} has too many consecutive vowels.`;

        const words = trimmed.split(' ');
        for (let word of words) {
            if (word.startsWith('http://') || word.startsWith('https://') || word.startsWith('www.')) continue;
            if (word.length > 25) return `${fieldName} contains a word that is too long.`;
            if (word.length > 4 && !/[aeiouy]/i.test(word)) return `Please enter real words. Missing vowels in ${fieldName}.`;
            if (word.length > 6) {
                const uniqueChars = new Set(word.toLowerCase().split('')).size;
                if (uniqueChars < 4) return `Invalid word structure found in ${fieldName}.`;
            }
        }
        const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
        if (lettersOnly.length > 20) {
            const vowels = (lettersOnly.match(/[aeiouy]/gi) || []).length;
            if (vowels / lettersOnly.length < 0.15) return `${fieldName} does not look like real English sentences.`;
        }
        return null; 
    };

    // --- UI HELPERS ---
    const showToast = (text, type = "success") => {
        setToast({ visible: true, text, type });
        setTimeout(() => setToast({ visible: false, text: "", type: "success" }), 4000);
    };

    // --- CUSTOM DATE PICKER LOGIC ---
    const openDatePicker = (index, field, currentValue) => {
        if (currentValue) {
            const d = new Date(currentValue);
            setSelDate(d); setCalDate(d);
            let hours = d.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; 
            setTimeConfig({ h: hours.toString().padStart(2, '0'), m: d.getMinutes().toString().padStart(2, '0'), ampm });
        } else {
            const now = new Date();
            setSelDate(now); setCalDate(now);
        }
        setPickerConfig({ isOpen: true, index, field });
    };

    const handleHourChange = (e) => {
        let val = e.target.value.replace(/\D/g, ''); 
        if (val.length > 2) val = val.slice(-2);
        setTimeConfig({ ...timeConfig, h: val });
    };

    const handleHourBlur = () => {
        let val = parseInt(timeConfig.h, 10);
        if (isNaN(val) || val < 1) val = 12;
        if (val > 12) val = 12;
        setTimeConfig({ ...timeConfig, h: val.toString().padStart(2, '0') });
    };

    const handleMinuteChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(-2);
        setTimeConfig({ ...timeConfig, m: val });
    };

    const handleMinuteBlur = () => {
        let val = parseInt(timeConfig.m, 10);
        if (isNaN(val) || val < 0) val = 0;
        if (val > 59) val = 59;
        setTimeConfig({ ...timeConfig, m: val.toString().padStart(2, '0') });
    };

    // 🚨 THIS WAS THE MISSING FUNCTION 🚨
    const toggleAmPm = () => {
        setTimeConfig({ ...timeConfig, ampm: timeConfig.ampm === 'AM' ? 'PM' : 'AM' });
    };

    const saveCustomDate = () => {
        let finalH = parseInt(timeConfig.h, 10) || 12;
        let finalM = parseInt(timeConfig.m, 10) || 0;
        if (finalH > 12) finalH = 12; if (finalM > 59) finalM = 59;
        if (timeConfig.ampm === 'PM' && finalH < 12) finalH += 12;
        if (timeConfig.ampm === 'AM' && finalH === 12) finalH = 0;
        const finalDate = new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), finalH, finalM);
        handleScheduleChange(pickerConfig.index, pickerConfig.field, finalDate.toISOString());
        setPickerConfig({ isOpen: false, index: null, field: null });
    };

    const formatDateForDisplay = (isoString) => {
        if (!isoString) return "Select Date & Time";
        return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- DYNAMIC FORM HANDLERS ---
    const handleAddSchedule = () => setSchedules([...schedules, { schedule_name: "", start_time: "", end_time: "" }]);
    const handleRemoveSchedule = (index) => {
        setSchedules(schedules.filter((_, i) => i !== index));
        const newSchErrors = { ...errors.schedules }; delete newSchErrors[index];
        setErrors({ ...errors, schedules: newSchErrors });
    };
    const handleScheduleChange = (index, field, value) => {
        const newSchedules = [...schedules]; newSchedules[index][field] = value; setSchedules(newSchedules);
        if (errors.schedules?.[index]?.[field]) {
            const newErrors = { ...errors }; delete newErrors.schedules[index][field]; setErrors(newErrors);
        }
    };

    const handleAddTier = () => setTiers([...tiers, { tier_name: "", price: "", available_quantity: "" }]);
    const handleRemoveTier = (index) => {
        setTiers(tiers.filter((_, i) => i !== index));
        const newTierErrors = { ...errors.tiers }; delete newTierErrors[index];
        setErrors({ ...errors, tiers: newTierErrors });
    };
    const handleTierChange = (index, field, value) => {
        const newTiers = [...tiers]; newTiers[index][field] = value; setTiers(newTiers);
        if (errors.tiers?.[index]?.[field]) {
            const newErrors = { ...errors }; delete newErrors.tiers[index][field]; setErrors(newErrors);
        }
    };

    // --- ACTIONS ---
    const handleApprove = async (eventId) => {
        try {
            await axios.put(`http://127.0.0.1:8000/admin/approve_event/${eventId}`, {}, { headers });
            showToast("Event approved successfully!", "success");
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.detail || "Failed to approve event.", "error");
        }
    };

    const handleRejectSubmit = async () => {
        if (!rejectReason.trim()) return showToast("Please provide a rejection reason.", "error");
        try {
            await axios.put(`http://127.0.0.1:8000/admin/reject_event/${selectedEventId}`, { reason: rejectReason }, { headers });
            showToast("Event rejected.", "success");
            setIsRejectModalOpen(false);
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.detail || "Failed to reject event.", "error");
        }
    };

    const confirmCancelEvent = async () => {
        try {
            await axios.patch(`http://127.0.0.1:8000/events/cancel/${cancelModal.eventId}`, {}, { headers });
            showToast("Event has been cancelled.", "success");
            setCancelModal({ isOpen: false, eventId: null });
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.detail || "Failed to cancel event.", "error");
            setCancelModal({ isOpen: false, eventId: null });
        }
    };

    // --- CREATE VENUE ---
    const handleCreateVenue = async (e) => {
        e.preventDefault();
        let hasErrors = false;
        let newErrors = { venue: {} };

        const nameErr = validateText(venueForm.name, 3, 50, "Venue Name");
        if (nameErr) { newErrors.venue.name = nameErr; hasErrors = true; }

        const cityErr = validateText(venueForm.city, 2, 50, "City");
        if (cityErr) { newErrors.venue.city = cityErr; hasErrors = true; }

        if (!venueForm.capacity || parseInt(venueForm.capacity, 10) < 1) {
            newErrors.venue.capacity = "Must be at least 1."; hasErrors = true;
        }

        if (hasErrors) {
            setErrors({ ...errors, venue: newErrors.venue });
            showToast("Please fix the errors in the venue form.", "error");
            return;
        }

        try {
            const payload = {
                name: venueForm.name.trim().replace(/\s+/g, ' '),
                city: venueForm.city.trim().replace(/\s+/g, ' '),
                total_capacity: parseInt(venueForm.capacity, 10) 
            };
            await axios.post("http://127.0.0.1:8000/admin/create_venue", payload, { headers });
            
            setVenueForm({ name: "", city: "", capacity: "" }); 
            setSuccessModal({ isOpen: true, title: "Venue Created!", text: "The venue has been successfully added to the database." });
            setTimeout(() => setSuccessModal({ isOpen: false, title: "", text: "" }), 2500);
            
        } catch (error) {
            const errorDetail = error.response?.data?.detail;
            showToast(Array.isArray(errorDetail) ? "Validation Error" : (errorDetail || "Failed to create venue."), "error");
        }
    };

    // --- CREATE EVENT (ADMIN OVERRIDE) ---
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        
        let hasErrors = false;
        let newErrors = { schedules: {}, tiers: {}, event: {} };

        const titleErr = validateText(eventForm.title, 3, 100, "Title");
        if (titleErr) { newErrors.event.title = titleErr; hasErrors = true; }

        const descErr = validateText(eventForm.description, 10, 2000, "Description");
        if (descErr) { newErrors.event.description = descErr; hasErrors = true; }

        if (!eventForm.venue_id) { newErrors.event.venue = "Please select a venue."; hasErrors = true; }
        if (schedules.length === 0) { showToast("You must create at least one schedule.", "error"); return; }
        if (tiers.length === 0) { showToast("You must create at least one ticket tier.", "error"); return; }

        schedules.forEach((sch, i) => {
            let schErr = {};
            const nameErr = validateText(sch.schedule_name, 2, 50, "Name");
            if (nameErr) schErr.schedule_name = nameErr;
            if (!sch.start_time) schErr.start_time = "Required.";
            if (!sch.end_time) schErr.end_time = "Required.";
            if (sch.start_time && sch.end_time && new Date(sch.end_time) <= new Date(sch.start_time)) {
                schErr.end_time = "End time must be after start time.";
            }
            if (Object.keys(schErr).length > 0) { newErrors.schedules[i] = schErr; hasErrors = true; }
        });

        tiers.forEach((t, i) => {
            let tErr = {};
            const tNameErr = validateText(t.tier_name, 2, 50, "Name");
            if (tNameErr) tErr.tier_name = tNameErr;
            if (t.price === "" || parseFloat(t.price) < 0) tErr.price = "Invalid price.";
            if (t.available_quantity === "" || parseInt(t.available_quantity, 10) < 1) tErr.available_quantity = "Must be at least 1.";
            if (Object.keys(tErr).length > 0) { newErrors.tiers[i] = tErr; hasErrors = true; }
        });

        if (hasErrors) {
            setErrors({ ...errors, ...newErrors });
            showToast("Please fix the highlighted errors.", "error");
            return;
        }

        try {
            const payload = {
                title: eventForm.title.trim().replace(/\s+/g, ' '),
                description: eventForm.description.trim().replace(/\s+/g, ' '),
                venue_id: parseInt(eventForm.venue_id, 10),
                schedules: schedules.map(sch => ({
                    schedule_name: sch.schedule_name.trim().replace(/\s+/g, ' '),
                    start_time: sch.start_time,
                    end_time: sch.end_time
                })),
                tiers: tiers.map(tier => ({
                    tier_name: tier.tier_name.trim().replace(/\s+/g, ' '),
                    current_price: parseFloat(tier.price),
                    available_quantity: parseInt(tier.available_quantity, 10)
                }))
            };
            
            await axios.post("http://127.0.0.1:8000/events/create_event", payload, { headers });
            
            setEventForm({ title: "", description: "", venue_id: "" });
            setSchedules([{ schedule_name: "Main Event", start_time: "", end_time: "" }]);
            setTiers([{ tier_name: "General Admission", price: "", available_quantity: "" }]);
            setVenueSearchTerm(""); 
            
            setSuccessModal({ isOpen: true, title: "Event Published!", text: "Admin override successful. The event is now live on the platform." });
            setTimeout(() => {
                setSuccessModal({ isOpen: false, title: "", text: "" });
                setActiveTab("all"); 
                fetchData();
            }, 2500);

        } catch (error) {
            showToast(error.response?.data?.detail || "Failed to create event.", "error");
        }
    };

    const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
    const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const blanksArray = Array.from({length: firstDay}, (_, i) => i);

    return (
        <div className="bg-[#F4F5F9] min-h-screen flex flex-col lg:flex-row font-['Lato'] w-full relative">
            
            <style>{`
                .custom-select { background-image: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
            `}</style>

            {/* --- 🚨 SLEEK TOAST NOTIFICATION 🚨 --- */}
            <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 transform ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                <div className={`${toast.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-[#6E39CB] border-purple-500'} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border font-bold`}>
                    {toast.type === 'error' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" /></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" /></svg>
                    )}
                    {toast.text}
                </div>
            </div>

            {/* --- 🚨 GORGEOUS SUCCESS MODAL 🚨 --- */}
            {successModal.isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-[scale-up_0.3s_ease-out]">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">{successModal.title}</h2>
                        <p className="text-gray-500 font-medium mb-6">{successModal.text}</p>
                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            )}

            {/* --- 🚨 DANGER CANCEL MODAL 🚨 --- */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-red-100">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Force Cancel Event?</h2>
                        <p className="text-gray-500 font-medium mb-6">Are you absolutely sure you want to cancel this event? This action cannot be undone and will affect all registered ticket holders.</p>
                        <div className="flex justify-end gap-3 w-full">
                            <button onClick={() => setCancelModal({ isOpen: false, eventId: null })} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors w-full sm:w-auto">Keep Event</button>
                            <button onClick={confirmCancelEvent} className="px-5 py-2.5 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-md w-full sm:w-auto">Yes, Cancel It</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- REJECTION MODAL --- */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-100">
                        <h3 className="font-black text-2xl text-gray-900 mb-2">Reject Event</h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">Please provide a reason. This will be sent to the organizer.</p>
                        <textarea 
                            className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-red-500 outline-none resize-none h-32 mb-6 bg-gray-50 transition-all font-medium"
                            placeholder="e.g., Missing image, violates TOS..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        ></textarea>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsRejectModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors w-full sm:w-auto">Cancel</button>
                            <button onClick={handleRejectSubmit} className="px-5 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md w-full sm:w-auto">Confirm Rejection</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODERN TYPEABLE DATE PICKER MODAL --- */}
            {pickerConfig.isOpen && (
                <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPickerConfig({ isOpen: false, index: null, field: null })}>
                    <div className="bg-white rounded-[2rem] p-6 w-full max-w-[340px] shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="p-2 hover:bg-purple-50 rounded-full text-[#6E39CB] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg></button>
                            <h3 className="font-bold text-lg text-gray-800">{calDate.toLocaleString('default', { month: 'long' })} {calDate.getFullYear()}</h3>
                            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="p-2 hover:bg-purple-50 rounded-full text-[#6E39CB] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-[10px] font-black text-gray-400 uppercase tracking-widest py-1">{d}</div>)}
                            {blanksArray.map(b => <div key={`blank-${b}`} className="w-10 h-10"></div>)}
                            {daysArray.map(d => {
                                const isSelected = selDate.getDate() === d && selDate.getMonth() === calDate.getMonth() && selDate.getFullYear() === calDate.getFullYear();
                                return (
                                    <button 
                                        key={d} 
                                        onClick={() => setSelDate(new Date(calDate.getFullYear(), calDate.getMonth(), d))}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mx-auto transition-all ${isSelected ? 'bg-[#6E39CB] text-white shadow-md scale-110' : 'text-gray-700 hover:bg-purple-50'}`}
                                    >
                                        {d}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex justify-center items-center gap-2 pt-6 border-t border-gray-100 mt-4">
                            <input type="text" inputMode="numeric" value={timeConfig.h} onChange={handleHourChange} onBlur={handleHourBlur} className="w-14 bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#6E39CB] text-center text-lg transition-all" placeholder="12" />
                            <span className="font-bold text-gray-400 text-xl">:</span>
                            <input type="text" inputMode="numeric" value={timeConfig.m} onChange={handleMinuteChange} onBlur={handleMinuteBlur} className="w-14 bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#6E39CB] text-center text-lg transition-all" placeholder="00" />
                            <button type="button" onClick={toggleAmPm} className="w-16 bg-purple-50 text-[#6E39CB] border border-purple-100 font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#6E39CB] text-center transition-colors ml-2 hover:bg-purple-100">{timeConfig.ampm}</button>
                        </div>
                        <button onClick={saveCustomDate} className="w-full mt-6 bg-[#6E39CB] text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-[#5a2ca0] transition-colors">Confirm Date & Time</button>
                    </div>
                </div>
            )}

            {/* Sticky Sidebar Wrapper */}
            <div className="lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
                <Sidebar />
            </div>

            <div className="flex-1 p-4 pt-16 md:p-8 lg:p-12 w-full max-w-full">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#6E39CB] shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                        </svg>
                        <div>
                            <h1 className="font-['bebas-neue'] font-bold text-3xl md:text-4xl text-[#2D2D2D] tracking-wide uppercase leading-none pt-1">Event Operations</h1>
                            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 md:mt-2">Manage inventory, venues, and approvals</p>
                        </div>
                    </div>
                </div>

                {/* --- TABS --- */}
                <div className="flex gap-4 border-b border-gray-200 mb-6 md:mb-8 overflow-x-auto custom-scrollbar pb-1 w-full">
                    <button onClick={() => setActiveTab("pending")} className={`pb-3 px-2 font-bold text-sm tracking-wide uppercase transition-colors relative whitespace-nowrap shrink-0 ${activeTab === "pending" ? "text-[#6E39CB]" : "text-gray-400 hover:text-gray-600"}`}>
                        Pending Approvals
                        {activeTab === "pending" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6E39CB] rounded-t-full"></div>}
                        {pendingEvents.length > 0 && activeTab !== "pending" && <span className="absolute top-0 -right-2 md:-right-4 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
                    </button>
                    <button onClick={() => setActiveTab("all")} className={`pb-3 px-2 font-bold text-sm tracking-wide uppercase transition-colors relative whitespace-nowrap shrink-0 ${activeTab === "all" ? "text-[#6E39CB]" : "text-gray-400 hover:text-gray-600"}`}>
                        Master Event List
                        {activeTab === "all" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6E39CB] rounded-t-full"></div>}
                    </button>
                    <button onClick={() => setActiveTab("create")} className={`pb-3 px-2 font-bold text-sm tracking-wide uppercase transition-colors relative whitespace-nowrap shrink-0 ${activeTab === "create" ? "text-[#6E39CB]" : "text-gray-400 hover:text-gray-600"}`}>
                        Create Event
                        {activeTab === "create" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6E39CB] rounded-t-full"></div>}
                    </button>
                    <button onClick={() => setActiveTab("venues")} className={`pb-3 px-2 font-bold text-sm tracking-wide uppercase transition-colors relative whitespace-nowrap shrink-0 ${activeTab === "venues" ? "text-[#6E39CB]" : "text-gray-400 hover:text-gray-600"}`}>
                        Manage Venues
                        {activeTab === "venues" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#6E39CB] rounded-t-full"></div>}
                    </button>
                </div>

                {/* --- TAB 1: PENDING APPROVALS --- */}
                {activeTab === "pending" && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px] w-full">
                        {loading ? (
                            <div className="p-12 mt-10">
                                <LoadingSpinner message="Scanning Queues..." size="small" />
                            </div>
                        ) : pendingEvents.length === 0 ? (
                            <div className="p-12 md:p-16 text-center mt-10">
                                <div className="text-4xl md:text-5xl mb-4">🎉</div>
                                <h3 className="text-gray-800 font-bold text-lg md:text-xl mb-1">Queue is empty!</h3>
                                <p className="text-gray-400 text-xs md:text-sm font-medium">No events are waiting for your approval right now.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full custom-scrollbar">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="py-4 px-6 text-gray-500 text-[10px] font-black uppercase tracking-widest">Event Info</th>
                                            <th className="py-4 px-6 text-gray-500 text-[10px] font-black uppercase tracking-widest">Venue & Date</th>
                                            <th className="py-4 px-6 text-gray-500 text-[10px] font-black uppercase tracking-widest text-right">Review</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingEvents.map(event => (
                                            <tr key={event.event_id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-sm text-gray-900 truncate max-w-[200px] md:max-w-[300px]">{event.title}</p>
                                                    <p className="text-[10px] text-[#6E39CB] font-bold mt-0.5">Org ID: #{event.organizer_id}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-xs text-gray-700 font-bold truncate max-w-[200px] md:max-w-none">{event.venue_name}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Event ID: {event.event_id}</p>
                                                </td>
                                                <td className="py-4 px-6 flex justify-end gap-3">
                                                    <button onClick={() => handleApprove(event.event_id)} className="bg-green-50 text-green-600 hover:bg-green-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm">Approve</button>
                                                    <button onClick={() => { setSelectedEventId(event.event_id); setRejectReason(""); setIsRejectModalOpen(true); }} className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all shadow-sm">Reject</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB 2: MASTER EVENT LIST --- */}
                {activeTab === "all" && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px] w-full">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50">
                            <h3 className="font-black text-gray-800 text-lg">All Platform Events</h3>
                            <div className="relative w-full sm:w-72">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                                <input type="text" placeholder="Search event title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#6E39CB] outline-none shadow-sm transition-all focus:border-transparent" />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center p-12 mt-10">
                                <LoadingSpinner message="Loading Master List..." size="small" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full custom-scrollbar">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="bg-white border-b border-gray-100">
                                        <tr>
                                            <th className="py-4 px-6 text-gray-400 text-[10px] font-black uppercase tracking-widest">Event</th>
                                            <th className="py-4 px-6 text-gray-400 text-[10px] font-black uppercase tracking-widest">Status</th>
                                            <th className="py-4 px-6 text-gray-400 text-[10px] font-black uppercase tracking-widest text-right">Emergency Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {allEvents.filter(e => e.title?.toLowerCase().includes(searchTerm.toLowerCase())).map(event => (
                                            <tr key={event.event_id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="font-bold text-sm text-gray-900 truncate max-w-[200px] md:max-w-[300px]">{event.title}</p>
                                                    <p className="text-[10px] font-medium text-gray-500 truncate max-w-[200px] md:max-w-none mt-0.5">{event.venue_name}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap ${
                                                        event.status === "Approved" ? "bg-green-50 text-green-600 border border-green-100" : 
                                                        event.status === "Pending" ? "bg-yellow-50 text-yellow-600 border border-yellow-100" :
                                                        "bg-red-50 text-red-600 border border-red-100"
                                                    }`}>
                                                        {event.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {event.status === "Approved" && (
                                                        <button 
                                                            onClick={() => setCancelModal({ isOpen: true, eventId: event.event_id })}
                                                            className="text-red-600 bg-red-50 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm whitespace-nowrap"
                                                        >
                                                            Force Cancel
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* --- TAB 3: CREATE EVENT (ADMIN OVERRIDE) --- */}
                {activeTab === "create" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full">
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 w-full">
                            <h3 className="font-black text-xl text-gray-900 mb-2">Publish Platform Event</h3>
                            <p className="text-xs font-medium text-gray-500 mb-8">Events created by an Admin bypass the approval queue and go live instantly.</p>
                            
                            <form onSubmit={handleCreateEvent} className="space-y-7">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5 w-full">
                                    <div className="md:col-span-2 relative">
                                        <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Event Title</label>
                                        <input type="text" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${errors.event?.title ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`} value={eventForm.title} onChange={e => { setEventForm({...eventForm, title: e.target.value}); if(errors.event?.title) setErrors({...errors, event: {...errors.event, title: null}}); }} />
                                        {errors.event?.title && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 font-medium">{errors.event.title}</p>}
                                    </div>
                                    <div className="md:col-span-2 relative">
                                        <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Description</label>
                                        <textarea rows="3" className={`w-full border rounded-xl p-4 text-sm focus:outline-none resize-none transition-all ${errors.event?.description ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`} value={eventForm.description} onChange={e => { setEventForm({...eventForm, description: e.target.value}); if(errors.event?.description) setErrors({...errors, event: {...errors.event, description: null}}); }}></textarea>
                                        {errors.event?.description && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 font-medium">{errors.event.description}</p>}
                                    </div>
                                    <div className="md:col-span-2 relative w-full">
                                        <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Venue Selection</label>
                                        <input type="text" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all shadow-sm ${errors.event?.venue ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`} placeholder="Search by venue name or city..." value={venueSearchTerm} onChange={(e) => { setVenueSearchTerm(e.target.value); setIsVenueDropdownOpen(true); setEventForm({...eventForm, venue_id: ""}); if(errors.event?.venue) setErrors({...errors, event: {...errors.event, venue: null}}); }} onFocus={() => setIsVenueDropdownOpen(true)} />
                                        {errors.event?.venue && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 font-medium">{errors.event.venue}</p>}
                                        {isVenueDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsVenueDropdownOpen(false)}></div>}
                                        {isVenueDropdownOpen && (
                                            <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                                {venues.filter(v => v.name.toLowerCase().includes(venueSearchTerm.toLowerCase()) || v.city.toLowerCase().includes(venueSearchTerm.toLowerCase())).length === 0 ? (
                                                    <div className="p-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">No venues found</div>
                                                ) : (
                                                    venues.filter(v => v.name.toLowerCase().includes(venueSearchTerm.toLowerCase()) || v.city.toLowerCase().includes(venueSearchTerm.toLowerCase())).map(v => (
                                                        <div key={v.venue_id} className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors" onClick={() => { setEventForm({...eventForm, venue_id: v.venue_id}); setVenueSearchTerm(`${v.name} (${v.city})`); setIsVenueDropdownOpen(false); if(errors.event?.venue) setErrors({...errors, event: {...errors.event, venue: null}}); }}>
                                                            <p className="font-bold text-sm text-gray-800">{v.name}</p>
                                                            <p className="text-[10px] text-[#6E39CB] font-black uppercase tracking-wider mt-0.5">{v.city} • Cap: {v.total_capacity}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* SCHEDULES */}
                                    <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100 w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-black text-[#6E39CB] uppercase tracking-wider">Event Schedules</h4>
                                            <button type="button" onClick={handleAddSchedule} className="text-[10px] md:text-xs font-bold text-[#6E39CB] bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">+ Add Schedule</button>
                                        </div>
                                        <div className="space-y-6 md:space-y-4">
                                            {schedules.map((schedule, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-y-6 gap-x-4 items-end bg-gray-50 p-4 pt-5 pb-6 md:pb-4 rounded-xl relative group border border-gray-100 w-full">
                                                    {schedules.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveSchedule(index)} className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 rounded-full w-8 h-8 flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm hover:bg-red-50 z-10" title="Remove Schedule">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                    <div className="md:col-span-4 relative">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Schedule Name</label>
                                                        <input type="text" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.schedules[index]?.schedule_name ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`} placeholder="e.g. Day 1, Main Show" value={schedule.schedule_name} onChange={e => handleScheduleChange(index, 'schedule_name', e.target.value)} />
                                                        {errors.schedules[index]?.schedule_name && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.schedules[index].schedule_name}</p>}
                                                    </div>
                                                    <div className="md:col-span-4 relative">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Start Time</label>
                                                        <button type="button" onClick={() => openDatePicker(index, 'start_time', schedule.start_time)} className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left transition-all ${errors.schedules[index]?.start_time ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-500' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white text-gray-700 hover:bg-gray-100'}`}>
                                                            <span className={schedule.start_time ? "font-bold text-[#6E39CB]" : "font-medium text-gray-400"}>{formatDateForDisplay(schedule.start_time)}</span>
                                                        </button>
                                                        {errors.schedules[index]?.start_time && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.schedules[index].start_time}</p>}
                                                    </div>
                                                    <div className="md:col-span-4 relative">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">End Time</label>
                                                        <button type="button" onClick={() => openDatePicker(index, 'end_time', schedule.end_time)} className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left transition-all ${errors.schedules[index]?.end_time ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-500' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white text-gray-700 hover:bg-gray-100'}`}>
                                                            <span className={schedule.end_time ? "font-bold text-[#6E39CB]" : "font-medium text-gray-400"}>{formatDateForDisplay(schedule.end_time)}</span>
                                                        </button>
                                                        {errors.schedules[index]?.end_time && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.schedules[index].end_time}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* TIERS */}
                                    <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100 w-full">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-sm font-black text-[#6E39CB] uppercase tracking-wider">Ticket Tiers</h4>
                                            <button type="button" onClick={handleAddTier} className="text-[10px] md:text-xs font-bold text-[#6E39CB] bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">+ Add Tier</button>
                                        </div>
                                        <div className="space-y-6 md:space-y-4">
                                            {tiers.map((tier, index) => (
                                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-y-6 gap-x-4 items-end bg-gray-50 p-4 pt-5 pb-6 md:pb-4 rounded-xl relative group border border-gray-100 w-full">
                                                    {tiers.length > 1 && (
                                                        <button type="button" onClick={() => handleRemoveTier(index)} className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 rounded-full w-8 h-8 flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm hover:bg-red-50 z-10" title="Remove Tier">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                    <div className="md:col-span-5 relative">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tier Name</label>
                                                        <input type="text" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.tiers[index]?.tier_name ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`} placeholder="e.g. VIP" value={tier.tier_name} onChange={e => handleTierChange(index, 'tier_name', e.target.value)} />
                                                        {errors.tiers[index]?.tier_name && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.tiers[index].tier_name}</p>}
                                                    </div>
                                                    <div className="md:col-span-3 relative">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Price ($)</label>
                                                        <input type="number" step="0.01" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.tiers[index]?.price ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`} placeholder="0.00" value={tier.price} onChange={e => handleTierChange(index, 'price', e.target.value)} />
                                                        {errors.tiers[index]?.price && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.tiers[index].price}</p>}
                                                    </div>
                                                    <div className="md:col-span-4 relative">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Quantity</label>
                                                        <input type="number" className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.tiers[index]?.available_quantity ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`} placeholder="100" value={tier.available_quantity} onChange={e => handleTierChange(index, 'available_quantity', e.target.value)} />
                                                        {errors.tiers[index]?.available_quantity && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.tiers[index].available_quantity}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#6E39CB] text-white font-bold rounded-xl px-4 py-4 hover:bg-[#5a2ca0] transition-colors shadow-md mt-6">Publish Event Instantly</button>
                            </form>
                        </div>
                        
                        <div className="lg:col-span-1 w-full hidden lg:block">
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-8">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 border border-purple-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-[#6E39CB]"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
                                </div>
                                <h3 className="font-bold text-xl text-gray-800 mb-2">Admin Override</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-6">As an admin, you bypass the standard approval queue. Events created here will be immediately visible to the public.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 4: MANAGE VENUES --- */}
                {activeTab === "venues" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 w-full">
                            <h3 className="font-black text-xl text-gray-900 mb-2">Create New Venue</h3>
                            <p className="text-xs font-medium text-gray-500 mb-8">Add a certified venue to the database so organizers can select it when creating events.</p>
                            
                            <form onSubmit={handleCreateVenue} className="space-y-6 md:space-y-7">
                                <div className="relative">
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Venue Name</label>
                                    <input type="text" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${errors.venue?.name ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`} value={venueForm.name} onChange={e => { setVenueForm({...venueForm, name: e.target.value}); if(errors.venue?.name) setErrors({...errors, venue: {...errors.venue, name: null}}); }} />
                                    {errors.venue?.name && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 font-medium">{errors.venue.name}</p>}
                                </div>
                                <div className="relative">
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">City</label>
                                    <input type="text" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${errors.venue?.city ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`} value={venueForm.city} onChange={e => { setVenueForm({...venueForm, city: e.target.value}); if(errors.venue?.city) setErrors({...errors, venue: {...errors.venue, city: null}}); }} />
                                    {errors.venue?.city && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 font-medium">{errors.venue.city}</p>}
                                </div>
                                <div className="relative">
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Maximum Capacity</label>
                                    <input type="number" min="1" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all ${errors.venue?.capacity ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`} value={venueForm.capacity} onChange={e => { setVenueForm({...venueForm, capacity: e.target.value}); if(errors.venue?.capacity) setErrors({...errors, venue: {...errors.venue, capacity: null}}); }} />
                                    {errors.venue?.capacity && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1 font-medium">{errors.venue.capacity}</p>}
                                </div>
                                <button type="submit" className="w-full bg-[#6E39CB] text-white font-bold rounded-xl px-4 py-4 hover:bg-[#5a2ca0] transition-colors shadow-md mt-6">Add Venue to Database</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ManageEvents;