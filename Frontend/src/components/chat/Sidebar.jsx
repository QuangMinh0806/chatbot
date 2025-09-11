const Sidebar = ({
    conversations,
    selectedConversation,
    onSelectConversation,
    formatTime,
    getPlatformIcon,
    getStatusColor,
    getStatusText,
    isLoading,
}) => {

    return (
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 overflow-hidden flex flex-col h-full max-w-sm lg:max-w-none">
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <span className="text-white text-base lg:text-lg">💬</span>
                    </div>
                    <div>
                        <h2 className="text-lg lg:text-xl font-bold text-gray-900">Cuộc trò chuyện</h2>
                        <p className="text-xs lg:text-sm text-gray-600">
                            <span className="font-semibold text-blue-600">{conversations.length}</span> cuộc trò chuyện
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="w-full px-3 lg:px-4 py-2 pl-8 lg:pl-10 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    />
                    <div className="absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        🔍
                    </div>
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-6 lg:h-8 w-6 lg:w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
                            <p className="text-xs lg:text-sm text-gray-500">Đang tải...</p>
                        </div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-8 lg:py-12 px-4 lg:px-6">
                        <div className="w-12 lg:w-16 h-12 lg:h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-3 lg:mb-4">
                            <span className="text-xl lg:text-2xl">📭</span>
                        </div>
                        <h3 className="font-semibold text-gray-700 mb-2 text-sm lg:text-base">Chưa có cuộc trò chuyện</h3>
                        <p className="text-xs lg:text-sm text-gray-500">Cuộc trò chuyện sẽ xuất hiện tại đây</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id || conv.session_id}
                                onClick={() => onSelectConversation(conv)}
                                className={`p-3 lg:p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 active:bg-gray-100 ${selectedConversation?.id === conv.id
                                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-r-4 border-blue-500"
                                    : ""
                                    }`}
                            >
                                <div className="flex items-start space-x-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-10 lg:w-12 h-10 lg:h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm lg:text-lg shadow-md ${selectedConversation?.id === conv.id
                                            ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                                            : "bg-gradient-to-br from-gray-400 to-gray-500"
                                            }`}>
                                            {conv.full_name?.charAt(0) || "?"}
                                        </div>
                                        {/* Online status indicator */}
                                        <div className="absolute -bottom-1 -right-1 w-3 lg:w-4 h-3 lg:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Name and Time */}
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`font-semibold truncate text-sm lg:text-base pr-2 ${selectedConversation?.id === conv.id
                                                ? "text-blue-900"
                                                : "text-gray-900"
                                                }`}>
                                                {conv.full_name || "Khách hàng"}
                                            </h3>
                                            <span className="text-xs text-gray-500 flex-shrink-0 font-medium">
                                                {formatTime(conv.created_at)}
                                            </span>
                                        </div>

                                        {/* Last Message */}
                                        <p className="text-xs lg:text-sm text-gray-600 truncate mb-2 lg:mb-3 leading-relaxed">
                                            {conv.content || "Chưa có tin nhắn"}
                                        </p>

                                        {/* New message indicator */}
                                        {conv.unread_count > 0 && (
                                            <div className="flex justify-end">
                                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                                                    {conv.unread_count}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Sidebar