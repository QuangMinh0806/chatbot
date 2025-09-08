import React, { useState } from "react";

const ChatInput = ({ onSend }) => {
    const [message, setMessage] = useState("");

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message);
        setMessage("");
    };

    return (
        <div className="p-4 border-t bg-white flex">
            <input
                className="flex-1 border rounded px-3 py-2 mr-2"
                placeholder="Nhập tin nhắn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
                className="bg-blue-500 text-white px-4 py-2 rounded"
                onClick={handleSend}
            >
                Gửi
            </button>
        </div>
    );
};

export default ChatInput;
