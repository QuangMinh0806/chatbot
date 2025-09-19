import { useState, useRef, useEffect } from "react";
import Header from "./Header";
import { Plus } from "lucide-react";

const Sidebar = ({
    conversations,
    selectedConversation,
    onSelectConversation,
    formatTime,
    getPlatformIcon,
    getStatusColor,
    getStatusText,
    isLoading,
    tags,
    onTagSelect,
    onDeleteConversations,
}) => {
    const [openMenu, setOpenMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    // State cho select mode
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedConversationIds, setSelectedConversationIds] = useState([]);
    const menuRef = useRef(null);

    // Function để mở/đóng menu
    const handleOpenMenu = (convId, event) => {
        if (event) {
            event.stopPropagation();
        }
        console.log("🔧 Opening menu for conversation:", convId);
        setOpenMenu(openMenu === convId ? null : convId);
    };

    // Function để đóng menu
    const handleCloseMenu = () => {
        console.log("🔧 Closing menu");
        setOpenMenu(null);
    };

    // Callback từ Header component
    const handleSelectModeChange = (newMode, newSelectedIds = []) => {
        console.log("📝 Select mode changed:", { newMode, newSelectedIds });
        setIsSelectMode(newMode);
        setSelectedConversationIds(newSelectedIds);
        // Đóng menu khi chuyển sang select mode
        if (newMode) {
            setOpenMenu(null);
        }
    };

    // Callback để toggle selection của conversation
    const handleToggleConversationSelection = (convId) => {
        console.log("🔄 Toggling conversation selection:", convId);

        const newSelected = selectedConversationIds.includes(convId)
            ? selectedConversationIds.filter(id => id !== convId)
            : [...selectedConversationIds, convId];

        console.log("📋 New selected conversations:", newSelected);
        setSelectedConversationIds(newSelected);

        // Thông báo cho Header component về thay đổi
        if (menuRef.current && menuRef.current.updateSelection) {
            menuRef.current.updateSelection(newSelected);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside the menu area
            if (openMenu && !event.target.closest(`[data-menu-id="${openMenu}"]`)) {
                handleCloseMenu();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenu]);

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = searchTerm === "" ||
            conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.full_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = selectedCategory === "all" || conv.tag_name === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const displayConversations = conversations.length > 0 ? filteredConversations : [];

    const defaultFormatTime = (date) => {
        if (!date) return "Vừa xong";
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        return `${days} ngày trước`;
    };

    const timeFormatter = formatTime || defaultFormatTime;

    return (
        <div className="w-full lg:w-80 bg-gradient-to-br from-slate-50 to-slate-100/50 backdrop-blur-sm border-r border-slate-200/60 overflow-hidden flex flex-col h-full max-w-sm lg:max-w-none shadow-xl">
            {/* Header */}
            <Header
                displayConversations={displayConversations}
                searchTerm={searchTerm}
                selectedCategory={selectedCategory}
                tags={tags}
                setSearchTerm={setSearchTerm}
                setSelectedCategory={setSelectedCategory}
                onDeleteConversations={onDeleteConversations}
                ref={menuRef}
                onSelectModeChange={handleSelectModeChange}
                // Truyền thêm state hiện tại
                isSelectMode={isSelectMode}
                selectedConversationIds={selectedConversationIds}
            />

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse bg-white/50 rounded-2xl p-4">
                                <div className="flex space-x-3">
                                    <div className="rounded-xl bg-slate-300 w-11 h-11"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-slate-300 rounded w-3/4"></div>
                                        <div className="h-3 bg-slate-300 rounded w-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : displayConversations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <div className="text-4xl mb-2">💬</div>
                        <p>Chưa có cuộc hội thoại nào</p>
                    </div>
                ) : (
                    displayConversations.map((conv, index) => {
                        // Use session_id as primary identifier
                        const convId = conv.session_id || conv.id || index;
                        // Fix comparison logic - use session_id consistently
                        const isSelected = selectedConversation?.session_id === conv.session_id;
                        const isMenuOpen = openMenu === convId;

                        // Check if conversation is selected for deletion
                        const isSelectedForDeletion = isSelectMode && selectedConversationIds.includes(convId);

                        return (
                            <div
                                key={convId}
                                data-menu-id={convId}
                                className={`relative group rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.01] ${isMenuOpen ? "z-[10000]" : "z-10"
                                    } ${
                                    // Different styling for select mode
                                    isSelectMode ? (
                                        isSelectedForDeletion
                                            ? "bg-gradient-to-r from-red-50 to-pink-50 shadow-lg ring-2 ring-red-200/50 backdrop-blur-sm"
                                            : "bg-white/70 backdrop-blur-sm hover:bg-gray-100/90 hover:shadow-md"
                                    ) : (
                                        isSelected
                                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200/50 backdrop-blur-sm"
                                            : "bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-md"
                                    )
                                    }`}
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                }}
                            >
                                <div
                                    className="flex items-start space-x-3 p-4 pr-12"
                                    onClick={() => {
                                        console.log("🖱️ Conversation clicked:", { convId, isSelectMode });

                                        // Different behavior in select mode
                                        if (isSelectMode) {
                                            // Toggle selection for deletion
                                            handleToggleConversationSelection(convId);
                                        } else {
                                            // Normal conversation selection
                                            onSelectConversation && onSelectConversation(conv);
                                        }
                                    }}
                                >
                                    {/* Checkbox in select mode */}
                                    {isSelectMode && (
                                        <div className="flex-shrink-0 flex items-center justify-center w-11 h-11">
                                            <div
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelectedForDeletion
                                                    ? "bg-red-500 border-red-500 text-white"
                                                    : "border-gray-300 hover:border-red-400"
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleConversationSelection(convId);
                                                }}
                                            >
                                                {isSelectedForDeletion && (
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Enhanced Avatar - Hide in select mode */}
                                    {!isSelectMode && (
                                        <div className="relative flex-shrink-0">
                                            {/* Avatar */}
                                            <div
                                                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 ${isSelected
                                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-300/40 shadow-blue-500/25 scale-105"
                                                    : "bg-gradient-to-br from-slate-400 to-slate-500 group-hover:from-slate-500 group-hover:to-slate-600 group-hover:scale-105"
                                                    }`}
                                            >
                                                {(conv.name || conv.full_name || "K")?.charAt(0)?.toUpperCase() || "?"}
                                            </div>

                                            {/* Action button */}
                                            <div className="mt-3 flex justify-center">
                                                <button
                                                    onClick={(e) => handleOpenMenu(convId, e)}
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm ${isMenuOpen
                                                        ? "bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900 shadow-md"
                                                        : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200"
                                                        }`}
                                                >
                                                    <Plus className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-45" : ""}`} />
                                                    tag
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Enhanced Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <h3
                                                className={`font-semibold truncate text-sm transition-colors duration-300 ${isSelectMode ? (
                                                    isSelectedForDeletion
                                                        ? "text-red-900"
                                                        : "text-slate-800 group-hover:text-slate-900"
                                                ) : (
                                                    isSelected
                                                        ? "text-blue-900"
                                                        : "text-slate-800 group-hover:text-slate-900"
                                                )
                                                    }`}
                                            >
                                                {conv.name || conv.full_name || "Khách hàng"}
                                            </h3>
                                            <span className={`text-xs flex-shrink-0 font-medium transition-colors duration-300 ml-2 ${isSelectMode ? (
                                                isSelectedForDeletion
                                                    ? "text-red-600"
                                                    : "text-slate-500 group-hover:text-slate-600"
                                            ) : (
                                                isSelected ? "text-blue-600" : "text-slate-500 group-hover:text-slate-600"
                                            )
                                                }`}>
                                                {timeFormatter(conv.created_at)}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 truncate leading-relaxed group-hover:text-slate-700 transition-colors duration-300 mb-2">
                                            {conv.content || "Chưa có tin nhắn"}
                                        </p>

                                        {/* Display tag if exists - Hide in select mode */}
                                        {!isSelectMode && conv.tag_name && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                                                    {conv.tag_name}
                                                </span>
                                            </div>
                                        )}

                                        {/* Show selected count in select mode */}
                                        {isSelectMode && isSelectedForDeletion && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-red-100 to-pink-100 text-red-800 shadow-sm">
                                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
                                                    Đã chọn để xóa
                                                </span>
                                            </div>
                                        )}

                                    </div>
                                </div>

                                {/* Dropdown Menu - Only show when not in select mode */}
                                {isMenuOpen && !isSelectMode && (
                                    <div className="absolute top-full left-0 right-0 z-[9999] mt-2 pointer-events-auto">
                                        <div className="mx-4 bg-white backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                                            {/* Header */}
                                            <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-100">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                        </svg>
                                                        Gắn thẻ
                                                    </h4>
                                                    <button
                                                        onClick={handleCloseMenu}
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tags */}
                                            <div className="max-h-64 overflow-y-auto">
                                                {tags && tags.length > 0 ? (
                                                    tags.map((tag, index) => (
                                                        <div
                                                            key={tag.id}
                                                            className="px-4 py-3 hover:bg-slate-50/80 cursor-pointer text-sm transition-all duration-200 flex items-center gap-3 text-slate-700 hover:text-slate-900 border-b border-slate-100/50 last:border-0"
                                                            style={{
                                                                animationDelay: `${index * 50}ms`
                                                            }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Find conversation by session_id
                                                                const selectedConv = displayConversations.find(conv => conv.session_id === convId);
                                                                console.log("Selecting tag for conversation:", selectedConv?.session_id, "Tag:", tag.name);

                                                                if (onTagSelect && selectedConv) {
                                                                    onTagSelect(selectedConv, tag);
                                                                }
                                                                handleCloseMenu();
                                                            }}
                                                        >
                                                            <div
                                                                className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20"
                                                                style={{ backgroundColor: tag.color }}
                                                            ></div>
                                                            <span className="font-medium">{tag.name}</span>
                                                            <div className="ml-auto">
                                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-slate-500">
                                                        <div className="text-2xl mb-2">🏷️</div>
                                                        <p>Chưa có thẻ nào</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Sidebar;