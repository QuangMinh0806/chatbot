import React from 'react'
import Sidebar from '../../components/layout/Sildebar'
import { Settings, MessageSquare, Database, Users, BarChart3, Bell, FileSpreadsheet, Bot, Key, UserCheck } from 'lucide-react';

export const Dashboard = () => {
    const statusCards = [
        {
            title: 'AI API',
            subtitle: 'Gemini AI API',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <Key className="w-5 h-5 text-blue-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Cấu hình chatbot',
            subtitle: 'Đã cấu hình',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <Bot className="w-5 h-5 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Kênh Chat',
            subtitle: 'Facebook',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Dữ liệu tư vấn',
            subtitle: 'Google Sheets',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <FileSpreadsheet className="w-5 h-5 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Data Lead',
            subtitle: 'Google Sheets',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <FileSpreadsheet className="w-5 h-5 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Kênh Thông Báo',
            subtitle: 'Telegram',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <Bell className="w-5 h-5 text-blue-500" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        }
    ];

    const statsCards = [
        {
            title: 'Số mục dữ liệu liên kết',
            value: '8',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            borderColor: 'border-blue-200'
        },
        {
            title: 'Số người dùng',
            value: '2',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            borderColor: 'border-blue-200'
        }
    ];

    const setupSteps = [
        {
            step: 1,
            icon: <Settings className="w-4 h-4" />,
            text: 'Cấu hình hệ thống: API keys, tokens, Google Sheets'
        },
        {
            step: 2,
            icon: <Bot className="w-4 h-4" />,
            text: 'Cấu hình chatbot: Thiết lập prompt và lời chào'
        },
        {
            step: 3,
            icon: <UserCheck className="w-4 h-4" />,
            text: 'Tùy chỉnh nhận dữ liệu: Cấu hình mẫu sắc nguồn tin nhắn'
        },
        {
            step: 4,
            icon: <Database className="w-4 h-4" />,
            text: 'Lead Data: Thiết lập các trường thu thập và ánh xạ'
        },
        {
            step: 5,
            icon: <Users className="w-4 h-4" />,
            text: 'Quản lý người dùng: Tạo tài khoản agent'
        }
    ];

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 p-8 bg-gray-50 min-h-screen overflow-auto">
                <div className="max-w-7xl mx-auto p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tổng quan hệ thống</h1>
                        <p className="text-gray-600">Trang thái cấu hình và thống kê tổng quan</p>
                    </div>

                    {/* Status Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {statusCards.map((card, index) => (
                            <div key={index} className={`${card.bgColor} ${card.borderColor} border rounded-lg p-6 hover:shadow-md transition-shadow`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2">
                                        {card.icon}
                                        <span className="text-sm font-medium text-gray-600">{card.title}</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full bg-green-100 ${card.statusColor} font-medium`}>
                                        ● {card.status}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{card.subtitle}</h3>
                            </div>
                        ))}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {statsCards.map((stat, index) => (
                            <div key={index} className={`${stat.bgColor} ${stat.borderColor} border rounded-lg p-6 hover:shadow-md transition-shadow`}>
                                <h3 className="text-sm font-medium text-gray-600 mb-2">{stat.title}</h3>
                                <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Setup Guide */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 text-sm">🚀</span>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900">Bắt đầu sử dụng</h2>
                        </div>
                        <p className="text-gray-600 mb-6">Để hệ thống hoạt động đầy đủ, bạn cần cấu hình:</p>

                        <div className="space-y-4">
                            {setupSteps.map((step, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                        {step.step}
                                    </div>
                                    <div className="flex items-center space-x-2 text-gray-700">
                                        {step.icon}
                                        <span>{step.text}</span>
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
