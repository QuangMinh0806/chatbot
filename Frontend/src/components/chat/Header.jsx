import { ArrowLeft } from 'lucide-react';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { useNavigate } from "react-router-dom";
const Header = forwardRef(({
    displayConversations,
    searchTerm,
    selectedCategory,
    tags,
    setSearchTerm,
    setSelectedCategory,
    onDeleteConversations,
    onSelectModeChange,
    isSelectMode: initialSelectMode = false,
    selectedConversationIds: initialSelectedIds = []
}, ref) => {
    const [isSelectMode, setIsSelectMode] = useState(initialSelectMode);
    const [selectedConversationIds, setSelectedConversationIds] = useState(initialSelectedIds);
    const navigate = useNavigate();
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
        updateSelection: (newSelectedIds) => {
            console.log("📋 Header updating selection:", newSelectedIds);
            setSelectedConversationIds(newSelectedIds);
        }
    }));

    const handleSelectModeToggle = () => {
        const newMode = !isSelectMode;
        console.log("🔄 Toggle select mode:", newMode);

        setIsSelectMode(newMode);

        // Reset selected conversations when exiting select mode
        if (!newMode) {
            setSelectedConversationIds([]);
            onSelectModeChange(newMode, []);
        } else {
            onSelectModeChange(newMode, selectedConversationIds);
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedConversationIds.length === 0) return;

        try {
            console.log("🗑️ Deleting selected conversations:", selectedConversationIds);
            await onDeleteConversations(selectedConversationIds);
            setSelectedConversationIds([]);
            setIsSelectMode(false);
            onSelectModeChange(false, []);

            console.log("✅ Successfully deleted conversations");
        } catch (error) {
            console.error("❌ Error deleting conversations:", error);
        }
    };

    const handleSelectAll = () => {
        const allIds = displayConversations.map(conv => conv.session_id || conv.id);
        console.log("📝 Select all conversations:", allIds);

        setSelectedConversationIds(allIds);
        onSelectModeChange(isSelectMode, allIds);
    };

    return (
        <div className="sticky top-0 z-10 p-3 lg:p-5  border-slate-200/60 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 relative overflow-hidden">
            {/* Header Title */}
            <div className="relative z-10 flex items-center gap-2 mb-4">
                <ArrowLeft
                    onClick={() => navigate("/dashboard")}
                    className="cursor-pointer text-white w-6 h-6"
                />
                <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                    <svg className="w-5 lg:w-6 h-5 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-lg lg:text-xl font-bold text-white">Cuộc trò chuyện</h2>
                    <p className="text-sm text-white/80">
                        <span className="font-semibold text-white/90">{displayConversations.length}</span> cuộc trò chuyện
                    </p>
                </div>
            </div>

            {/* Search Section */}
            <div className="relative z-10 mb-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm cuộc hội thoại..."
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
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Category Filter Section */}
            <div className="relative z-10 mb-4 sm:mb-6 space-y-4">
                {/* Bộ lọc danh mục */}
                <div className="relative">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white/20 backdrop-blur-sm 
                 text-white placeholder-white/70 border-0 focus:outline-none 
                 focus:ring-2 focus:ring-white/30 text-sm shadow-lg 
                 cursor-pointer appearance-none"
                    >
                        <option value="all" className="text-gray-800">Tất cả danh mục</option>
                        {tags.map((tag) => (
                            <option key={tag.id} value={tag.name} className="text-gray-800">
                                {tag.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Nhóm nút hành động */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2">
                    {/* Nút chính */}
                    <button
                        onClick={handleSelectModeToggle}
                        className={`w-full sm:w-auto px-3 py-1.5 rounded-lg text-xs font-medium 
                  transition-all duration-200 shadow-md 
                  ${isSelectMode
                                ? "bg-red-500/90 hover:bg-red-500 text-white border border-red-400/50"
                                : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                            }`}
                    >
                        {isSelectMode ? "Hủy chọn" : "Chọn để xóa cuộc hội thoại"}
                    </button>

                    {/* Các nút phụ */}
                    {isSelectMode && (
                        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                            {selectedConversationIds.length > 0 && selectedConversationIds.length < displayConversations.length && (
                                <button
                                    onClick={handleSelectAll}
                                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs 
                       font-medium bg-white/20 hover:bg-white/30 text-white 
                       backdrop-blur-sm border border-white/30 transition-colors duration-200"
                                >
                                    Chọn tất cả
                                </button>
                            )}

                            {selectedConversationIds.length > 0 && (
                                <button
                                    onClick={handleDeleteSelected}
                                    className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs 
                       font-medium bg-red-500/90 hover:bg-red-500 text-white 
                       backdrop-blur-sm border border-red-400/50 transition-all duration-200 shadow-md"
                                >
                                    <span className="hidden sm:inline">Xóa ({selectedConversationIds.length})</span>
                                    <span className="sm:hidden">Xóa {selectedConversationIds.length}</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

Header.displayName = 'Header';

export default Header;