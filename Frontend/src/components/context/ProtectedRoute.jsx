import { useAuth } from "./AuthContext";
import { Navigate } from "react-router-dom";


export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Đang tải...</div>;

  if (!user) return <Navigate to="/login" />;
  console.log(user)
  return children;
};

