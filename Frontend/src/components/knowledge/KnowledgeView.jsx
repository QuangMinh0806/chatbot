import React from "react";

const KnowledgeView = ({ knowledge }) => {
    return (
        <div className="p-8 border border-gray-200 rounded-2xl bg-white shadow-md hover:shadow-lg transition w-full max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">{knowledge.title}</h2>

            <div className="space-y-3 text-lg">
                <p className="text-gray-700 flex items-center gap-2">
                    📂 <span className="font-semibold text-gray-900">Danh mục:</span> {knowledge.category}
                </p>
                <p className="text-gray-700 flex items-center gap-2">
                    ⏰ <span className="font-semibold text-gray-900">Cập nhật:</span>{" "}
                    {new Date(knowledge.updated_at).toLocaleString("vi-VN")}
                </p>
                <p className="text-gray-700 flex items-center gap-2 break-all">
                    🔗 <span className="font-semibold text-gray-900">Nguồn:</span> {knowledge.source}
                </p>
            </div>

            <div className="border-t mt-6 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">📖 Nội dung</h3>
                <p className="text-gray-800 leading-relaxed whitespace-pre-line text-lg">
                    {knowledge.content}
                </p>
            </div>
        </div>


    );
};

export default KnowledgeView;
