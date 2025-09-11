import { useEffect, useState, useRef } from "react";
import {
    connectWebSocket,
    sendMessage,
    checkSession,
    disconnect,
    getChatHistory,
} from "../../services/messengerService";
import { Send } from 'lucide-react';

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [chatSessionId, setChatSessionId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const initChat = async () => {
            try {
                setIsLoading(true);
                const session = await checkSession();
                setChatSessionId(session);
                const history = await getChatHistory(session);
                setMessages(history);

                connectWebSocket((msg) => {
                    setMessages((prev) => [...prev, msg]);
                });
                setIsConnected(true);
            } catch (error) {
                console.error("Error initializing chat:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initChat();
        return () => disconnect();
    }, []);

    // Scroll xuống cuối khi messages thay đổi
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() === "") return;
        const newMsg = {
            sender_type: "customer",
            content: input,
            created_at: new Date(),
        };
        setMessages((prev) => [...prev, newMsg]);
        sendMessage(chatSessionId, "customer", input);
        setInput("");
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-200 to-blue-300 rounded-full opacity-20 blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-200 to-pink-300 rounded-full opacity-20 blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-full opacity-10 blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="chat-container w-full max-w-md lg:max-w-4xl xl:max-w-6xl mx-auto relative z-10">
                {/* Chat Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden h-[90vh] lg:h-[85vh] flex flex-col">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 lg:p-8 text-white relative overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-indigo-800/20"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <div className="w-12 lg:w-16 h-12 lg:h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                                    <span className="text-2xl lg:text-3xl">💬</span>
                                </div>
                                <div>
                                    <h2 className="text-xl lg:text-2xl font-bold mb-1">Chat Realtime</h2>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                                        <p className="text-blue-100 text-sm font-medium">
                                            {isConnected ? 'Đang kết nối' : 'Mất kết nối'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional info for larger screens */}
                            <div className="hidden lg:flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-100">Session:</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-lg font-mono text-xs">
                                        {chatSessionId ? `${chatSessionId.substring(0, 8)}...` : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-blue-100">Messages:</span>
                                    <span className="bg-white/20 px-3 py-1 rounded-lg font-bold">
                                        {messages.length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white p-4 lg:p-8 relative">
                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-500 font-medium">Đang tải cuộc trò chuyện...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <div className="w-16 h-16 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
                                    <span className="text-2xl">💭</span>
                                </div>
                                <p className="text-center font-medium">Chưa có tin nhắn nào</p>
                                <p className="text-sm text-gray-400 mt-1">Bắt đầu cuộc trò chuyện đầu tiên!</p>
                            </div>
                        ) : (
                            /* Messages */
                            <div className="max-w-4xl mx-auto space-y-4 lg:space-y-6">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                        <div className="flex items-end gap-3 max-w-xs sm:max-w-sm lg:max-w-2xl">
                                            {msg.sender_type !== 'customer' && (
                                                <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold text-white flex-shrink-0">
                                                    🤖
                                                </div>
                                            )}

                                            <div className={`px-4 lg:px-6 py-3 lg:py-4 rounded-2xl shadow-lg relative ${msg.sender_type === 'customer'
                                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                                }`}>
                                                {/* Sender label */}
                                                <div className={`text-xs font-semibold mb-2 ${msg.sender_type === 'customer' ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                    {msg.sender_type === 'customer' ? 'Bạn' : 'AI Assistant'}
                                                </div>

                                                {/* Message content */}
                                                <div className="text-sm lg:text-base leading-relaxed font-medium break-words">
                                                    {msg.content}
                                                </div>

                                                {/* Time */}
                                                <div className={`text-xs mt-2 ${msg.sender_type === 'customer' ? 'text-blue-200' : 'text-gray-400'
                                                    }`}>
                                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'Vừa xong'}
                                                </div>
                                            </div>

                                            {msg.sender_type === 'customer' && (
                                                <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs lg:text-sm font-bold text-white flex-shrink-0">
                                                    👤
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="bg-white border-t border-gray-200 p-4 lg:p-8 flex-shrink-0">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-3 lg:gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="w-full px-4 lg:px-6 py-3 lg:py-4 pr-12 lg:pr-16 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400 bg-gray-50 hover:bg-white text-gray-800 font-medium text-sm lg:text-base"
                                        placeholder="Nhập tin nhắn của bạn..."
                                        disabled={!isConnected}
                                    />
                                    <div className="absolute right-3 lg:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg lg:text-xl">
                                        💬
                                    </div>
                                </div>

                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || !isConnected}
                                    className="p-3 lg:p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <Send size={18} className="lg:w-5 lg:h-5" />
                                </button>
                            </div>

                            {/* Status and stats bar */}
                            <div className="flex items-center justify-between mt-4 lg:mt-6">
                                {/* Connection status */}
                                <div className="flex items-center gap-2 text-xs lg:text-sm text-gray-500">
                                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                                    <span>{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
                                </div>

                                {/* Additional info for larger screens */}
                                <div className="hidden lg:flex items-center gap-6 text-xs text-gray-400">
                                    <div className="flex items-center gap-2">
                                        <span>⚡</span>
                                        <span>Realtime</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>🔒</span>
                                        <span>Secure</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>📱</span>
                                        <span>Cross-platform</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-4 lg:mt-8">
                    <p className="text-sm lg:text-base text-gray-500">
                        Được hỗ trợ bởi AI • Phản hồi tức thời • Bảo mật cao
                    </p>
                </div>
            </div>
        </div>
    );
}