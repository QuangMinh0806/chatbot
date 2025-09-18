import React, { useState, useEffect, useRef } from "react";
import ManualModeModal from "../ManualModeModal";
import { updateStatus, deleteMess } from "../../services/messengerService";

const MainChat = ({ selectedConversation, onUpdateConversation, messages, input, setInput, onSendMessage, isLoading, formatMessageTime, onMessagesUpdate }) => {
    const messagesEndRef = useRef(null);
    const [selectedTime, setSelectedTime] = useState(null);
    const [configData, setConfigData] = useState(null);
    const [mode, setMode] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);   // danh sách id được chọn
    const [messageList, setMessageList] = useState(messages);
    const [isSelectMode, setIsSelectMode] = useState(false); // chế độ chọn tin nhắn

    const toggleSelect = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedIds.length === messages.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(messages.map(msg => msg.id));
        }
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) {
            alert("Vui lòng chọn tin nhắn cần xóa!");
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} tin nhắn đã chọn?`)) {
            try {
                console.log(selectedIds)
                await deleteMess(selectedIds, selectedConversation.session_id);
                const updatedMessages = messageList.filter((msg) => !selectedIds.includes(msg.id));
                setMessageList(updatedMessages);
                setSelectedIds([]);
                setIsSelectMode(false);
                alert("Đã xóa tin nhắn thành công!");
                onMessagesUpdate(updatedMessages)
            } catch (error) {
                console.error("Error deleting messages:", error);
                alert("Có lỗi xảy ra khi xóa tin nhắn!");
            }
        }
    };

    const cancelSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds([]);
    };

    const handleTimeConfirm = async (mode) => {
        setMode("manual");
        const minutes = mode === 'manual-only' ? 0 :
            mode === '1-hour' ? 60 :
                mode === '4-hour' ? 240 :
                    mode === '8am-tomorrow'
                        ? Math.max(0, Math.ceil((new Date(new Date().setHours(8, 0, 0, 0) + 24 * 60 * 60 * 1000) - new Date()) / 60000))
                        : 30;

        const targetTime = new Date();
        targetTime.setMinutes(targetTime.getMinutes() + minutes);

        setSelectedTime(minutes);
        const newConfig = {
            status: false,
            time: targetTime.toLocaleString()
        };
        setConfigData(newConfig);
        try {
            const configId = selectedConversation.session_id;
            await updateStatus(configId, newConfig);

            onUpdateConversation({
                ...selectedConversation,
                status: newConfig.status.toString(),
            });

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

            onUpdateConversation({
                ...selectedConversation,
                status: newConfig.status.toString(),
            });
            alert("Đã chuyển sang chế độ tự động")
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

    useEffect(() => {
        setMessageList(messages);
    }, [messages]);

    if (!selectedConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <div className="text-center p-4 lg:p-8 max-w-md">
                    <div className="w-24 lg:w-32 h-24 lg:h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg">
                        <span className="text-3xl lg:text-4xl">💬</span>
                    </div>
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2 lg:mb-3">Chọn một cuộc trò chuyện</h3>
                    <p className="text-sm lg:text-base text-gray-600 mx-auto leading-relaxed">
                        Chọn cuộc trò chuyện từ sidebar để bắt đầu chat với khách hàng
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white h-full">
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-3 lg:p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:gap-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 lg:space-x-4">
                        <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-sm lg:text-lg shadow-lg">
                            {selectedConversation.name ? selectedConversation.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-gray-900 text-base lg:text-lg truncate">
                                {selectedConversation.name || "Khách hàng"}
                            </h3>
                            <p className="text-xs lg:text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-md inline-block">
                                {selectedConversation.id}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        {!isSelectMode ? (
                            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
                                <button
                                    onClick={() => setMode("manual")}
                                    className={`px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all flex-shrink-0 ${mode === "manual"
                                        ? "bg-yellow-500 text-white shadow-lg"
                                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:shadow-md"
                                        }`}
                                >
                                    🔧 Thủ công
                                </button>
                                <button
                                    onClick={handleBotMode}
                                    className={`px-3 lg:px-4 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all flex-shrink-0 ${mode === "bot"
                                        ? "bg-green-500 text-white shadow-lg"
                                        : "bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md"
                                        }`}
                                >
                                    🤖 Bot
                                </button>
                                <button
                                    onClick={handleBotMode}
                                    className="px-3 lg:px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-xs lg:text-sm font-semibold transition-all hover:shadow-md flex-shrink-0"
                                >
                                    🔄 Reset
                                </button>
                                <button
                                    className="px-3 lg:px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs lg:text-sm font-semibold transition-all hover:shadow-md flex-shrink-0"
                                    onClick={() => setIsSelectMode(true)}
                                    disabled={messages.length === 0}
                                >
                                    🗑️ Xóa
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 items-center">
                                <span className="text-sm font-medium text-gray-600">
                                    Đã chọn: {selectedIds.length}/{messages.length}
                                </span>
                                <button
                                    onClick={selectAll}
                                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 text-xs font-semibold transition-all"
                                >
                                    {selectedIds.length === messages.length ? '☑️ Bỏ chọn tất cả' : '☑️ Chọn tất cả'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={selectedIds.length === 0}
                                    className="px-3 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    🗑️ Xóa ({selectedIds.length})
                                </button>
                                <button
                                    onClick={cancelSelectMode}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-xs font-semibold transition-all"
                                >
                                    ❌ Hủy
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {mode === "manual" && (
                    <ManualModeModal
                        onClose={() => setMode(null)}
                        onConfirm={handleTimeConfirm}
                    />
                )}
            </div>

            {/* Select Mode Header */}
            {isSelectMode && (
                <div className="bg-red-50 border-b border-red-200 p-3">
                    <div className="text-center">
                        <p className="text-sm text-red-700 font-medium">
                            🗑️ Chế độ xóa tin nhắn - Nhấp vào tin nhắn để chọn
                        </p>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-2 lg:p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 lg:h-12 w-8 lg:w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                            <span className="text-gray-600 font-medium text-sm lg:text-base">Đang tải tin nhắn...</span>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 lg:p-8">
                        <div className="w-20 lg:w-24 h-20 lg:h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mb-4 lg:mb-6 shadow-lg">
                            <span className="text-2xl lg:text-3xl">💬</span>
                        </div>
                        <h4 className="text-lg lg:text-xl font-bold mb-2 lg:mb-3 text-gray-700">Chưa có tin nhắn nào</h4>
                        <p className="text-gray-500 text-center max-w-md leading-relaxed text-sm lg:text-base">
                            Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 lg:space-y-6 max-w-4xl mx-auto">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === "admin" || msg.sender_type === "bot" ? "justify-end" : "justify-start"
                                    }`}
                            >
                                <div className="flex flex-col items-start lg:items-start space-y-1 max-w-xs sm:max-w-sm lg:max-w-md">
                                    {/* Avatar + bubble */}
                                    <div className="flex items-end space-x-2 lg:space-x-3 w-full">
                                        {msg.sender_type !== "admin" && (
                                            <div className="w-6 lg:w-8 h-6 lg:h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs lg:text-sm font-semibold flex-shrink-0">
                                                👤
                                            </div>
                                        )}
                                        <div
                                            className={`relative px-3 lg:px-4 py-2 lg:py-3 rounded-2xl shadow-sm cursor-pointer transition-all ${isSelectMode
                                                ? selectedIds.includes(msg.id)
                                                    ? 'ring-2 ring-red-500 bg-red-50 border-2 border-red-500'
                                                    : 'hover:ring-2 hover:ring-red-300 hover:bg-red-25'
                                                : ''
                                                } ${msg.sender_type === "admin"
                                                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                                                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                                                }`}
                                            onClick={() => isSelectMode && toggleSelect(msg.id)}
                                        >
                                            {/* Checkbox chỉ hiển thị khi ở chế độ chọn */}
                                            {isSelectMode && (
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-red-500 rounded-full flex items-center justify-center shadow-lg">
                                                    {selectedIds.includes(msg.id) ? (
                                                        <span className="text-red-500 text-xs font-bold">✓</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">○</span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Hiển thị người gửi */}
                                            <p
                                                className={`text-[10px] lg:text-xs font-semibold mb-1 ${isSelectMode && selectedIds.includes(msg.id)
                                                    ? "text-red-600"
                                                    : msg.sender_type === "admin"
                                                        ? "text-blue-100"
                                                        : "text-gray-500"
                                                    }`}
                                            >
                                                {msg.sender_type === "admin"
                                                    ? "Admin"
                                                    : msg.sender_type === "bot"
                                                        ? "Bot"
                                                        : "Customer"}
                                            </p>

                                            {/* Nội dung tin nhắn */}
                                            <p className={`text-xs lg:text-sm leading-relaxed break-words ${isSelectMode && selectedIds.includes(msg.id)
                                                ? "text-red-800"
                                                : msg.sender_type === "admin"
                                                    ? "text-white"
                                                    : "text-gray-800"
                                                }`}>
                                                {msg.content}
                                            </p>

                                            {/* Thời gian */}
                                            <p
                                                className={`text-xs mt-1 lg:mt-2 ${isSelectMode && selectedIds.includes(msg.id)
                                                    ? "text-red-600"
                                                    : msg.sender_type === "admin"
                                                        ? "text-blue-100"
                                                        : "text-gray-500"
                                                    }`}
                                            >
                                                {formatMessageTime(msg.created_at)}
                                            </p>
                                        </div>
                                        {msg.sender_type === "admin" && (
                                            <div className="w-6 lg:w-8 h-6 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center text-xs lg:text-sm font-semibold text-white flex-shrink-0">
                                                👨‍💼
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div ref={messagesEndRef}></div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-3 lg:p-6 shadow-lg">
                <div className="flex space-x-2 lg:space-x-3 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="w-full px-3 lg:px-4 py-2 lg:py-3 pr-10 lg:pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-500 transition-all text-sm lg:text-base"
                            disabled={isLoading || isSelectMode}
                        />
                        <div className="absolute right-2 lg:right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            💬
                        </div>
                    </div>
                    <button
                        onClick={onSendMessage}
                        disabled={isLoading || input.trim() === "" || isSelectMode}
                        className="px-4 lg:px-6 py-2 lg:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex-shrink-0"
                    >
                        <span className="text-sm lg:text-base">{isLoading ? "⏳" : "🚀"}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MainChat;