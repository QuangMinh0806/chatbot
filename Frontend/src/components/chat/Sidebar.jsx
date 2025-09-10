import React from "react";

export default function Sidebar({ conversations = [], onSelect }) {
    return (
        <aside className="w-80 h-screen shrink-0 bg-gradient-to-b from-indigo-700 to-indigo-800 text-white">
            {/* Header */}
            <div className="px-4 py-4 border-b border-white/15 flex items-center justify-between">
                <div className="text-lg font-semibold">💬 Chat Sessions</div>
                <button
                    type="button"
                    className="text-xs px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 transition"
                    onClick={() => (window.location.href = "/logout")}
                >
                    Đăng xuất
                </button>
            </div>

            {/* Current user (dropdown look) */}
            <div className="px-4 py-3 border-b border-white/10">
                <div className="rounded-xl bg-white/10 p-3">
                    <div className="font-semibold">System Administrator</div>
                    <div className="text-white/80 text-sm">Super Admin</div>
                </div>
            </div>

            {/* List */}
            <div className="px-3 py-3 overflow-y-auto h-[calc(100vh-140px)] space-y-3">
                {conversations.length === 0 && (
                    <div className="text-white/80 text-sm px-2">
                        Chưa có cuộc trò chuyện
                    </div>
                )}

                {conversations.map((c) => {
                    const id = c.id ?? c.session_id ?? c.conversation_id;
                    const name =
                        c.full_name ||
                        c.customer_name ||
                        c.name ||
                        c.display_name ||
                        `User ${id ?? ""}`;
                    const platform = String(
                        c.platform || c.channel || "facebook"
                    ).toLowerCase();
                    const isFb = platform.includes("facebook");

                    return (
                        <button
                            key={id}
                            onClick={() => onSelect?.(c)}
                            className="w-full text-left rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 transition p-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-white line-clamp-1">
                                    {name}
                                </div>
                                <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${isFb
                                            ? "bg-blue-500/20 text-blue-100 border border-blue-400/30"
                                            : "bg-rose-500/20 text-rose-100 border border-rose-400/30"
                                        }`}
                                >
                                    {isFb ? "facebook" : "website"}
                                </span>
                            </div>

                            <div className="text-white/70 text-sm mt-0.5 line-clamp-1">
                                {c.content || c.last_message || "Chưa có tin nhắn"}
                            </div>

                            <div className="mt-2">
                                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Tự Động
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}