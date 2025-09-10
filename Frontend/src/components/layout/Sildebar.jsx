import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Package,
    Users,
    Building,
    ClipboardCheck,
    RotateCcw,
    Bell,
    BarChart,
    BookUser,
    KeyRound,
    Landmark,
} from "lucide-react";

const menuItems = [
    {
        label: "Trang quản lý",
        icon: Package,
        href: "/dashboard",
    },
    {
        label: "Cấu hình kiến thức",
        icon: Package,
        href: "/dashboard/cau-hinh-kien-thuc",
    },
    {
        label: "Cấu hình hệ thống",
        icon: RotateCcw,
        href: "/dashboard/cau-hinh-he-thong",
    },
    {
        label: "Quản lý chat",
        icon: Package,
        href: "/admin/chat",
    },
    {
        label: "Lưu trữ dữ liệu khách hàng",
        icon: Users,
        href: "/dashboard/export"
    }
];

export default function Sidebar({ children }) {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <div className="flex ">
            <div className="h-screen w-80 bg-gray-800 text-white flex flex-col">
                {/* Menu */}
                <div className="p-4 text-xl font-bold border-b border-gray-700">
                    Menu Quản Trị
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item, idx) => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.href;

                        return (
                            <Link
                                key={idx}
                                to={item.href}
                                className={`flex text-white items-center w-full px-4 py-3 rounded transition ${isActive ? "bg-blue-500" : "hover:bg-blue-600"
                                    }`}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Nội dung */}
            <div className="flex-1 p-6">{children}</div>
        </div>
    );
}