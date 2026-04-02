import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../sidenav"; 

function CreateEvent() {
    const [venues, setVenues] = useState([]); 
    
    // Form States
    const [eventForm, setEventForm] = useState({
        title: "", description: "", venue_id: ""
    });
    
    const [schedules, setSchedules] = useState([
        { schedule_name: "Main Event", start_time: "", end_time: "" }
    ]);

    const [tiers, setTiers] = useState([
        { tier_name: "General Admission", price: "", available_quantity: "" }
    ]);

    const [venueSearchTerm, setVenueSearchTerm] = useState("");
    const [isVenueDropdownOpen, setIsVenueDropdownOpen] = useState(false);
    
    const [errors, setErrors] = useState({ schedules: {}, tiers: {} });
    
    // Sleek Modals & Toasts
    const [toast, setToast] = useState({ visible: false, text: "" });
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Custom Date Picker State
    const [pickerConfig, setPickerConfig] = useState({ isOpen: false, index: null, field: null });
    const [calDate, setCalDate] = useState(new Date());
    const [selDate, setSelDate] = useState(new Date());
    const [timeConfig, setTimeConfig] = useState({ h: '12', m: '00', ampm: 'PM' });

    const token = localStorage.getItem("access_token");
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const res = await axios.get("http://127.0.0.1:8000/events/venues", { headers }); 
                setVenues(res.data);
            } catch (error) {
                console.error("🚨 Failed to fetch venues:", error);
            }
        };
        if (token) fetchVenues();
    }, [token]);

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
            if (word.length > 25) return `${fieldName} contains a word that is too long (${word.substring(0, 10)}...).`;
            if (word.length > 4 && !/[aeiouy]/i.test(word)) return `Please enter real words. Missing vowels in ${fieldName}.`;

            if (word.length > 6) {
                const uniqueChars = new Set(word.toLowerCase().split('')).size;
                if (uniqueChars < 4) return `Invalid word structure found in ${fieldName}.`;
            }
        }

        const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
        if (lettersOnly.length > 20) {
            const vowels = (lettersOnly.match(/[aeiouy]/gi) || []).length;
            const ratio = vowels / lettersOnly.length;
            if (ratio < 0.15) return `${fieldName} does not look like real English sentences.`;
        }

        return null; 
    };

    const showToast = (message) => {
        setToast({ visible: true, text: message });
        setTimeout(() => setToast({ visible: false, text: "" }), 4000);
    };

    const handleAddSchedule = () => setSchedules([...schedules, { schedule_name: "", start_time: "", end_time: "" }]);
    const handleRemoveSchedule = (index) => {
        setSchedules(schedules.filter((_, i) => i !== index));
        const newSchErrors = { ...errors.schedules };
        delete newSchErrors[index];
        setErrors({ ...errors, schedules: newSchErrors });
    };
    
    const handleScheduleChange = (index, field, value) => {
        const newSchedules = [...schedules];
        newSchedules[index][field] = value;
        setSchedules(newSchedules);
        if (errors.schedules?.[index]?.[field]) {
            const newErrors = { ...errors };
            delete newErrors.schedules[index][field];
            setErrors(newErrors);
        }
    };

    const handleAddTier = () => setTiers([...tiers, { tier_name: "", price: "", available_quantity: "" }]);
    const handleRemoveTier = (index) => {
        setTiers(tiers.filter((_, i) => i !== index));
        const newTierErrors = { ...errors.tiers };
        delete newTierErrors[index];
        setErrors({ ...errors, tiers: newTierErrors });
    };

    const handleTierChange = (index, field, value) => {
        const newTiers = [...tiers];
        newTiers[index][field] = value;
        setTiers(newTiers);
        if (errors.tiers?.[index]?.[field]) {
            const newErrors = { ...errors };
            delete newErrors.tiers[index][field];
            setErrors(newErrors);
        }
    };

    // --- CUSTOM DATE & TYPEABLE TIME PICKER LOGIC ---
    const openDatePicker = (index, field, currentValue) => {
        if (currentValue) {
            const d = new Date(currentValue);
            setSelDate(d);
            setCalDate(d);
            let hours = d.getHours();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; 
            setTimeConfig({
                h: hours.toString().padStart(2, '0'),
                m: d.getMinutes().toString().padStart(2, '0'),
                ampm: ampm
            });
        } else {
            const now = new Date();
            setSelDate(now);
            setCalDate(now);
        }
        setPickerConfig({ isOpen: true, index, field });
    };

    // Typeable Time Handlers
    const handleHourChange = (e) => {
        let val = e.target.value.replace(/\D/g, ''); // Digits only
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

    const toggleAmPm = () => {
        setTimeConfig({ ...timeConfig, ampm: timeConfig.ampm === 'AM' ? 'PM' : 'AM' });
    };

    const saveCustomDate = () => {
        // Ensure values are properly padded before saving just in case they didn't blur
        let finalH = parseInt(timeConfig.h, 10) || 12;
        let finalM = parseInt(timeConfig.m, 10) || 0;
        
        if (finalH > 12) finalH = 12;
        if (finalM > 59) finalM = 59;

        if (timeConfig.ampm === 'PM' && finalH < 12) finalH += 12;
        if (timeConfig.ampm === 'AM' && finalH === 12) finalH = 0;
        
        const finalDate = new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), finalH, finalM);
        
        handleScheduleChange(pickerConfig.index, pickerConfig.field, finalDate.toISOString());
        setPickerConfig({ isOpen: false, index: null, field: null });
    };

    const formatDateForDisplay = (isoString) => {
        if (!isoString) return "Select Date & Time";
        const d = new Date(isoString);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- SUBMIT EVENT ---
    const handleCreateEvent = async (e) => {
        e.preventDefault();
        
        let hasErrors = false;
        let newErrors = { schedules: {}, tiers: {} };

        const titleErr = validateText(eventForm.title, 3, 100, "Title");
        if (titleErr) { newErrors.title = titleErr; hasErrors = true; }

        const descErr = validateText(eventForm.description, 10, 2000, "Description");
        if (descErr) { newErrors.description = descErr; hasErrors = true; }

        if (!eventForm.venue_id) { newErrors.venue = "Please select a venue from the list."; hasErrors = true; }
        if (schedules.length === 0) { showToast("You must create at least one schedule."); return; }
        if (tiers.length === 0) { showToast("You must create at least one ticket tier."); return; }

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
            setErrors(newErrors);
            showToast("Please fix the highlighted errors in the form.");
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
            
            setShowSuccessModal(true);
            setTimeout(() => { window.location.href = "/organizer-dashboard"; }, 2500);

        } catch (error) {
            const errorDetail = error.response?.data?.detail;
            if (Array.isArray(errorDetail)) {
                showToast("Validation Error. Please check your inputs.");
            } else {
                showToast(errorDetail || "Failed to submit event. Please try again.");
            }
        }
    };

    // Calendar Math
    const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
    const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);
    const blanksArray = Array.from({length: firstDay}, (_, i) => i);

    return (
        <div className="bg-[#F4F5F9] min-h-screen flex flex-col lg:flex-row font-['Lato'] w-full relative">
            
            {/* --- SLEEK ERROR TOAST --- */}
            <div className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${toast.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                <div className="bg-red-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-500 font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" /></svg>
                    {toast.text}
                </div>
            </div>

            {/* --- GORGEOUS SUCCESS MODAL --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full flex flex-col items-center text-center shadow-2xl animate-[scale-up_0.3s_ease-out]">
                        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Event Created!</h2>
                        <p className="text-gray-500 font-medium mb-6">Your event has been submitted and is pending review. Redirecting to your dashboard...</p>
                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            )}

            {/* --- MODERN TYPEABLE DATE PICKER MODAL --- */}
            {pickerConfig.isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setPickerConfig({ isOpen: false, index: null, field: null })}>
                    <div className="bg-white rounded-[2rem] p-6 w-full max-w-[340px] shadow-2xl" onClick={e => e.stopPropagation()}>
                        
                        {/* Month/Year Header */}
                        <div className="flex justify-between items-center mb-6">
                            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1))} className="p-2 hover:bg-purple-50 rounded-full text-[#6E39CB] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg></button>
                            <h3 className="font-bold text-lg text-gray-800">{calDate.toLocaleString('default', { month: 'long' })} {calDate.getFullYear()}</h3>
                            <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1))} className="p-2 hover:bg-purple-50 rounded-full text-[#6E39CB] transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg></button>
                        </div>

                        {/* Calendar Grid */}
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

                        {/* Typeable Time Selectors */}
                        <div className="flex justify-center items-center gap-2 pt-6 border-t border-gray-100 mt-4">
                            <input 
                                type="text" 
                                inputMode="numeric"
                                value={timeConfig.h} 
                                onChange={handleHourChange} 
                                onBlur={handleHourBlur}
                                className="w-14 bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#6E39CB] text-center text-lg transition-all"
                                placeholder="12"
                            />
                            <span className="font-bold text-gray-400 text-xl">:</span>
                            <input 
                                type="text" 
                                inputMode="numeric"
                                value={timeConfig.m} 
                                onChange={handleMinuteChange} 
                                onBlur={handleMinuteBlur}
                                className="w-14 bg-gray-50 border border-gray-200 text-gray-800 font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#6E39CB] text-center text-lg transition-all"
                                placeholder="00"
                            />
                            <button 
                                type="button"
                                onClick={toggleAmPm}
                                className="w-16 bg-purple-50 text-[#6E39CB] border border-purple-100 font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#6E39CB] text-center transition-colors ml-2 hover:bg-purple-100"
                            >
                                {timeConfig.ampm}
                            </button>
                        </div>

                        <button onClick={saveCustomDate} className="w-full mt-6 bg-[#6E39CB] text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-[#5a2ca0] transition-colors">
                            Confirm Date & Time
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
            `}</style>
            
            <div className="lg:sticky lg:top-0 lg:h-screen lg:shrink-0 z-20">
                <Sidebar />
            </div>

            <div className="flex-1 p-4 pt-16 md:p-8 lg:p-12 w-full max-w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 md:w-10 md:h-10 text-[#6E39CB]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2.25m0 0h2.25m-2.25 0H9.75" />
                        </svg>
                        <div>
                            <h1 className="font-['bebas-neue'] font-bold text-3xl md:text-4xl text-[#2D2D2D] tracking-wide uppercase leading-none pt-1">Draft New Event</h1>
                            <p className="text-gray-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-1 md:mt-2">Design an experience for your audience</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full items-start">
                    
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8 w-full">
                        <form onSubmit={handleCreateEvent} className="space-y-7">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-5 w-full">
                                
                                {/* TITLE */}
                                <div className="md:col-span-2 relative">
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Event Title</label>
                                    <input 
                                        type="text" 
                                        className={`w-full border rounded-xl px-4 py-2.5 md:py-3 text-sm focus:outline-none transition-all ${errors.title ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`}
                                        value={eventForm.title} 
                                        onChange={e => { setEventForm({...eventForm, title: e.target.value}); if(errors.title) setErrors({...errors, title: null}); }} 
                                    />
                                    {errors.title && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1">{errors.title}</p>}
                                </div>
                                
                                {/* DESCRIPTION */}
                                <div className="md:col-span-2 relative">
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Description</label>
                                    <textarea 
                                        rows="3" 
                                        className={`w-full border rounded-xl p-4 text-sm focus:outline-none resize-none transition-all ${errors.description ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`}
                                        value={eventForm.description} 
                                        onChange={e => { setEventForm({...eventForm, description: e.target.value}); if(errors.description) setErrors({...errors, description: null}); }}
                                    ></textarea>
                                    {errors.description && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1">{errors.description}</p>}
                                </div>

                                {/* VENUE */}
                                <div className="md:col-span-2 relative">
                                    <label className="block text-[10px] md:text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 md:mb-2">Venue Selection</label>
                                    <input 
                                        type="text" 
                                        className={`w-full border rounded-xl px-4 py-2.5 md:py-3 text-sm focus:outline-none transition-all shadow-sm ${errors.venue ? 'border-red-500 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-gray-50 focus:bg-white'}`}
                                        placeholder="Search by venue name or city..."
                                        value={venueSearchTerm}
                                        onChange={(e) => {
                                            setVenueSearchTerm(e.target.value);
                                            setIsVenueDropdownOpen(true);
                                            setEventForm({...eventForm, venue_id: ""}); 
                                            if(errors.venue) setErrors({...errors, venue: null});
                                        }}
                                        onFocus={() => setIsVenueDropdownOpen(true)}
                                    />
                                    {errors.venue && <p className="text-red-500 text-[11px] absolute -bottom-5 left-1">{errors.venue}</p>}
                                    
                                    {isVenueDropdownOpen && <div className="fixed inset-0 z-10" onClick={() => setIsVenueDropdownOpen(false)}></div>}
                                    {isVenueDropdownOpen && (
                                        <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
                                            {venues.filter(v => v.name.toLowerCase().includes(venueSearchTerm.toLowerCase()) || v.city.toLowerCase().includes(venueSearchTerm.toLowerCase())).length === 0 ? (
                                                <div className="p-4 text-center text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest">No venues found</div>
                                            ) : (
                                                venues.filter(v => v.name.toLowerCase().includes(venueSearchTerm.toLowerCase()) || v.city.toLowerCase().includes(venueSearchTerm.toLowerCase())).map(v => (
                                                    <div key={v.venue_id} className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors" onClick={() => {
                                                        setEventForm({...eventForm, venue_id: v.venue_id});
                                                        setVenueSearchTerm(`${v.name} (${v.city})`);
                                                        setIsVenueDropdownOpen(false);
                                                        if(errors.venue) setErrors({...errors, venue: null});
                                                    }}>
                                                        <p className="font-bold text-sm text-gray-800">{v.name}</p>
                                                        <p className="text-[9px] md:text-[10px] text-[#6E39CB] font-black uppercase tracking-wider mt-0.5">{v.city} • Cap: {v.total_capacity}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* SCHEDULES */}
                                <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100 w-full">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs md:text-sm font-bold text-[#6E39CB] uppercase tracking-wider">Event Schedules</h4>
                                        <button type="button" onClick={handleAddSchedule} className="text-[10px] md:text-xs font-bold text-[#6E39CB] bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">+ Add Schedule</button>
                                    </div>
                                    <div className="space-y-6 md:space-y-4">
                                        {schedules.map((schedule, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-y-6 gap-x-4 items-end bg-gray-50 p-4 pt-5 pb-6 md:pb-4 rounded-xl relative group border border-gray-100 w-full">
                                                {schedules.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveSchedule(index)} className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm hover:bg-red-50 hover:text-red-600 z-10" title="Remove Schedule">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                                <div className="md:col-span-4 relative">
                                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Schedule Name</label>
                                                    <input 
                                                        type="text" 
                                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.schedules[index]?.schedule_name ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`}
                                                        placeholder="e.g. Day 1, Main Show" 
                                                        value={schedule.schedule_name} 
                                                        onChange={e => handleScheduleChange(index, 'schedule_name', e.target.value)} 
                                                    />
                                                    {errors.schedules[index]?.schedule_name && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.schedules[index].schedule_name}</p>}
                                                </div>
                                                
                                                <div className="md:col-span-4 relative">
                                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Start Time</label>
                                                    <button type="button" onClick={() => openDatePicker(index, 'start_time', schedule.start_time)} className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left transition-all ${errors.schedules[index]?.start_time ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-500' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white text-gray-700 hover:bg-gray-100'}`}>
                                                        <span className={schedule.start_time ? "font-bold text-[#6E39CB]" : ""}>{formatDateForDisplay(schedule.start_time)}</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                                    </button>
                                                    {errors.schedules[index]?.start_time && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.schedules[index].start_time}</p>}
                                                </div>
                                                <div className="md:col-span-4 relative">
                                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">End Time</label>
                                                    <button type="button" onClick={() => openDatePicker(index, 'end_time', schedule.end_time)} className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-sm text-left transition-all ${errors.schedules[index]?.end_time ? 'border-red-500 focus:ring-2 focus:ring-red-200 text-red-500' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white text-gray-700 hover:bg-gray-100'}`}>
                                                        <span className={schedule.end_time ? "font-bold text-[#6E39CB]" : ""}>{formatDateForDisplay(schedule.end_time)}</span>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
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
                                        <h4 className="text-xs md:text-sm font-bold text-[#6E39CB] uppercase tracking-wider">Ticket Tiers</h4>
                                        <button type="button" onClick={handleAddTier} className="text-[10px] md:text-xs font-bold text-[#6E39CB] bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors">+ Add Tier</button>
                                    </div>
                                    <div className="space-y-6 md:space-y-4">
                                        {tiers.map((tier, index) => (
                                            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-y-6 gap-x-4 items-end bg-gray-50 p-4 pt-5 pb-6 md:pb-4 rounded-xl relative group border border-gray-100 w-full">
                                                {tiers.length > 1 && (
                                                    <button type="button" onClick={() => handleRemoveTier(index)} className="absolute -top-3 -right-3 bg-white border border-red-200 text-red-500 rounded-full w-7 h-7 md:w-8 md:h-8 flex items-center justify-center md:opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-sm hover:bg-red-50 hover:text-red-600 z-10" title="Remove Tier">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                )}
                                                <div className="md:col-span-5 relative">
                                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Tier Name</label>
                                                    <input 
                                                        type="text" 
                                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.tiers[index]?.tier_name ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`}
                                                        placeholder="e.g. VIP, Early Bird" 
                                                        value={tier.tier_name} 
                                                        onChange={e => handleTierChange(index, 'tier_name', e.target.value)} 
                                                    />
                                                    {errors.tiers[index]?.tier_name && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.tiers[index].tier_name}</p>}
                                                </div>
                                                <div className="md:col-span-3 relative">
                                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Price ($)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.tiers[index]?.price ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`}
                                                        placeholder="0.00" 
                                                        value={tier.price} 
                                                        onChange={e => handleTierChange(index, 'price', e.target.value)} 
                                                    />
                                                    {errors.tiers[index]?.price && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.tiers[index].price}</p>}
                                                </div>
                                                <div className="md:col-span-4 relative">
                                                    <label className="block text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Quantity</label>
                                                    <input 
                                                        type="number" 
                                                        className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all ${errors.tiers[index]?.available_quantity ? 'border-red-500 focus:ring-2 focus:ring-red-200' : 'border-gray-200 focus:ring-2 focus:ring-[#6E39CB] bg-white'}`}
                                                        placeholder="100" 
                                                        value={tier.available_quantity} 
                                                        onChange={e => handleTierChange(index, 'available_quantity', e.target.value)} 
                                                    />
                                                    {errors.tiers[index]?.available_quantity && <p className="text-red-500 text-[10px] absolute -bottom-5 left-1 whitespace-nowrap">{errors.tiers[index].available_quantity}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-[#6E39CB] text-white hover:bg-[#5a2ca0] font-bold rounded-xl px-4 py-4 shadow-[0_8px_30px_rgb(110,57,203,0.3)] hover:shadow-[0_8px_30px_rgb(110,57,203,0.5)] transition-all">
                                Submit Event for Review
                            </button>
                        </form>
                    </div>
                    
                    {/* --- NEXT STEPS CARD --- */}
                    <div className="lg:col-span-1 w-full">
                        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 lg:sticky lg:top-8">
                            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 border border-purple-100">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#6E39CB]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                                </svg>
                            </div>
                            
                            <h3 className="font-bold text-xl text-gray-800 mb-2">What Happens Next?</h3>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                To ensure platform quality and security, all new events go through a brief review cycle.
                            </p>
                            
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-[#6E39CB] text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
                                        <div className="w-px h-full bg-gray-200 my-2"></div>
                                    </div>
                                    <div className="pb-4">
                                        <h4 className="font-bold text-gray-800 text-sm">Submit Draft</h4>
                                        <p className="text-xs text-gray-500 mt-1">Finalize your schedules, tiers, and venue selection.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm shrink-0 border border-gray-200">2</div>
                                        <div className="w-px h-full bg-gray-200 my-2"></div>
                                    </div>
                                    <div className="pb-4">
                                        <h4 className="font-bold text-gray-800 text-sm">Quick Review</h4>
                                        <p className="text-xs text-gray-500 mt-1">Our admin team verifies your event details for compliance.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm shrink-0 border border-gray-200">3</div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">Go Live!</h4>
                                        <p className="text-xs text-gray-500 mt-1">Once approved, your event is published and ticket sales begin.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CreateEvent;