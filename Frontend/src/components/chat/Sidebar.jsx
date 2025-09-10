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
    console.log("conv ", conversations)

    return (
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Cuộc trò chuyện</h2>
                <p className="text-sm text-gray-500 mt-1">{conversations.length} cuộc trò chuyện</p>
            </div>

            <div className="divide-y divide-gray-100">
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <div className="text-4xl mb-2">📭</div>
                        <p>Chưa có cuộc trò chuyện nào</p>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <div
                            key={conv.id || conv.session_id}
                            onClick={() => onSelectConversation(conv)}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conv.id ? "bg-blue-50 border-r-2 border-blue-500" : ""
                                }`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold flex-shrink-0">
                                    {conv.full_name?.charAt(0) || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-medium text-gray-800 truncate">{conv.full_name || "Khách hàng"}</h3>
                                        <span className="text-xs text-gray-500 flex-shrink-0">{formatTime(conv.created_at)}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 truncate mb-2">{conv.content || "Chưa có tin nhắn"}</p>
                                    {/* <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500">
                                            {getPlatformIcon(conv.platform)} {conv.platform || "website"}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(conv.status)}`}>
                                            {getStatusText(conv.status)}
                                        </span>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Sidebar