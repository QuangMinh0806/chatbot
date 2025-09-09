import React from "react";

const KnowledgeView = ({ knowledge }) => {
    console.log("11", knowledge)
    return (
        <div className="p-4 border rounded bg-gray-50 mb-4">
            <h2 className="text-xl font-bold mb-2">{knowledge.title}</h2>
            <p className="text-gray-600 mb-1"><strong>Danh mục:</strong> {knowledge.category}</p>
            <p className="text-gray-600 mb-1"><strong>Cập nhật:</strong> {new Date(knowledge.updated_at).toLocaleString("vi-VN")}</p>
            <p className="text-gray-600 mb-2"><strong>Nguồn:</strong> {knowledge.source}</p>
            <div>
                <strong>Nội dung:</strong>
                <p className="mt-2">{knowledge.content}</p>
            </div>
        </div>
    );
};

export default KnowledgeView;
