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
    const messagesEndRef = useRef(null); // ref để scroll

    useEffect(() => {
        const initChat = async () => {
            const session = await checkSession();
            setChatSessionId(session);
            const history = await getChatHistory(session);
            setMessages(history);

            connectWebSocket((msg) => {
                setMessages((prev) => [...prev, msg]);
            });
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
        };
        setMessages((prev) => [...prev, newMsg]);
        sendMessage(chatSessionId, "customer", input);
        setInput("");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="chat-container w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-blue-500 text-white p-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            💬
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">Chat Realtime</h2>
                            <p className="text-blue-100 text-sm">Online now</p>
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div
                    className="chat-box h-96 overflow-y-auto bg-gray-50 p-4 space-y-4"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f3f4f6' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                >
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender_type === 'User' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${msg.sender_type === 'User'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-md'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                                }`}>
                                <div className={`text-xs font-medium mb-1 ${msg.sender_type === 'User' ? 'text-blue-100' : 'text-gray-500'
                                    }`}>
                                    {msg.sender_type}
                                </div>
                                <div className="text-sm leading-relaxed">{msg.content}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} /> {/* div để scroll đến cuối */}
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex items-center space-x-3">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
                            placeholder="Nhập tin nhắn..."
                        />
                        <button
                            onClick={handleSend}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-full hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
