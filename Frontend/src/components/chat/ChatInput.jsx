import React, { useState } from "react";

const ChatInput = ({ onSend }) => {
    const [message, setMessage] = useState("");

    const submit = () => {
        const v = message.trim();
        if (!v) return;
        onSend?.(v);
        setMessage("");
    };

    return (
        <div className="border-t bg-white px-4 py-3 flex items-center gap-3">
            <input
                className="flex-1 h-12 rounded-full bg-slate-100 px-5 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/30 border border-slate-200"
                placeholder="Nhập tin nhắn của bạn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <button
                className="h-12 px-5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                onClick={submit}
                type="button"
            >
                Gửi
            </button>
        </div>
    );
};

export default ChatInput;