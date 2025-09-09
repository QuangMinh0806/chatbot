import { useEffect, useState } from "react";
import {
    connectWebSocket,
    sendMessage,
    checkSession,
    disconnect,
    getChatHistory,
} from "../../services/messengerService";

export default function ChatPage() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [chatSessionId, setChatSessionId] = useState(null);

    useEffect(() => {
        const initChat = async () => {
            // Lấy hoặc tạo session
            const session = await checkSession();
            setChatSessionId(session);

            const history = await getChatHistory(session.id);
            setMessages(history);

            // Kết nối WebSocket
            connectWebSocket((msg) => {
                // msg chính là res server gửi bằng websocket.send_json(res)
                setMessages((prev) => [...prev, msg]);
            });

        };

        initChat();
        return () => disconnect();
    }, []);
    console.log(messages)
    const handleSend = () => {
        if (input.trim() === "") return;

        // Thêm ngay vào UI
        const newMsg = {
            sender_type: "customer",
            content: input,
        };
        setMessages((prev) => [...prev, newMsg]);

        // Gửi lên server
        sendMessage(chatSessionId, "customer", input);

        setInput("");
    };

    return (
        <div className="chat-container" style={{ width: "400px", margin: "auto" }}>
            <h2>💬 Chat Realtime</h2>
            <div
                className="chat-box"
                style={{
                    border: "1px solid #ccc",
                    height: "300px",
                    overflowY: "scroll",
                    padding: "10px",
                }}
            >
                {messages.map((msg, idx) => (
                    <div key={idx}>
                        <b>{msg.sender_type}:</b> {msg.content}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: "10px", display: "flex" }}>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    style={{ flex: 1, padding: "5px" }}
                    placeholder="Nhập tin nhắn..."
                />
                <button onClick={handleSend} style={{ marginLeft: "5px" }}>
                    Gửi
                </button>
            </div>
        </div>
    );
}