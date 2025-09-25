import { useEffect, useState, useRef } from "react";
import {
    connectCustomerSocket,
    sendMessage,
    checkSession,
    disconnectCustomer,
    getChatHistory
} from "../../services/messengerService";
import { get_all_llms } from "../../services/llmService"
import { Send } from 'lucide-react';

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [chatSessionId, setChatSessionId] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const [isBotActive, setIsBotActive] = useState(true);
    const [isWaitingBot, setIsWaitingBot] = useState(false);
    const [botName, setBotName] = useState();

    useEffect(() => {
        const initChat = async () => {
            try {
                setIsLoading(true);
                const session = await checkSession();
                setChatSessionId(session);
                const history = await getChatHistory(session);
                setMessages(history);
                const mess = await get_all_llms();
                console.log("LLM List:", mess);
                setBotName(mess[0].botName);
                console.log("Bot Name:", mess[0].botName);
                if (history.length === 0) {
                    setMessages([{
                        sender_type: "bot",
                        content: mess[0].system_greeting,
                        created_at: new Date(),
                        is_temp: true // flag để biết không lưu DB
                    }]);
                }

                connectCustomerSocket((msg) => {
                    if (msg.sender_type == "bot") {
                        setIsBotActive(true);
                        setIsWaitingBot(false);
                    }
                    else if (msg.sender_type == "admin") {
                        setIsBotActive(false);
                        setIsWaitingBot(false);
                    }
                    else if (msg.sender_type == "customer") {
                        if (msg.session_status == "false") {
                            setIsBotActive(false);
                            setIsWaitingBot(false);
                            console.log("Nhận khi chặn", msg)
                        }
                        return;
                    }

                    console.log("📩 Customer nhận:", msg);
                    setMessages((prev) => [...prev, msg]);
                });

                console.log("✅ Chat initialized");
                setIsConnected(true);
            } catch (error) {
                console.error("Error initializing chat:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initChat();
        return () => disconnectCustomer();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (input.trim() === "" || (isBotActive && isWaitingBot)) return;
        const newMsg = {
            sender_type: "customer",
            content: input,
            created_at: new Date(),
        };
        setMessages((prev) => [...prev, newMsg]);
        sendMessage(chatSessionId, "customer", input, false);
        setInput("");

        if (isBotActive) setIsWaitingBot(true);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-2 md:p-4">
            <div className="chat-container w-full max-w-5xl mx-auto">
                {/* Chat Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[95vh] flex flex-col">
                    {/* Header - Compact */}
                    <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-lg">💬</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Chat Realtime</h2>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <p className="text-gray-600 text-xs">
                                            {isConnected ? 'Đang kết nối' : 'Mất kết nối'} • {messages.length} tin nhắn
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Session info - compact */}
                            <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span>Session:</span>
                                    <span className="bg-gray-100 px-2 py-1 rounded font-mono">
                                        {chatSessionId || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chat Messages - Optimized */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-2 relative">
                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                <p className="text-gray-500 text-sm">Đang tải cuộc trò chuyện...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center mb-3">
                                    <span className="text-lg">💭</span>
                                </div>
                                <p className="text-center font-medium">Chưa có tin nhắn nào</p>
                                <p className="text-xs text-gray-400 mt-1">Bắt đầu cuộc trò chuyện đầu tiên!</p>
                            </div>
                        ) : (
                            /* Messages - Compact Layout */
                            <div className="max-w-4xl mx-auto space-y-3">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                        <div className="flex items-start gap-2 max-w-[75%] md:max-w-[65%]">
                                            {/* Avatar - smaller */}
                                            {msg.sender_type !== 'customer' && (
                                                <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 mt-1">
                                                    🤖
                                                </div>
                                            )}

                                            <div className={`px-3 py-2 rounded-lg shadow-sm relative ${msg.sender_type === 'customer'
                                                ? 'bg-blue-600 text-white rounded-br-sm'
                                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                                                }`}>
                                                {/* Sender label - compact */}
                                                <div className={`text-xs font-medium mb-1 ${msg.sender_type === 'customer' ? 'text-blue-100' : 'text-gray-500'
                                                    }`}>
                                                    {msg.sender_type === 'customer' ? 'Bạn' : botName}
                                                </div>

                                                {/* Message content */}
                                                <div className="space-y-1">
                                                    {msg.image?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {msg.image.map((img, index) => (
                                                                <img
                                                                    key={index}
                                                                    src={img}
                                                                    alt={`msg-img-${index}`}
                                                                    className="rounded-lg max-w-xs object-cover shadow-sm"
                                                                    onError={(e) => {
                                                                        console.log('Image load error:', img);
                                                                        e.target.style.display = 'none';
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="text-sm leading-relaxed break-words whitespace-pre-line">
                                                        {msg.content}
                                                    </div>
                                                </div>

                                                {/* Time - compact */}
                                                <div className={`text-xs mt-1 ${msg.sender_type === 'customer' ? 'text-blue-200' : 'text-gray-400'
                                                    }`}>
                                                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : 'Vừa xong'}
                                                </div>
                                            </div>

                                            {msg.sender_type === 'customer' && (
                                                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 mt-1">
                                                    👤
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isWaitingBot && (
                                    <div className="flex justify-start">
                                        <div className="flex items-start gap-2">
                                            <div className="w-7 h-7 bg-gray-500 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0">
                                                🤖
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm px-3 py-2">
                                                <div className="flex space-x-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area - Compact */}
                    <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0">
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-400 bg-white text-gray-800 text-sm"
                                        placeholder="Nhập tin nhắn của bạn..."
                                        disabled={!isConnected}
                                    />
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                                        💬
                                    </div>
                                </div>

                                <button
                                    onClick={handleSend}
                                    disabled={
                                        !input.trim() || (isBotActive && isWaitingBot) || !isConnected
                                    }
                                    className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={16} />
                                </button>
                            </div>

                            {/* Status bar - compact */}
                            <div className="flex items-center justify-between mt-2">
                                {/* Connection status */}
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <span>{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
                                </div>

                                {/* Additional info */}
                                <div className="hidden lg:flex items-center gap-3 text-xs text-gray-400">
                                    <span>Realtime</span>
                                    <span>•</span>
                                    <span>Secure</span>
                                    <span>•</span>
                                    <span>AI Powered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-4">
                    <p className="text-xs text-gray-500">
                        Được hỗ trợ bởi AI • Phản hồi tức thời • Bảo mật cao
                    </p>
                </div>
            </div>
        </div>
    );
}