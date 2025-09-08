import React, { useEffect, useRef } from "react";

const MainChat = ({ messages, selectedConversation }) => {


    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedConversation]);


    if (!selectedConversation) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                Hãy chọn một cuộc trò chuyện
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b font-bold bg-white shadow-sm">
                {selectedConversation.name || "Chưa có thông tin"}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => {
                    const isCustomer = msg.sender_type === "customer";
                    const time = new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    return (
                        <div
                            key={msg.id}
                            className={`flex flex-col max-w-[70%] ${isCustomer ? "self-start items-start" : "self-end items-end"
                                }`}
                        >
                            {/* Optional: hiển thị role */}
                            <span className="text-xs text-gray-400 mb-1">
                                {isCustomer ? "Khách hàng" : "Bạn"}
                            </span>

                            {/* Bubble */}
                            <div
                                className={`px-4 py-2 rounded-2xl shadow-sm ${isCustomer
                                    ? "bg-blue-100 text-gray-800"
                                    : "bg-green-100 text-gray-800"
                                    }`}
                            >
                                {msg.content}
                            </div>

                            {/* Time */}
                            <span className="text-xs text-gray-400 mt-1">{time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MainChat;
