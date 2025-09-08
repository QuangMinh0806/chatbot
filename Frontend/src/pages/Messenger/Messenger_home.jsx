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
            console.log("123", history);
            console.log("123", messages);

            // Kết nối WebSocket
            connectWebSocket((msg) => {
                // msg chính là res server gửi bằng websocket.send_json(res)
                setMessages((prev) => [...prev, msg]);
            });
        };

        initChat();

        return () => disconnect();
    }, []);

    const handleSend = () => {
        if (input.trim() === "") return;
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
