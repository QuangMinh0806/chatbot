import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/User/Login";
import DashBoard from './pages/DashBoard/DashBoard';
import Messager_home from './pages/Messenger/Messenger_home';
import Messager_admin from './pages/Messenger/ChatPage';
import UserPage from './pages/User/UserPage';
import KnowledgePage from './pages/Knowledge/Knowledge';
import FacebookPagePage from './pages/FacebookPage/FacebookPage';
import { ProtectedRoute } from './components/context/ProtectedRoute'
import LLM from './pages/LLM/LLM';
import ExportData from './pages/ExportData/ExportData';
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<LoginPage />} />
                
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <DashBoard />
                    </ProtectedRoute>
                } />
                <Route path="/dashboard/cau-hinh-he-thong" element={<ProtectedRoute><LLM /></ProtectedRoute>} />
                <Route path="/chat" element={<Messager_home />} />
                <Route path="/admin/chat" element={<ProtectedRoute><Messager_admin /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
                <Route path="/dashboard/cau-hinh-kien-thuc" element={<ProtectedRoute><KnowledgePage /></ProtectedRoute>} />
                <Route path="/admin/facebook_page" element={<ProtectedRoute><FacebookPagePage /></ProtectedRoute>} />
                <Route path='/dashboard/export' element={<ProtectedRoute><ExportData /></ProtectedRoute>} />
            </Routes>
        </Router>
    );
};

export default App;
