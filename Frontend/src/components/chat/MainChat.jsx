import React, { useState, useEffect, useRef } from "react";
import ManualModeModal from "../ManualModeModal";
import CountdownTimer from "../CountdownTimer";
import { updateStatus, deleteMess } from "../../services/messengerService";

const MainChat = ({
    selectedConversation,
    onUpdateConversation,
    messages,
    input,
    setInput,
    onSendMessage,
    isLoading,
    formatMessageTime,
    onMessagesUpdate
}) => {
    const messagesEndRef = useRef(null);
    const [mode, setMode] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Reset selection when conversation changes (but keep conversation selected)
    useEffect(() => {
        setSelectedIds([]);
        setIsSelectMode(false);
        // Don't reset mode when conversation changes - only reset selection states
    }, [selectedConversation?.id]);

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedIds(prev =>
            prev.length === messages.length ? [] : messages.map(msg => msg.id)
        );
    };

    const handleDelete = async () => {
        if (selectedIds.length === 0) return;

        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn xóa ${selectedIds.length} tin nhắn đã chọn?`
        );

        if (!confirmed) return;

        try {
            await deleteMess(selectedIds, selectedConversation.session_id);

            // Reset selection state BEFORE calling parent update
            setSelectedIds([]);
            setIsSelectMode(false);

            // Update parent component with filtered messages
            const updatedMessages = messages.filter(msg => !selectedIds.includes(msg.id));
            onMessagesUpdate(updatedMessages);

            alert("Đã xóa tin nhắn thành công!");
        } catch (error) {
            console.error("Error deleting messages:", error);
            alert("Có lỗi xảy ra khi xóa tin nhắn!");
        }
    };

    const cancelSelectMode = () => {
        setIsSelectMode(false);
        setSelectedIds([]);
    };

    const handleModeChange = async (newMode) => {
        try {
            let config;

            if (newMode === "bot") {
                config = { status: "true" };
                setMode("bot");
            } else {
                // Manual mode
                const minutes = newMode === 'manual-only' ? 0 :
                    newMode === '1-hour' ? 60 :
                        newMode === '4-hour' ? 240 :
                            newMode === '8am-tomorrow'
                                ? Math.max(0, Math.ceil((new Date(new Date().setHours(8, 0, 0, 0) + 24 * 60 * 60 * 1000) - new Date()) / 60000))
                                : 30;

                const targetTime = new Date();
                targetTime.setMinutes(targetTime.getMinutes() + minutes);

                config = {
                    status: "false",
                    time: targetTime.toLocaleString()
                };
                setMode("manual");
            }

            await updateStatus(selectedConversation.session_id, config);

            onUpdateConversation({
                ...selectedConversation,
                status: config.status.toString(),
                time: config.time
            });

            alert(`Đã chuyển sang chế độ ${newMode === "bot" ? "tự động" : "thủ công"}`);
        } catch (error) {
            console.error("Error updating mode:", error);
            alert("Có lỗi xảy ra khi thay đổi chế độ!");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
        }
    };

    if (!selectedConversation) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center p-8 max-w-md">
                    <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <span className="text-2xl sm:text-4xl">💬</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">
                        Chọn một cuộc trò chuyện
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        Chọn cuộc trò chuyện từ sidebar để bắt đầu chat với khách hàng
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white h-full">
            {/* Chat Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="p-4 sm:p-6">
                    {/* Top Row: User Info */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg">
                                {selectedConversation.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-900 text-lg sm:text-xl truncate">
                                    {selectedConversation.name || "Khách hàng"}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg inline-block mt-1">
                                    {selectedConversation.id}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${selectedConversation.status === "true"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${selectedConversation.status === "true"
                                    ? "bg-green-500"
                                    : "bg-yellow-500"
                                    }`}></div>
                                {selectedConversation.status === "true" ? "Bot hoạt động" : "Chế độ thủ công"}
                            </div>
                        </div>
                    </div>

                    {/* Middle Row: Countdown Timer (if in manual mode) */}
                    {selectedConversation.status === "false" && selectedConversation.time && (
                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                        <span className="text-orange-600 text-lg">⏱️</span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800 text-sm">
                                            Thời gian kích hoạt lại chatbot
                                        </h4>
                                        <p className="text-xs text-gray-600">
                                            Bot sẽ tự động hoạt động trở lại sau khi hết thời gian
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-white border border-orange-200 rounded-lg shadow-sm">
                                    <div className="text-lg font-bold text-orange-600 font-mono">
                                        <CountdownTimer endTime={selectedConversation.time} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Row: Action Buttons */}
                    <div className="flex items-center justify-between">
                        {!isSelectMode ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    onClick={() => setMode("manual")}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md transform hover:scale-105 ${selectedConversation.status === "false"
                                        ? "bg-yellow-500 text-white shadow-lg"
                                        : "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                                        }`}
                                >
                                    <span className="text-base">🔧</span>
                                    <span>Thủ công</span>
                                </button>

                                <button
                                    onClick={() => handleModeChange("bot")}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md transform hover:scale-105 ${selectedConversation.status === "true"
                                        ? "bg-green-500 text-white shadow-lg"
                                        : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                        }`}
                                >
                                    <span className="text-base">🤖</span>
                                    <span>Bot</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <span className="text-sm font-semibold text-blue-700">
                                        Đã chọn: {selectedIds.length}/{messages.length}
                                    </span>
                                </div>

                                <button
                                    onClick={selectAll}
                                    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    {selectedIds.length === messages.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                                </button>

                                <button
                                    onClick={handleDelete}
                                    disabled={selectedIds.length === 0}
                                    className="px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex items-center gap-2"
                                >
                                    <span>🗑️</span>
                                    <span>Xóa ({selectedIds.length})</span>
                                </button>

                                <button
                                    onClick={cancelSelectMode}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    Hủy
                                </button>
                            </div>
                        )}

                        {/* Delete Mode Toggle Button */}
                        {!isSelectMode && (
                            <button
                                onClick={() => setIsSelectMode(true)}
                                disabled={messages.length === 0}
                                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-105"
                            >
                                <span className="text-base">🗑️</span>
                                <span>Xóa tin nhắn</span>
                            </button>
                        )}
                    </div>
                </div>

                {mode === "manual" && (
                    <ManualModeModal
                        onClose={() => setMode(null)}
                        onConfirm={handleModeChange}
                    />
                )}
            </header>

            {/* Select Mode Banner */}
            {isSelectMode && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-200 p-4">
                    <div className="flex items-center justify-center gap-2 text-red-700">
                        <span className="text-lg">🗑️</span>
                        <p className="text-sm font-semibold">
                            Chế độ xóa tin nhắn - Nhấp vào tin nhắn để chọn
                        </p>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-4 sm:p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                            <span className="text-gray-600 font-medium">Đang tải tin nhắn...</span>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                            <span className="text-3xl">💬</span>
                        </div>
                        <h4 className="text-xl font-bold mb-3 text-gray-700">Chưa có tin nhắn nào</h4>
                        <p className="text-gray-500 text-center max-w-md leading-relaxed">
                            Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender_type === "admin" || msg.sender_type === "bot"
                                    ? "justify-end"
                                    : "justify-start"
                                    }`}
                            >
                                <div className="flex items-end gap-2 sm:gap-3 max-w-xs sm:max-w-md lg:max-w-lg">
                                    {/* Customer Avatar */}
                                    {msg.sender_type !== "admin" && (
                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                            👤
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        className={`relative px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-sm transition-all ${msg.sender_type === "admin"
                                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md"
                                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-md"
                                            } ${isSelectMode
                                                ? "cursor-pointer hover:ring-2 hover:ring-red-300"
                                                : ""
                                            } ${selectedIds.includes(msg.id)
                                                ? "ring-2 ring-red-500 bg-red-50 border-red-500"
                                                : ""
                                            }`}
                                        onClick={() => isSelectMode && toggleSelect(msg.id)}
                                    >
                                        {/* Selection Checkbox */}
                                        {isSelectMode && (
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-red-500 rounded-full flex items-center justify-center shadow-lg">
                                                {selectedIds.includes(msg.id) ? (
                                                    <span className="text-red-500 text-xs">✓</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">○</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Sender Label */}
                                        <p className={`text-xs font-semibold mb-1 opacity-75 ${selectedIds.includes(msg.id)
                                            ? "text-red-600"
                                            : msg.sender_type === "admin"
                                                ? "text-blue-100"
                                                : "text-gray-500"
                                            }`}>
                                            {msg.sender_type === "admin" ? "Admin" :
                                                msg.sender_type === "bot" ? "Bot" : "Customer"}
                                        </p>

                                        {/* Message Content */}
                                        <p className={`text-sm leading-relaxed break-words ${selectedIds.includes(msg.id)
                                            ? "text-red-800"
                                            : msg.sender_type === "admin"
                                                ? "text-white"
                                                : "text-gray-800"
                                            }`}>
                                            {msg.content}
                                        </p>

                                        {/* Timestamp */}
                                        <p className={`text-xs mt-2 opacity-75 ${selectedIds.includes(msg.id)
                                            ? "text-red-600"
                                            : msg.sender_type === "admin"
                                                ? "text-blue-100"
                                                : "text-gray-500"
                                            }`}>
                                            {formatMessageTime(msg.created_at)}
                                        </p>
                                    </div>

                                    {/* Admin Avatar */}
                                    {msg.sender_type === "admin" && (
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                                            👨‍💼
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </main>

            {/* Input Area */}
            <footer className="bg-white border-t border-gray-200 p-4 sm:p-6 shadow-lg">
                <div className="flex gap-3 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Nhập tin nhắn..."
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-500 transition-all text-sm sm:text-base"
                            disabled={isLoading || isSelectMode}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            💬
                        </div>
                    </div>
                    <button
                        onClick={onSendMessage}
                        disabled={isLoading || !input.trim() || isSelectMode}
                        className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex-shrink-0"
                    >
                        <span className="text-sm sm:text-base">{isLoading ? "⏳" : "🚀"}</span>
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default MainChat;