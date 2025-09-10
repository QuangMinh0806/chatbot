import React, { useState, useEffect, useRef } from "react";
import ManualModeModal from "../ManualModeModal";
import { updateStatus } from "../../services/messengerService";
const MainChat = ({ selectedConversation, messages, input, setInput, onSendMessage, isLoading, formatMessageTime }) => {
    const messagesEndRef = useRef(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [configData, setConfigData] = useState(null);
    const [mode, setMode] = useState(null);
    const handleTimeConfirm = async (mode) => {
        setMode("manual");
        const minutes = mode === 'manual-only' ? 0 :
            mode === '1-hour' ? 60 :
                mode === '4-hour' ? 240 :
                    mode === '8am-tomorrow'
                        ? Math.max(0, Math.ceil((new Date(new Date().setHours(8, 0, 0, 0) + 24 * 60 * 60 * 1000) - new Date()) / 60000))
                        : 30;

        setSelectedTime(minutes);
        const newConfig = {
            status: false, // thủ công
            time: new Date(new Date().getTime() + minutes * 60000).toISOString()
        };
        setConfigData(newConfig);
        console.log(newConfig);
        try {
            const configId = selectedConversation.session_id;
            await updateStatus(configId, newConfig);
            alert("Chuyển thành công sang chế độ thủ công")
        } catch (error) {
            console.error("Error updating config:", error);
        }
    };

    const handleBotMode = async () => {
        setMode("bot");

        const newConfig = {
            status: true
        };

        setConfigData(newConfig);

        try {
            await updateStatus(selectedConversation.session_id, newConfig);
            console.log("Bot mode config saved:", newConfig);
        } catch (err) {
            console.error("Error saving bot mode:", err);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            onSendMessage()
        }
    }

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (!selectedConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center text-gray-500">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">💬</div>
                    <p className="text-xl font-medium mb-2">Chọn một cuộc trò chuyện</p>
                    <p>Chọn cuộc trò chuyện từ sidebar để bắt đầu chat</p>
                </div>
            </div>
        );
    }

    const BotMode = () => (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mt-2">
            <h4 className="font-semibold text-green-700 mb-2">Chế độ Bot</h4>
            <p className="text-sm text-green-600">
                Bạn đang ở chế độ Bot. Hệ thống sẽ tự động trả lời tin nhắn khách hàng.
            </p>
        </div>
    );
    return (
        <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {selectedConversation.full_name ? selectedConversation.full_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{selectedConversation.full_name || "Khách hàng"}</h3>
                            <p className="text-sm text-gray-500">{selectedConversation.id}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setMode("manual")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === "manual"
                                ? "bg-yellow-600 text-white"
                                : "bg-yellow-500 text-white hover:bg-yellow-600"
                                }`}
                        >
                            Chế độ thủ công
                        </button>
                        <button
                            onClick={handleBotMode}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${mode === "bot"
                                ? "bg-green-600 text-white"
                                : "bg-green-500 text-white hover:bg-green-600"
                                }`}
                        >
                            Chế độ Bot
                        </button>
                        <button
                            onClick={() => setMode(null)}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                        >
                            Reset
                        </button>
                        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">Xóa tin nhắn</button>
                    </div>
                </div>
                {mode === "manual" && (
                    <ManualModeModal
                        onClose={() => setMode(null)}
                        onConfirm={handleTimeConfirm}
                    />
                )}
                {mode === "bot" && <BotMode />}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-500">Đang tải tin nhắn...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">💬</div>
                        <p className="text-lg font-medium mb-2">Chưa có tin nhắn nào</p>
                        <p className="text-sm">Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.sender_type === "admin"
                                        ? "bg-blue-500 text-white"
                                        : "bg-white text-gray-800 border border-gray-200"
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.sender_type === "admin" ? "text-blue-100" : "text-gray-500"}`}>
                                        {formatMessageTime(msg.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef}></div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Nhập tin nhắn của bạn..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isLoading}
                    />
                    <button
                        onClick={onSendMessage}
                        disabled={isLoading || input.trim() === ""}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "..." : "Gửi"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MainChat;
