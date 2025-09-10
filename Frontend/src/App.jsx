import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/User/Login";
import { DashBoard } from './pages/DashBoard/DashBoard';
import Messager_home from './pages/Messenger/Messenger_home';
import Messager_admin from './pages/Messenger/ChatPage';
import UserPage from './pages/User/UserPage';
import KnowledgePage from './pages/Knowledge/Knowledge';
import FacebookPagePage from './pages/FacebookPage/FacebookPage';

import LLM from './pages/LLM/LLM';
import ExportData from './pages/ExportData/ExportData';
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<DashBoard />} />
                <Route path="/dashboard/cau-hinh-he-thong" element={<LLM />} />
                <Route path="/chat" element={<Messager_home />} />
                <Route path="/admin/chat" element={<Messager_admin />} />
                <Route path="/admin/users" element={<UserPage />} />
                <Route path="/admin/knowledge-base" element={<KnowledgePage />} />
                <Route path="/admin/facebook_page" element={<FacebookPagePage />} />
                <Route path='/dashboard/export' element={<ExportData />} />
            </Routes>
        </Router>
    );
};

export default App;
