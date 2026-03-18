import { Navigate, Outlet } from "react-router-dom";

export const ProtectedRoute = () => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
