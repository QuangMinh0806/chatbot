import React from "react";
import { BookOpen, Tag, Globe, FileText } from "lucide-react";

const KnowledgeView = ({ knowledge }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
            <div className="bg-blue-500 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">{knowledge.title}</h1>
                </div>
                {knowledge.category && (
                    <div className="flex items-center gap-2 text-blue-100">
                        <Tag className="w-4 h-4" />
                        <span className="text-sm">{knowledge.category}</span>
                    </div>
                )}
            </div>

            <div className="p-6 space-y-4">
                {knowledge.content && (
                    <div>
                        <div className="flex items-center gap-2 text-gray-700 mb-3">
                            <FileText className="w-5 h-5" />
                            <h3 className="font-semibold">Nội dung</h3>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{knowledge.content}</p>
                        </div>
                    </div>
                )}

                {knowledge.source && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">Nguồn: {knowledge.source}</span>
                    </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${knowledge.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                        }`}>
                        {knowledge.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeView;