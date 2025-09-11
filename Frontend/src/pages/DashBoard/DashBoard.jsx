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
            icon: <Key className="w-6 h-6 text-blue-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Cấu hình chatbot',
            subtitle: 'Đã cấu hình',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <Bot className="w-6 h-6 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Kênh Chat',
            subtitle: 'Facebook',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <MessageSquare className="w-6 h-6 text-blue-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Dữ liệu tư vấn',
            subtitle: 'Google Sheets',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <FileSpreadsheet className="w-6 h-6 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Data Lead',
            subtitle: 'Google Sheets',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <FileSpreadsheet className="w-6 h-6 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        },
        {
            title: 'Kênh Thông Báo',
            subtitle: 'Telegram',
            status: 'Đã cấu hình',
            statusColor: 'text-green-600',
            icon: <Bell className="w-6 h-6 text-blue-500" />,
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
            borderColor: 'border-blue-200',
            icon: '📊'
        },
        {
            title: 'Số người dùng',
            value: '2',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            borderColor: 'border-purple-200',
            icon: '👥'
        }
    ];

    const setupSteps = [
        {
            step: 1,
            icon: <Settings className="w-5 h-5" />,
            text: 'Cấu hình hệ thống: API keys, tokens, Google Sheets',
            completed: true
        },
        {
            step: 2,
            icon: <Bot className="w-5 h-5" />,
            text: 'Cấu hình chatbot: Thiết lập prompt và lời chào',
            completed: true
        },
        {
            step: 3,
            icon: <UserCheck className="w-5 h-5" />,
            text: 'Tùy chỉnh nhận dữ liệu: Cấu hình mẫu sắc nguồn tin nhắn',
            completed: false
        },
        {
            step: 4,
            icon: <Database className="w-5 h-5" />,
            text: 'Lead Data: Thiết lập các trường thu thập và ánh xạ',
            completed: false
        },
        {
            step: 5,
            icon: <Users className="w-5 h-5" />,
            text: 'Quản lý người dùng: Tạo tài khoản agent',
            completed: true
        }
    ];

    return (
        <div className="flex h-screen">
            <Sidebar />
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
                            <div key={index} className={`${card.bgColor} ${card.borderColor} border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer`}>
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
                                    Cấu hình hoàn tất và đang hoạt động
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {statsCards.map((stat, index) => (
                            <div key={index} className={`${stat.bgColor} ${stat.borderColor} border-2 rounded-2xl p-8 hover:shadow-lg transition-all duration-300 transform hover:scale-105`}>
                                <div className="flex items-center justify-between">
                                    <div>
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
                                    <p className="text-orange-100 mt-1">Hướng dẫn thiết lập hệ thống hoàn chỉnh</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 mb-6 text-lg">
                                Để hệ thống hoạt động đầy đủ, bạn cần hoàn thành các bước cấu hình sau:
                            </p>

                            <div className="space-y-4">
                                {setupSteps.map((step, index) => (
                                    <div key={index} className={`flex items-start space-x-4 p-4 rounded-xl transition-all ${step.completed
                                        ? 'bg-green-50 border border-green-200'
                                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                        }`}>
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step.completed
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-300 text-gray-600'
                                            }`}>
                                            {step.completed ? '✓' : step.step}
                                        </div>
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className={`p-2 rounded-lg ${step.completed
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {step.icon}
                                            </div>
                                            <div className="flex-1">
                                                <span className={`text-lg ${step.completed
                                                    ? 'text-green-800 font-semibold'
                                                    : 'text-gray-700'
                                                    }`}>
                                                    {step.text}
                                                </span>
                                                {step.completed && (
                                                    <div className="text-sm text-green-600 mt-1">
                                                        ✅ Đã hoàn thành
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {!step.completed && (
                                            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                                                Thiết lập
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Tiến độ hoàn thành</span>
                                    <span className="text-sm font-bold text-blue-600">60%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '60%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;