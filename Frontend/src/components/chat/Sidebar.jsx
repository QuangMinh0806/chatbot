import React from "react";

const Sidebar = ({ conversations, onSelect }) => {
    return (
        <div className="w-80 bg-white border-r border-gray-200">
            <div className="p-4 border-b border-gray-200 font-bold">Chats</div>
            <div className="overflow-y-auto">
                {conversations.map((conv) => (
                    <div
                        key={conv.session_id}
                        className="p-4 border-b cursor-pointer hover:bg-gray-100"
                        onClick={() => onSelect(conv)}
                    >
                        <div className="font-semibold">
                            {conv.full_name || "Chưa có thông tin"}
                        </div>
                        <div className="text-sm text-gray-500">{conv.content}</div>
                        <div className="text-xs text-gray-400">{conv.created_at}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
