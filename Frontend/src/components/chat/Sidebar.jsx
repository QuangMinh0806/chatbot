import { useState, useRef, useEffect } from "react";
import Header from "./Header";
import { Plus } from "lucide-react";
import ConversationItem from "./ConversationItem";
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
                            <ConversationItem
                                conv={conv}
                                convId={convId}
                                index={index}
                                isSelected={isSelected}
                                isSelectMode={isSelectMode}
                                timeFormatter={timeFormatter}
                                isSelectedForDeletion={isSelectedForDeletion}
                                isMenuOpen={isMenuOpen}
                                tags={tags}
                                onSelectConversation={onSelectConversation}
                                onTagSelect={onTagSelect}
                                handleToggleConversationSelection={handleToggleConversationSelection}
                                handleOpenMenu={handleOpenMenu}
                                handleCloseMenu={handleCloseMenu}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Sidebar;