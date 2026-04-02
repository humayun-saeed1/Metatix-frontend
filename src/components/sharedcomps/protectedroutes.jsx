import { Navigate, Outlet } from "react-router-dom";

// We pass an array of allowedRoles (e.g., ["Admin", "Organizer"])
function ProtectedRoute({ allowedRoles }) {
    const token = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("user_role");

    // 1. No token? Kick them to login.
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // 2. Do we care about roles for this page, and do they have the right one?
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log(`Access Denied. User is a ${userRole}, but this page requires: ${allowedRoles}`);
        
        // Kick them back to their own safe space based on their actual role
        if (userRole === "Admin") return <Navigate to="/admin-dashboard" replace />;
        if (userRole === "Organizer") return <Navigate to="/organizer-dashboard" replace />;
        return <Navigate to="/Bookingpage" replace />;
    }

    // 3. Token is valid AND role is correct! Let them in.
    return <Outlet />;
}

export default ProtectedRoute;