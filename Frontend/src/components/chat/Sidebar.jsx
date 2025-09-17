import { useState } from "react";

const Sidebar = ({
    conversations,
    selectedConversation,
    onSelectConversation,
    formatTime,
    isLoading,
    tags,
    onTagSelect
}) => {
    const [openMenu, setOpenMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Filter conversations based on search term
    const filteredConversations = conversations.filter(conv =>
        (conv.name || "Khách hàng").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (conv.content || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full lg:w-80 bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border-r border-slate-200/60 overflow-hidden flex flex-col h-full max-w-sm lg:max-w-none shadow-xl">
            {/* Header with enhanced gradient */}
            <div className="p-4 lg:p-6 border-b border-slate-200/60 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                            <svg className="w-5 lg:w-6 h-5 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg lg:text-xl font-bold text-white">Cuộc trò chuyện</h2>
                            <p className="text-sm text-white/80">
                                <span className="font-semibold text-white/90">{filteredConversations.length}</span> cuộc trò chuyện
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Search Bar */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm cuộc trò chuyện..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 pl-12 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/30 bg-white/20 backdrop-blur-sm text-white placeholder-white/70 text-sm shadow-lg"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Conversations List with enhanced styling */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="text-center">
                            <div className="relative">
                                <div className="animate-spin rounded-full h-8 w-8 border-3 border-gradient-to-r from-blue-500 to-blue-600 border-t-transparent mx-auto mb-3"></div>
                                <div className="absolute inset-0 animate-pulse rounded-full h-8 w-8 bg-gradient-to-r from-blue-500/20 to-blue-600/20 mx-auto"></div>
                            </div>
                            <p className="text-sm text-slate-600 font-medium">Đang tải cuộc trò chuyện...</p>
                        </div>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-slate-700 mb-2 text-base">
                            {searchTerm ? "Không tìm thấy kết quả" : "Chưa có cuộc trò chuyện"}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {searchTerm ? "Thử tìm kiếm với từ khóa khác" : "Cuộc trò chuyện mới sẽ xuất hiện tại đây"}
                        </p>
                    </div>
                ) : (
                    <div className="p-2 space-y-2">
                        {filteredConversations.map((conv, index) => {
                            console.log(conv)
                            const convId = conv.id || conv.session_id || index;
                            return (
                                <div
                                    key={convId}
                                    className={`relative group rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${selectedConversation?.id === conv.id
                                        ? "bg-gradient-to-r from-blue-500/10 to-blue-500/10 shadow-lg ring-2 ring-blue-500/20 backdrop-blur-sm"
                                        : "bg-white/60 backdrop-blur-sm hover:bg-white/80 hover:shadow-md"
                                        }`}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        overflow: "visible"
                                    }}
                                >
                                    <div
                                        className="flex items-start space-x-4 p-4 pr-12"
                                        onClick={() => onSelectConversation(conv)}
                                    >
                                        {/* Enhanced Avatar */}
                                        <div className="relative flex-shrink-0">
                                            <div
                                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300 ${selectedConversation?.id === conv.id
                                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-400/30 shadow-blue-500/25"
                                                    : "bg-gradient-to-br from-slate-400 to-slate-500 group-hover:from-slate-500 group-hover:to-slate-600"
                                                    }`}
                                            >
                                                {conv.full_name?.charAt(0)?.toUpperCase() || "?"}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full shadow-sm transition-colors duration-300 ${selectedConversation?.id === conv.id ? "bg-green-500" : "bg-emerald-500"
                                                }`}></div>
                                        </div>

                                        {/* Enhanced Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3
                                                    className={`font-semibold truncate text-base transition-colors duration-300 ${selectedConversation?.id === conv.id
                                                        ? "text-blue-900"
                                                        : "text-slate-800 group-hover:text-slate-900"
                                                        }`}
                                                >
                                                    {conv.name || "Khách hàng"}
                                                </h3>
                                                <span className={`text-xs flex-shrink-0 font-medium transition-colors duration-300 ml-2 ${selectedConversation?.id === conv.id ? "text-blue-600" : "text-slate-500"
                                                    }`}>
                                                    {formatTime(conv.created_at)}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-600 truncate leading-relaxed group-hover:text-slate-700 transition-colors duration-300">
                                                {conv.content || "Chưa có tin nhắn"}
                                            </p>

                                            {/* Display tag if exists */}
                                            {conv.tag && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                                                        {conv.tag}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Menu Button - Fixed positioning */}
                                    <div className="absolute top-4 right-4 z-30">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenu(openMenu === convId ? null : convId);
                                            }}
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${openMenu === convId
                                                ? "bg-slate-200 text-slate-700"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/80 opacity-0 group-hover:opacity-100"
                                                }`}
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                            </svg>
                                        </button>
                                    </div>

                                    {/* Dropdown Menu - Moved outside and with higher z-index */}
                                    {openMenu === convId && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setOpenMenu(null)}
                                            ></div>
                                            <div className="absolute top-12 right-4 w-48 bg-white backdrop-blur-lg border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                                                <div className="p-2">
                                                    <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wide">
                                                        Gắn thẻ
                                                    </div>
                                                    {tags && tags.map((tag) => (
                                                        <div
                                                            key={tag.id}
                                                            className="px-3 py-2.5 hover:bg-slate-100 cursor-pointer text-sm rounded-xl transition-colors duration-200 flex items-center gap-2 text-slate-700 hover:text-slate-900"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onTagSelect(conv, tag);
                                                                setOpenMenu(null);
                                                            }}
                                                        >
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            {tag.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;