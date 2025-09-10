import React, { useState, useEffect } from "react";
import Sidebar from "../../components/chat/Sidebar";
import ChatInput from "../../components/chat/ChatInput";
import MainChat from "../../components/chat/MainChat";
import {
    sendMessage,
    getChatHistory,
    getAllChatHistory,
    connectWebSocket
} from "../../services/messengerService";

const ChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        (async () => {
            const data = await getAllChatHistory(); // ✅ giữ API đã kết nối
            setConversations(Array.isArray(data) ? data : []);
        })();
    }, []);

    const handleSelectConversation = async (conv) => {
        setSelectedConversation(conv);
        const convId = conv?.id ?? conv?.session_id ?? conv?.conversation_id;
        if (!convId) return;
        const data = await getChatHistory(convId); 
        setMessages(Array.isArray(data) ? data : []);


        // Kết nối WebSocket
        connectWebSocket((msg) => {
            // msg chính là res server gửi bằng websocket.send_json(res)
            setMessages((prev) => [...prev, msg]);
        });
    };

    const handleSendMessage = (value) => { 
        if (value.trim() === "") return;
        const newMessage = {
            id: Date.now(),
            content: value,
            sender_type: "admin",
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, newMessage]);
        sendMessage(selectedConversation.session_id, "admin", value);
    };

    return (
        <div className="flex h-screen bg-slate-100">
            {/* LEFT */}
            <Sidebar
                conversations={conversations}
                onSelect={handleSelectConversation}
            />

            {/* CENTER */}
            <div className="flex flex-col flex-1">
                <MainChat
                    messages={messages}
                    selectedConversation={selectedConversation}
                />
                <ChatInput onSend={handleSendMessage} />
            </div>

            {/* RIGHT INFO PANEL */}
            <aside className="w-[320px] h-screen shrink-0 border-l bg-white overflow-y-auto p-4 space-y-4">
                <InfoCard title="Thông tin khách hàng">
                    <div className="space-y-2 text-sm">
                        <label className="block text-slate-500">Họ tên:</label>
                        <input
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                            placeholder="Chưa cung cấp"
                            value={
                                selectedConversation?.full_name ||
                                ""
                            }
                            disabled
                        />
                        <label className="block text-slate-500">Số điện thoại:</label>
                        <input
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                            placeholder="Chưa cung cấp"
                            value={selectedConversation?.phone_number || ""}
                            disabled
                        />
                        <label className="block text-slate-500">Các thông tin khác:</label>
                        <textarea
                            className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 min-h-[90px]"
                            placeholder="Chưa có thông tin bổ sung"
                            value={selectedConversation?.notes || ""}
                            disabled
                        />
                    </div>
                </InfoCard>
            </aside>
        </div>
    );
};

function InfoCard({ title, children }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="font-semibold mb-2">📘 {title}</div>
            {children}
        </div>
    );
}

export default ChatPage;