import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext"
import {
    BookUser,
    MessageSquare,
    Database,
    Settings,
    Home,
    Menu,
    X
} from "lucide-react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom"
const menuItems = [
    {
        label: "Trang quản lý",
        icon: Home,
        href: "/dashboard",
        color: "text-blue-600",
        bgColor: "bg-blue-100"
    },
    {
        label: "Cấu hình kiến thức",
        icon: BookUser,
        href: "/dashboard/cau-hinh-kien-thuc",
        color: "text-green-600",
        bgColor: "bg-green-100"
    },
    {
        label: "Cấu hình hệ thống",
        icon: Settings,
        href: "/dashboard/cau-hinh-he-thong",
        color: "text-purple-600",
        bgColor: "bg-purple-100"
    },
    {
        label: "Quản lý chat",
        icon: MessageSquare,
        href: "/admin/chat",
        color: "text-indigo-600",
        bgColor: "bg-indigo-100"
    },
    {
        label: "Lưu trữ dữ liệu khách hàng",
        icon: Database,
        href: "/dashboard/export",
        color: "text-orange-600",
        bgColor: "bg-orange-100"
    }
];

export default function Sidebar({ children }) {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { handleLogout } = useAuth();
    const navigate = useNavigate();
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };
    const logout = async () => {
        try {
            await handleLogout();
            navigate("/login");
        } catch (err) {
            console.error("Logout thất bại:", err);
        }
    };
    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={toggleMobileMenu}
                    className="p-3 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-colors"
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={closeMobileMenu}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-80 sm:w-72 lg:w-80
                bg-gradient-to-b from-gray-900 to-gray-800 text-white 
                flex flex-col shadow-2xl overflow-hidden
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                {/* Header */}
                <div className="relative p-6 sm:p-8 border-b border-gray-700/50">
                    <div className="flex items-center gap-3 sm:gap-4 mb-2">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <span className="text-white text-lg sm:text-xl font-bold">🤖</span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">Menu Quản Trị</h1>
                            <p className="text-gray-300 text-xs sm:text-sm">Hệ thống Chat AI</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="relative flex-1 p-4 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto">
                    {menuItems.map((item, idx) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.href;

                        return (
                            <Link
                                key={idx}
                                to={item.href}
                                onClick={closeMobileMenu}
                                className={`group relative flex items-center w-full px-3 sm:px-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all duration-300 ${isActive
                                    ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl transform scale-105"
                                    : "hover:bg-white/10 hover:shadow-lg hover:transform hover:scale-102 text-gray-300 hover:text-white"
                                    }`}
                            >
                                {/* Active indicator */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 sm:h-8 bg-white rounded-r-full"></div>
                                )}

                                {/* Icon */}
                                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4 transition-all flex-shrink-0 ${isActive
                                    ? "bg-white/20 shadow-lg"
                                    : `${item.bgColor}/20 group-hover:${item.bgColor}/30`
                                    }`}>
                                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isActive ? "text-white" : `${item.color} group-hover:text-white`
                                        }`} />
                                </div>

                                {/* Label */}
                                <div className="flex-1 min-w-0">
                                    <span className={`font-semibold text-base sm:text-lg leading-tight ${isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                                        }`}>
                                        {item.label}
                                    </span>
                                </div>

                                {/* Arrow indicator for active */}
                                {isActive && (
                                    <div className="text-white/80 flex-shrink-0">
                                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="relative p-4 sm:p-6 border-t border-gray-700/50">
                    {/* <div className="bg-gradient-to-r from-blue-600/10 to-indigo-700/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-500/20">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full"></div>
                            </div>
                            <span className="text-white font-medium text-sm sm:text-base">Hệ thống hoạt động</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-300">
                            Phiên bản 2.0 • Cập nhật mới nhất
                        </div>
                    </div> */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="font-semibold">Đăng xuất</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-50 overflow-hidden lg:ml-0">
                <div className="lg:hidden h-16"></div> {/* Spacer for mobile menu button */}
                {children}
            </div>
        </div>
    );
}