import { useState, useRef, useEffect } from "react";
import Header from "./Header";
import { MoreVertical, Plus } from "lucide-react";
import { deleteSessionChat } from "../../services/messengerService"
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
}) => {
    const [openMenu, setOpenMenu] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const menuRef = useRef(null);

    // Toggle chọn/bỏ chọn 1 conversation
    const toggleSelect = (id, e) => {
        e.stopPropagation(); // Ngăn không cho trigger onSelectConversation
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    // Xử lý click vào conversation
    const handleConversationClick = (conv) => {
        if (isSelectionMode) {
            toggleSelect(conv.id);
        } else {
            onSelectConversation(conv);
        }
    };

    // Xử lý xóa conversations
    const handleDelete = async (ids) => {
        try {
            const res = await deleteSessionChat(ids);
            console.log("Đã xóa:", res);
            setSelectedIds([]);
            return res;
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
            throw error;
        }
    };

    // Xóa một conversation từ menu
    const handleDeleteSingle = async (id) => {
        try {
            await handleDelete([id]);
            setOpenMenu(null);
        } catch (error) {
            console.error("Lỗi khi xóa conversation:", error);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        const matchesSearch = searchTerm === "" ||
            conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            conv.content?.toLowerCase().includes(searchTerm.toLowerCase());

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
            />

            {/* Conversations List with enhanced styling */}
            < div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent relative">
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
                ) : displayConversations.length === 0 ? (
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
                    <div className="p-2 space-y-1 relative">
                        {displayConversations.map((conv, index) => {
                            const convId = conv.id || conv.session_id || index;
                            const isSelected = selectedConversation?.id === conv.id;
                            const isMenuOpen = openMenu === convId;
                            return (
                                <div
                                    key={convId}
                                    className={`relative group rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.01] ${isSelected
                                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200/50 backdrop-blur-sm"
                                        : "bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-md"
                                        }`}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                    }}
                                >
                                    <div
                                        className="flex items-start space-x-3 p-4 pr-12"
                                        onClick={() => onSelectConversation && onSelectConversation(conv)}
                                    >
                                        {/* Enhanced Avatar */}
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
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(isMenuOpen ? null : convId);
                                                    }}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200 shadow-sm transition-all duration-200"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    tag
                                                </button>
                                            </div>
                                        </div>

                                        {/* Enhanced Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <h3
                                                    className={`font-semibold truncate text-sm transition-colors duration-300 ${isSelected
                                                        ? "text-blue-900"
                                                        : "text-slate-800 group-hover:text-slate-900"
                                                        }`}
                                                >
                                                    {conv.name || conv.full_name || "Khách hàng"}
                                                </h3>
                                                <span className={`text-xs flex-shrink-0 font-medium transition-colors duration-300 ml-2 ${isSelected ? "text-blue-600" : "text-slate-500 group-hover:text-slate-600"
                                                    }`}>
                                                    {timeFormatter(conv.created_at)}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-600 truncate leading-relaxed group-hover:text-slate-700 transition-colors duration-300 mb-2">
                                                {conv.content || "Chưa có tin nhắn"}
                                            </p>

                                            {/* Display tag if exists - Fixed to handle object structure */}
                                            {conv.tag_name && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm">
                                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                                                        {conv.tag_name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Dropdown Menu Portal - Fixed positioning outside the scroll container */}
                        {openMenu && (
                            <div className="fixed inset-0 z-50" ref={menuRef}>
                                {/* Backdrop */}
                                <div
                                    className="absolute inset-0 bg-black/5 backdrop-blur-[1px]"
                                    onClick={() => setOpenMenu(null)}
                                />

                                {/* Menu */}
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                                    <div
                                        className="relative w-full h-full"
                                        style={{
                                            transform: `translateY(${(displayConversations.findIndex(conv => (conv.id || conv.session_id) === openMenu) + 1) * 76 + 180}px)`
                                        }}
                                    >
                                        <div className="absolute right-6 w-56 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-right-2 duration-200">
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
                                                        onClick={() => setOpenMenu(null)}
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
                                                {tags.map((tag, index) => (
                                                    <div
                                                        key={tag.id}
                                                        className="px-4 py-3 hover:bg-slate-50/80 cursor-pointer text-sm transition-all duration-200 flex items-center gap-3 text-slate-700 hover:text-slate-900 border-b border-slate-100/50 last:border-0"
                                                        style={{
                                                            animationDelay: `${index * 50}ms`
                                                        }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const selectedConv = displayConversations.find(conv => (conv.id || conv.session_id) === openMenu);
                                                            if (onTagSelect && selectedConv) {
                                                                onTagSelect(selectedConv, tag);
                                                            }
                                                            setOpenMenu(null);
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
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
};

export default Sidebar;