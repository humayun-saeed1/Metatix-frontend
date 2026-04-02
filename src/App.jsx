import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import axios from "axios";
import Login from "./components/login";
import Signup from "./components/signup";
import Footer from "./components/footer"; 
import LandingPage from "./components/landing page";
import BookingPage from "./components/pages/client/booking page";
import ProtectedRoute from "./components/sharedcomps/protectedroutes";
import Profile from "./components/pages/client/profile";
import Cart from "./components/pages/client/checkout";
import MyTickets from "./components/pages/client/my_tickets";
import AdminDashboard from "./components/pages/admin/admin-dashboard";
import ManageUsers from "./components/pages/admin/manageuser";
import ManageEvents from "./components/pages/admin/manageevents";
import OperationsDashboard from "./components/pages/admin/OperationDashboard";
import OrganizerDashboard from "./components/pages/organizer/organiser-dashboard";
import OrgProfile from "./components/pages/organizer/profile"
import CreateEvent from "./components/pages/organizer/createevent";
import MyEvents from "./components/pages/organizer/event";
import ScanTickets from "./components/pages/organizer/qrscanner";
import LoginSuccess from "./components/sharedcomps/login-success";
import ResetPassword from "./components/resetPassword";

// 🚨 GLOBAL AXIOS INTERCEPTOR 🚨
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_role"); 
            window.location.href = "/login"; 
        }
        return Promise.reject(error);
    }
);

// 🛠️ FOOTER LOGIC COMPONENT
// This component checks the URL and decides whether to show the footer
function Layout({ children }) {
    const location = useLocation();
    // Checks if the user is exactly on the root path
    const isLandingPage = location.pathname === "/";

    return (
        <div className="flex flex-col min-h-screen">
            <main className="grow">
                {children}
            </main>
            {/* Renders the footer ONLY if isLandingPage is true */}
            {isLandingPage && <Footer />}
        </div>
    );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login-success" element={<LoginSuccess />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* 🟢 CLIENT ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["Customer"]} />}>
                <Route path="/BookingPage" element={<BookingPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/checkout" element={<Cart />} />
                <Route path="/mytickets" element={<MyTickets />} />
            </Route>

            {/* 🔵 ORGANIZER ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["Organizer"]} />}>
                <Route path="/organizer-dashboard" element={<OrganizerDashboard />} /> 
                <Route path="/organizer/profile" element={<OrgProfile />} /> 
                <Route path="/organizer/create" element={<CreateEvent />} /> 
                <Route path="/organizer/events" element={<MyEvents />} /> 
                <Route path="/organizer/scan" element={<ScanTickets />} /> 
            </Route>

            {/* 🔴 ADMIN ROUTES */}
            <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
                 <Route path="/admin-dashboard" element={<AdminDashboard />} /> 
                 <Route path="admin/users" element={<ManageUsers />} /> 
                 <Route path="admin/events" element={<ManageEvents />} /> 
                 <Route path="admin/logs" element={<OperationsDashboard />} /> 
            </Route>
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;