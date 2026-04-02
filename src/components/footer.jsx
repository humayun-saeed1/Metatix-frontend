import { useNavigate } from "react-router-dom";

function Footer() {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#2D2D2D] text-white font-['Lato'] py-10 md:py-12 px-6 md:px-16 lg:px-24">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
                
                {/* Brand Section */}
                <div className="flex flex-col gap-4 sm:col-span-2 md:col-span-1">
                    <h2 className="font-['bebas-neue'] text-4xl tracking-wider text-[#6E39CB]">
                        METATIX
                    </h2>
                    <p className="text-gray-400 text-sm leading-relaxed max-w-full md:max-w-xs">
                        The ultimate destination for secure, transparent, and seamless event ticketing. 
                        Experience the future of live events with our cutting-edge platform.
                    </p>
                    <div className="flex gap-4 mt-2">
                        {/* Instagram */}
                        <div className="group relative w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center hover:bg-[#6E39CB] transition-colors cursor-pointer">
                            <span className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                visit this Instagram
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.822a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                            </svg>
                        </div>
                        {/* X (formerly Twitter) */}
                        <div className="group relative w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center hover:bg-[#6E39CB] transition-colors cursor-pointer">
                            <span className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                visit this X
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                        </div>
                        {/* LinkedIn */}
                        <div className="group relative w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center hover:bg-[#6E39CB] transition-colors cursor-pointer">
                            <span className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                visit this LinkedIn
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-lg text-white">Quick Navigation</h3>
                    <ul className="flex flex-col gap-3 md:gap-2 text-gray-400 text-sm">
                        <li onClick={() => navigate("/")} className="hover:text-[#6E39CB] cursor-pointer transition-colors w-fit">Home</li>
                        <li onClick={() => navigate("/login")} className="hover:text-[#6E39CB] cursor-pointer transition-colors w-fit">My Account</li>
                        <li onClick={() => navigate("/signup")} className="hover:text-[#6E39CB] cursor-pointer transition-colors w-fit">Become an Organizer</li>
                    </ul>
                </div>

                {/* Support & Legal */}
                <div className="flex flex-col gap-4">
                    <h3 className="font-bold text-lg text-white">Support</h3>
                    <ul className="flex flex-col gap-3 md:gap-2 text-gray-400 text-sm">
                        <li className="hover:text-[#6E39CB] cursor-pointer transition-colors w-fit">Help Center</li>
                        <li className="hover:text-[#6E39CB] cursor-pointer transition-colors w-fit">Terms of Service</li>
                        <li className="hover:text-[#6E39CB] cursor-pointer transition-colors w-fit">Privacy Policy</li>
                        <li className="hover:text-[#6E39CB] cursor-pointer transition-colors w-fit">Contact Us</li>
                    </ul>
                </div>

            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto mt-10 md:mt-12 pt-6 md:pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4 text-xs text-gray-500 font-bold uppercase tracking-widest text-center md:text-left">
                <p className="leading-relaxed md:leading-normal">© {currentYear} METATIX TICKETING SOLUTIONS. ALL RIGHTS RESERVED.</p>
                <div className="flex gap-6 justify-center">
                    <span className="hover:text-white cursor-pointer">English (US)</span>
                    <span className="hover:text-white cursor-pointer">USD ($)</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;