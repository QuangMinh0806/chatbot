import React from 'react'
import { ArrowLeft } from 'lucide-react';
const Header = ({ displayConversations, searchTerm, selectedCategory, tags, setSearchTerm, setSelectedCategory }) => {
    return (
        <div className="p-4 lg:p-6 border-b border-slate-200/60 bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>

            <div className="relative z-10 flex items-center gap-3 mb-4">
                {/* Back button hoặc Exit selection mode */}
                <button
                    onClick={isSelectionMode ? exitSelectionMode : () => window.history.back()}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition"
                    title={isSelectionMode ? "Thoát chế độ chọn" : "Quay lại"}
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                        <svg className="w-5 lg:w-6 h-5 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        {isSelectionMode ? (
                            <div>
                                <h2 className="text-lg lg:text-xl font-bold text-white">
                                    Đã chọn {selectedIds.length} cuộc trò chuyện
                                </h2>
                                <p className="text-sm text-white/80">
                                    Chạm vào các cuộc trò chuyện để chọn
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-lg lg:text-xl font-bold text-white">Cuộc trò chuyện</h2>
                                <p className="text-sm text-white/80">
                                    <span className="font-semibold text-white/90">{displayConversations.length}</span> cuộc trò chuyện
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                    {isSelectionMode ? (
                        <>
                            {/* Select all button */}
                            <button
                                onClick={toggleSelectAll}
                                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition flex items-center gap-1"
                                title={selectedIds.length === displayConversations.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            >
                                {selectedIds.length === displayConversations.length ? (
                                    <CheckSquare size={18} />
                                ) : (
                                    <Square size={18} />
                                )}
                            </button>

                            {/* Delete button */}
                            <button
                                onClick={handleDeleteWithLoading}
                                disabled={selectedIds.length === 0 || isDeleting}
                                className="px-3 py-2 rounded-full bg-red-500/80 hover:bg-red-600/80 disabled:bg-white/10 disabled:text-white/40 text-white transition flex items-center gap-2 text-sm font-medium"
                                title="Xóa các cuộc trò chuyện đã chọn"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                                {isDeleting ? "Đang xóa..." : "Xóa"}
                            </button>
                        </>
                    ) : (
                        /* Manage button */
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-2 text-sm font-medium"
                            title="Quản lý cuộc trò chuyện"
                        >
                            {/* <CheckSquare size={16} />
                            <span className="hidden sm:inline">Quản lý</span> */}
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar - Ẩn khi đang ở chế độ chọn */}
            {!isSelectionMode && (
                <div className="relative mb-4">
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
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Category Select - Ẩn khi đang ở chế độ chọn
            {!isSelectionMode && (
                <div className="relative">
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            console.log('Selected:', e.target.value);
                            setSelectedCategory(e.target.value);
                        }}
                        className="w-full px-4 py-3 rounded-2xl bg-white/20 backdrop-blur-sm text-white placeholder-white/70 
                       border-0 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm shadow-lg cursor-pointer appearance-none"
                    >
                        <option value="all" className="text-gray-800">Toàn bộ Tag</option>
                        {tags && tags.map((cat) => (
                            <option key={cat.id} value={cat.name} className="text-gray-800">
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-white/70">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            )} */}
        </div>
    )
}

export default Header