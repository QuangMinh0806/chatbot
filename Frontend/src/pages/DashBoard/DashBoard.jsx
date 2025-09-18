import React, { useEffect, useState } from 'react'
import { Settings, MessageSquare, Database, Users, TestTube, BarChart3, Bell, FileSpreadsheet, Bot, Key, UserCheck, Search, Facebook, MessageCircle } from 'lucide-react';
import { getUsers } from '../../services/userService';
import { useNavigate } from "react-router-dom";
import { get_llm_by_id } from "../../services/llmService";
import { getKnowledgeById } from "../../services/knowledgeService";
import { getAllChatHistory } from "../../services/messengerService";
export const Dashboard = () => {
    const [data, setData] = useState([]);
    const [bot, setBot] = useState();
    const [knowledgeService, setKnowledgeService] = useState();
    const [chat, setChat] = useState();
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const [users, chatbot, knowledge, historyChat] = await Promise.all([
                getUsers(),
                get_llm_by_id(1),
                getKnowledgeById(1),
                getAllChatHistory()
            ]);

            setData(users);
            setBot(chatbot);
            setKnowledgeService(knowledge);
            setChat(historyChat);

            setLoading(false);
        };
        fetchData();
    }, []);

    const isConfigured = bot?.key && bot?.name && bot?.prompt && bot?.system_greeting
    const isKnowledgeService = knowledgeService?.source && knowledgeService?.content && knowledgeService.title
    const navigate = useNavigate();
    const statusCards = [
        isConfigured
            ? {
                title: 'Cấu hình chatbot',
                subtitle: 'Chatbot',
                status: 'Đã cấu hình',
                statusColor: 'text-green-600',
                icon: <Bot className="w-6 h-6 text-green-600" />,
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                path: "/dashboard/cau-hinh-he-thong",
                cardStatus: "Cấu hình hoàn tất và đang hoạt động"
            }
            : {
                title: 'Cấu hình chatbot',
                subtitle: 'Chưa hoàn thành',
                status: 'Chưa hoàn thành',
                statusColor: 'text-red-600',
                icon: <Bot className="w-6 h-6 text-red-600" />,
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                path: "/dashboard/cau-hinh-he-thong",
                cardStatus: "Cấu hình chưa hoàn tất"
            },
        isKnowledgeService ?
            {
                title: 'Dữ liệu tư vấn',
                subtitle: 'Google Sheets',
                status: 'Đã cấu hình',
                statusColor: 'text-green-600',
                icon: <FileSpreadsheet className="w-6 h-6 text-green-600" />,
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                path: "/dashboard/cau-hinh-kien-thuc",
                cardStatus: "Cấu hình hoàn tất và đang hoạt động"
            }
            : {
                title: 'Dữ liệu tư vấn',
                subtitle: 'Google Sheets',
                status: 'Chưa hoàn thành',
                statusColor: 'text-red-600',
                icon: <FileSpreadsheet className="w-6 h-6 text-red-600" />,
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                path: "/dashboard/cau-hinh-kien-thuc",
                cardStatus: "Cấu hình chưa hoàn tất"
            },
        {
            title: 'Kết quả tìm kiếm',
            subtitle: 'Search',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <Search className="w-6 h-6 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            path: "/dashboard/searchResults",
            cardStatus: "Cấu hình hoàn tất và đang hoạt động"
        },
        {
            title: 'Kênh Chat',
            subtitle: 'Facebook',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <Facebook className="w-6 h-6 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            path: "/admin/facebook_page",
            cardStatus: "Cấu hình hoàn tất và đang hoạt động"
        },
        {
            title: 'Kênh Chat',
            subtitle: 'Zalo',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <MessageSquare className="w-6 h-6 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            path: "/admin/facebook_page",
            cardStatus: "Cấu hình hoàn tất và đang hoạt động"
        },
        {
            title: 'Kênh Chat',
            subtitle: 'Telegram',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <MessageCircle className="w-6 h-6 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            path: "/admin/facebook_page",
            cardStatus: "Cấu hình hoàn tất và đang hoạt động"
        }
    ];

    const statsCards = [
        // {
        //     title: 'Số doanh nghiệp',
        //     value: '1',
        //     bgColor: 'bg-indigo-50',
        //     textColor: 'text-indigo-600',
        //     borderColor: 'border-indigo-200',
        //     icon: '🏢'
        // },
        {
            title: 'Số người dùng',
            value: data.length || 0,
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            borderColor: 'border-purple-200',
            icon: '👥',
            path: '/admin/users'
        },
        {
            title: 'Số cuộc trò chuyện',
            value: chat?.length || 0,
            bgColor: 'bg-indigo-50',
            textColor: 'text-indigo-600',
            borderColor: 'border-indigo-200',
            icon: '💬',
            path: '/admin/chat'
        },
        // {
        //     title: 'Khách hàng tiềm năng',
        //     value: '324',
        //     bgColor: 'bg-indigo-50',
        //     textColor: 'text-indigo-600',
        //     borderColor: 'border-indigo-200',
        //     icon: '🎯'
        // },
    ];

    const setupSteps = [
        {
            step: 1,
            icon: <Settings className="w-5 h-5" />,
            title: 'Cài đặt cơ bản',
            text: 'Điền thông tin công ty và kết nối dịch vụ cần thiết',
            description: 'Thiết lập thông tin doanh nghiệp và các tài khoản dịch vụ',
            tasks: [
                'Nhập tên công ty, logo và thông tin liên hệ',
                'Kết nối tài khoản Google (để lưu dữ liệu vào Google Sheets)',
                'Nhập API key ChatGPT hoặc Claude (để chatbot hoạt động)',
                'Cài đặt email nhận thông báo khi có khách hàng mới',
                'Chọn múi giờ và ngôn ngữ hiển thị'
            ],
        },
        {
            step: 2,
            icon: <Bot className="w-5 h-5" />,
            title: 'Thiết kế chatbot',
            text: 'Tạo tính cách, lời chào và cách trả lời của chatbot',
            description: 'Tùy chỉnh hành vi và phong cách giao tiếp phù hợp với thương hiệu',
            tasks: [
                'Viết lời chào đầu tiên của chatbot',
                'Mô tả vai trò của chatbot (tư vấn viên, hỗ trợ khách hàng...)',
                'Tạo danh sách câu hỏi thường gặp và câu trả lời',
                'Thiết lập tin nhắn khi không hiểu khách hàng',
                'Thêm thông tin về sản phẩm/dịch vụ để chatbot tư vấn'
            ],
        },
        {
            step: 3,
            icon: <UserCheck className="w-5 h-5" />,
            title: 'Form thu thập thông tin',
            text: 'Thiết kế form để chatbot hỏi và lưu thông tin khách hàng',
            description: 'Quyết định thông tin nào cần thu thập từ khách hàng tiềm năng',
            tasks: [
                'Chọn thông tin cần thu thập (tên, số điện thoại, email, nhu cầu...)',
                'Viết câu hỏi để chatbot hỏi thông tin một cách tự nhiên',
                'Thiết lập thứ tự hỏi thông tin (tên trước, sau đó số điện thoại...)',
                'Tạo tin nhắn cảm ơn sau khi thu thập xong thông tin',
                'Quy định thông tin nào bắt buộc, thông tin nào tùy chọn'
            ],
        },
        {
            step: 4,
            icon: <Database className="w-5 h-5" />,
            title: 'Quản lý khách hàng tiềm năng',
            text: 'Cài đặt cách phân loại và theo dõi khách hàng',
            description: 'Thiết lập hệ thống quản lý và đánh giá chất lượng khách hàng',
            tasks: [
                'Tạo các nhãn phân loại khách hàng (nóng, ấm, lạnh)',
                'Thiết lập điều kiện tự động gắn nhãn dựa vào câu trả lời',
                'Cài đặt thông báo khi có khách hàng tiềm năng chất lượng cao',
                'Kết nối với Google Sheets để xuất danh sách khách hàng',
                'Thiết lập tự động gửi email báo cáo hàng tuần'
            ],
        },
        {
            step: 5,
            icon: <Users className="w-5 h-5" />,
            title: 'Thêm nhân viên',
            text: 'Mời đồng nghiệp và phân quyền truy cập hệ thống',
            description: 'Tạo tài khoản cho team và thiết lập quyền hạn phù hợp',
            tasks: [
                'Mời nhân viên sales/marketing tham gia hệ thống',
                'Phân quyền xem/chỉnh sửa dữ liệu khách hàng',
                'Thiết lập ai nhận thông báo khi có lead mới',
                'Tạo workspace riêng cho từng bộ phận',
                'Hướng dẫn nhân viên sử dụng dashboard'
            ],
        }
    ];

    const completedSteps = setupSteps.filter(step => step.completed).length;
    const totalSteps = setupSteps.length;
    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
    return (

        <div className="flex-1 p-4 lg:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen overflow-auto">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center lg:text-left">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                🚀 Tổng quan hệ thống
                            </h1>
                            <p className="text-gray-600 text-lg">
                                Trạng thái cấu hình và thống kê tổng quan
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-xl border border-green-200">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-semibold">Hệ thống hoạt động</span>
                        </div>
                    </div>
                </div>

                {/* Status Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statusCards.map((card, index) => (
                        <div key={index} onClick={() => navigate(card.path)} className={`${card.bgColor} ${card.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-xl shadow-sm">
                                        {card.icon}
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-gray-700">{card.title}</span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-green-100 ${card.statusColor} font-bold border border-green-300`}>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    {card.status}
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{card.subtitle}</h3>
                            <div className="text-sm text-gray-600">
                                {card.cardStatus}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {statsCards.map((stat, index) => (
                        <div key={index} className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 transform hover:scale-105`}
                            onClick={() => navigate(`${stat.path}`)}>
                            <div className="flex items-center justify-between">
                                <div >
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{stat.title}</h3>
                                    <p className={`text-4xl font-bold ${stat.textColor}`}>{stat.value}</p>
                                </div>
                                <div className="text-4xl opacity-20">
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Setup Guide */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <span className="text-2xl">🚀</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Bắt đầu sử dụng</h2>
                                <p className="text-orange-100 mt-1">Hướng dẫn thiết lập hệ thống Multi-Tenant Chatbot Platform</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-gray-600 mb-6 text-lg">
                            Chỉ cần 5 bước đơn giản để chatbot của bạn sẵn sàng thu thập và chăm sóc khách hàng:
                        </p>

                        <div className="space-y-4">
                            {setupSteps.map((step, index) => (
                                <div key={index} className={`group cursor-pointer transition-all duration-200 ${step.completed
                                    ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                                    : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-orange-300'
                                    } rounded-xl overflow-hidden`}>
                                    {/* Main Step Content */}
                                    <div className="flex items-start space-x-4 p-4">
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step.completed
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-300 text-gray-600 group-hover:bg-orange-400 group-hover:text-white'
                                            }`}>
                                            {step.completed ? '✓' : step.step}
                                        </div>

                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className={`p-2 rounded-lg transition-all ${step.completed
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-600'
                                                }`}>
                                                {step.icon}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className={`text-lg font-semibold ${step.completed
                                                        ? 'text-green-800'
                                                        : 'text-gray-700 group-hover:text-orange-700'
                                                        }`}>
                                                        {step.title}
                                                    </h3>

                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable Task List */}
                                    <div className="px-4 pb-4">
                                        <div className="ml-12 pl-4 border-l-2 border-gray-200">
                                            <p className="text-sm text-gray-600 mb-2 font-medium">Nhiệm vụ cần thực hiện:</p>
                                            <ul className="space-y-1">
                                                {step.tasks.map((task, taskIndex) => (
                                                    <li key={taskIndex} className="text-sm text-gray-600 flex items-center space-x-2">
                                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0"></span>
                                                        <span>{task}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;