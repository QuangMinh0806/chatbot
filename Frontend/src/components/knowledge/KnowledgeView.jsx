import React from "react";
import { BookOpen, Tag, Globe, FileText, Calendar, Eye } from "lucide-react";

const KnowledgeView = ({ knowledge }) => {
    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-indigo-800/20"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>

                <div className="relative">
                    <div className="flex items-start gap-6 mb-4">
                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            <BookOpen className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-4xl font-bold mb-3 leading-tight">{knowledge.title}</h1>
                            {knowledge.category && (
                                <div className="flex items-center gap-3 text-blue-100">
                                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <span className="text-lg font-medium bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                                        {knowledge.category}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {knowledge.created_at ? new Date(knowledge.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                            <Eye className="w-4 h-4" />
                            <span className="text-sm font-medium">Đã xem: {knowledge.views || 0} lần</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
                {/* Content Section */}
                {knowledge.content && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Nội dung kiến thức</h3>
                        </div>

                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border-l-8 border-blue-500 shadow-inner">
                            <div className="prose prose-lg max-w-none">
                                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg font-medium">
                                    {knowledge.content}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Source Section */}
                {knowledge.source && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-bold text-blue-900 text-lg">Nguồn tham khảo</h4>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-blue-300">
                            <p className="text-blue-800 font-medium break-all">{knowledge.source}</p>
                        </div>
                    </div>
                )}

                {/* Status and Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-purple-900 text-lg mb-2">Trạng thái</h4>
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 ${knowledge.is_active
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                                    }`}>
                                    <div className={`w-3 h-3 rounded-full ${knowledge.is_active ? 'bg-green-500' : 'bg-red-500'
                                        }`}></div>
                                    {knowledge.is_active ? '✅ Đang hoạt động' : '❌ Không hoạt động'}
                                </span>
                            </div>
                            <div className="text-4xl opacity-20">
                                {knowledge.is_active ? '🟢' : '🔴'}
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-orange-900 text-lg mb-2">Thống kê</h4>
                                <div className="space-y-2">
                                    <div className="text-sm text-orange-800">
                                        <span className="font-medium">Độ dài:</span> {knowledge.content?.length || 0} ký tự
                                    </div>
                                    <div className="text-sm text-orange-800">
                                        <span className="font-medium">Từ khóa:</span> {knowledge.content?.split(' ').length || 0} từ
                                    </div>
                                </div>
                            </div>
                            <div className="text-4xl opacity-20">
                                📊
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="pt-6 border-t-2 border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="text-sm text-gray-500">
                            <span className="font-medium">Tạo lúc:</span> {
                                knowledge.created_at
                                    ? new Date(knowledge.created_at).toLocaleString('vi-VN')
                                    : 'Không xác định'
                            }
                        </div>
                        <div className="text-sm text-gray-500">
                            <span className="font-medium">Cập nhật:</span> {
                                knowledge.updated_at
                                    ? new Date(knowledge.updated_at).toLocaleString('vi-VN')
                                    : 'Chưa cập nhật'
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeView;