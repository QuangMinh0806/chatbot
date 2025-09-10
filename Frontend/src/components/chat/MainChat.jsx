import React, { useEffect, useMemo, useRef } from "react";

export default function MainChat({ messages = [], selectedConversation }) {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, selectedConversation]);

    const title = useMemo(() => {
        if (!selectedConversation) return "Chọn một cuộc trò chuyện";
        const c = selectedConversation;
        return (
            c.full_name ||
            c.customer_name ||
            c.name ||
            c.display_name ||
            `User ${c.id ?? c.session_id ?? ""}`
        );
    }, [selectedConversation]);

    // Không chọn conversation -> trạng thái trống (giống ảnh)
    if (!selectedConversation) {
        return (
            <div className="flex-1 flex flex-col bg-slate-50">
                {/* thanh nút chế độ */}
                <div className="px-6 py-3 border-b bg-white">
                    <div className="flex items-center gap-3">
                        <button className="px-3 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 text-sm">
                            Chế độ thủ công
                        </button>
                        <button className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm">
                            Chế độ Bot
                        </button>
                        <button className="px-3 py-1.5 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
                            Reset
                        </button>
                    </div>
                </div>

                <div className="flex-1 grid place-items-center">
                    <div className="text-center text-slate-500">
                        <div className="font-semibold mb-1">{title}</div>
                        <div className="text-sm">
                            Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Đã chọn conversation
    return (
        <div className="flex-1 flex flex-col bg-slate-50">
            {/* Header + nút chế độ */}
            <div className="px-6 py-3 bg-white border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="font-semibold text-slate-800">{title}</div>
                        <div className="text-sm text-slate-500">
                            ID: {selectedConversation.id ?? selectedConversation.session_id}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-3 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 text-sm">
                            Chế độ thủ công
                        </button>
                        <button className="px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 text-sm">
                            Chế độ Bot
                        </button>
                        <button className="px-3 py-1.5 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm">
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400">Chưa có tin nhắn</div>
                )}

                {messages.map((msg) => {
                    const isCustomer =
                        msg.sender_type === "customer" || msg.role === "user";
                    const text = msg.content ?? msg.text ?? "";
                    const time = msg.created_at
                        ? new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                        : "";

                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}
                        >
                            <div
                                className={[
                                    "max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm",
                                    isCustomer
                                        ? "bg-white text-slate-800 rounded-bl-sm border border-slate-200"
                                        : "bg-blue-600 text-white rounded-br-sm",
                                ].join(" ")}
                            >
                                <div className="whitespace-pre-wrap">{text}</div>
                                {time && (
                                    <div
                                        className={`text-[11px] opacity-70 mt-1 ${isCustomer ? "text-slate-500" : "text-blue-100"
                                            }`}
                                    >
                                        {time}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}