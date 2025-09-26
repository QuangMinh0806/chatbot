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
    return (

        <div className="flex-1 p-4 lg:p-6 bg-gray-50 min-h-screen overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-semibold text-gray-900 mb-1">
                                🚀 Tổng quan hệ thống
                            </h1>
                            <p className="text-gray-600">
                                Trạng thái cấu hình và thống kê tổng quan
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-lg border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="font-medium">Hệ thống hoạt động</span>
                        </div>
                    </div>
                </div>

                {/* Status Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusCards.map((card, index) => (
                        <div key={index} onClick={() => navigate(card.path)} className={`${card.bgColor} ${card.borderColor} border rounded-lg p-4 hover:bg-opacity-80 transition-colors cursor-pointer`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-white rounded-lg">
                                        {card.icon}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">{card.title}</span>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 ${card.statusColor} font-medium border border-green-300`}>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    {card.status}
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.subtitle}</h3>
                            <div className="text-sm text-gray-600">
                                {card.cardStatus}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {statsCards.map((stat, index) => (
                        <div key={index} className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6 hover:bg-opacity-80 transition-colors cursor-pointer`}
                            onClick={() => navigate(`${stat.path}`)}>
                            <div className="flex items-center justify-between">
                                <div >
                                    <h3 className="text-base font-medium text-gray-700 mb-2">{stat.title}</h3>
                                    <p className={`text-3xl font-semibold ${stat.textColor}`}>{stat.value}</p>
                                </div>
                                <div className="text-3xl opacity-30">
                                    {stat.icon}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


            </div>
        </div>
    );
};

export default Dashboard;