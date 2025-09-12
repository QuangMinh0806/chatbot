import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://chatbot_chatbot-fe:80/users/me", { withCredentials: true });
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        "http://chatbot_chatbot-fe:80/users/login",
        { username, password },
        { withCredentials: true } // ✅ quan trọng để browser lưu cookie
      );

      // Gọi lại fetchUser để lấy profile
      await fetchUser();
      return response.data;
    } catch (error) {
      throw error;
    }
  };
  const handleLogout = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('http://chatbot_chatbot-fe:80/users/logout', {}, { withCredentials: true })
      console.log("s")
      setUser(null);
    } catch (err) {
      setError(err.response?.data || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthContext.Provider value={{ user, setUser, login, loading, error, fetchUser, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
