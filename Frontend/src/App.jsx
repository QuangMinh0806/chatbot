import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/User/Login";
import DashBoard from './pages/DashBoard/DashBoard';
import Messager_home from './pages/Messenger/Messenger_home';
import Messager_admin from './pages/Messenger/ChatPage';
import UserPage from './pages/User/UserPage';
import KnowledgePage from './pages/Knowledge/Knowledge';
import FacebookPagePage from './pages/ConnectPlaform/FacebookPage'
import { ProtectedRoute } from './components/context/ProtectedRoute'
import LLM from './pages/LLM/LLM';
import ExportData from './pages/ExportData/ExportData';
import Search from './pages/Search/search';
import MainLayout from './components/layout/MainLayout';
import Profile from './pages/User/Profile';
const App = () => {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<LoginPage />} />
                <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <MainLayout>
                            <DashBoard />
                        </MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/dashboard/cau-hinh-he-thong" element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <MainLayout>
                            <LLM />
                        </MainLayout>
                    </ProtectedRoute>
                } />
                <Route path="/chat" element={<Messager_home />} />
                <Route path="/admin/chat" element={<ProtectedRoute>
                    {/* <MainLayout> */}
                    <Messager_admin />
                    {/* </MainLayout> */}
                </ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute>
                    <MainLayout>
                        <UserPage />
                    </MainLayout></ProtectedRoute>} />
                <Route path="/dashboard/cau-hinh-kien-thuc" element={<ProtectedRoute>
                    <MainLayout>
                        <KnowledgePage />
                    </MainLayout></ProtectedRoute>} />
                <Route path="/admin/facebook_page" element={<ProtectedRoute>
                    {/* <MainLayout> */}
                    <FacebookPagePage />
                    {/* </MainLayout> */}
                </ProtectedRoute>} />
                <Route path='/dashboard/export' element={<ProtectedRoute allowedRoles={["admin"]}>
                    <MainLayout>
                        <ExportData />
                    </MainLayout></ProtectedRoute>} />
                <Route path='/dashboard/searchResults' element={<ProtectedRoute>
                    <MainLayout>
                        <Search />
                    </MainLayout></ProtectedRoute>} />
                <Route path='/profile' element={<ProtectedRoute>
                    <MainLayout>
                        <Profile />
                    </MainLayout></ProtectedRoute>} />
            </Routes>
        </Router>
    );
};

export default App;
