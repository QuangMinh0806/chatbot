import React from 'react';
import { Plus } from 'lucide-react';

// Sub-components
const ConversationAvatar = ({ conv, isSelected }) => (
    <div className="relative flex-shrink-0">
        <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg transition-all duration-300 ${isSelected
                ? "bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-300/40 shadow-blue-500/25 scale-105"
                : "bg-gradient-to-br from-slate-400 to-slate-500 group-hover:from-slate-500 group-hover:to-slate-600 group-hover:scale-105"
                }`}
        >
            {(conv.name || conv.full_name || "K")?.charAt(0)?.toUpperCase() || "?"}
        </div>
    </div>
);

const SelectModeCheckbox = ({ isSelectedForDeletion, onToggle }) => (
    <div className="flex-shrink-0 flex items-center justify-center w-11 h-11">
        <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelectedForDeletion
                ? "bg-red-500 border-red-500 text-white"
                : "border-gray-300 hover:border-red-400"
                }`}
            onClick={(e) => {
                e.stopPropagation();
                onToggle();
            }}
        >
            {isSelectedForDeletion && (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            )}
        </div>
    </div>
);

const TagButton = ({ isMenuOpen, onOpenMenu }) => (
    <div className="mt-3 flex justify-center">
        <button
            onClick={onOpenMenu}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm ${isMenuOpen
                ? "bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-900 shadow-md"
                : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 hover:from-blue-200 hover:to-indigo-200"
                }`}
        >
            <Plus className={`w-4 h-4 transition-transform duration-200 ${isMenuOpen ? "rotate-45" : ""}`} />
            tag
        </button>
    </div>
);

const ConversationContent = ({
    conv,
    isSelectMode,
    isSelectedForDeletion,
    isSelected,
    timeFormatter
}) => {
    const getTextColor = () => {
        if (isSelectMode) {
            return isSelectedForDeletion
                ? "text-red-900"
                : "text-slate-800 group-hover:text-slate-900";
        }
        return isSelected
            ? "text-blue-900"
            : "text-slate-800 group-hover:text-slate-900";
    };

    const getTimeColor = () => {
        if (isSelectMode) {
            return isSelectedForDeletion
                ? "text-red-600"
                : "text-slate-500 group-hover:text-slate-600";
        }
        return isSelected
            ? "text-blue-600"
            : "text-slate-500 group-hover:text-slate-600";
    };

    return (
        <div className="flex-1 min-w-0 relative pb-5">
            {/* Title */}
            <div className="flex items-center justify-between mb-1.5">
                <h3 className={`font-semibold truncate text-sm transition-colors duration-300 ${getTextColor()}`}>
                    {conv.name || conv.full_name || "Khách hàng"}
                </h3>
            </div>

            {/* Content */}
            <p className="text-xs text-slate-600 truncate leading-relaxed group-hover:text-slate-700 transition-colors duration-300 mb-2">
                {conv.content || "Chưa có tin nhắn"}
            </p>

            {/* Tags - Hide in select mode - Positioned to avoid timestamp */}
            {!isSelectMode && conv.tag_names && conv.tag_names.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 pr-20">
                    {conv.tag_names.slice(0, 2).map((tagName, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm"
                        >
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5"></div>
                            {tagName}
                        </span>
                    ))}
                    {conv.tag_names.length > 2 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600 shadow-sm">
                            +{conv.tag_names.length - 2}
                        </span>
                    )}
                </div>
            )}

            {/* Selected status in select mode */}
            {isSelectMode && isSelectedForDeletion && (
                <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-gradient-to-r from-red-100 to-pink-100 text-red-800 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></div>
                        Đã chọn để xóa
                    </span>
                </div>
            )}

            {/* Timestamp - Fixed at bottom right corner */}
            <div className="absolute bottom-0 right-0">
                <span className={`text-xs font-medium transition-colors duration-300 px-2 py-1 rounded-tl-lg bg-white/80 backdrop-blur-sm shadow-sm ${getTimeColor()}`}>
                    {timeFormatter(conv.created_at)}
                </span>
            </div>
        </div>
    );
};

const TagDropdown = ({
    isMenuOpen,
    tags,
    conv,
    onTagSelect,
    onCloseMenu
}) => {
    if (!isMenuOpen) return null;

    return (
        <div className="absolute top-full left-0 right-0 z-[9999] mt-2 pointer-events-auto">
            <div className="mx-4 bg-white backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 duration-200"
                style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

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
                            onClick={onCloseMenu}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Tags List */}
                <div className="max-h-64 overflow-y-auto">
                    {tags && tags.length > 0 ? (
                        tags.map((tag, index) => {
                            const isTagApplied = conv.tag_ids && conv.tag_ids.includes(tag.id);

                            return (
                                <div
                                    key={tag.id}
                                    className={`px-4 py-3 cursor-pointer text-sm transition-all duration-200 flex items-center gap-3 border-b border-slate-100/50 last:border-0 ${isTagApplied
                                        ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 hover:from-blue-100 hover:to-indigo-100"
                                        : "hover:bg-slate-50/80 text-slate-700 hover:text-slate-900"
                                        }`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onTagSelect?.(conv, tag);
                                    }}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div
                                            className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="font-medium">{tag.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isTagApplied && (
                                            <>
                                                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                                <div className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all duration-200">
                                                    Xóa
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="px-4 py-8 text-center text-slate-500">
                            <div className="text-2xl mb-2">🏷️</div>
                            <p>Chưa có thẻ nào</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-t border-slate-100">
                    <button
                        onClick={onCloseMenu}
                        className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main Component
const ConversationItem = ({
    conv,
    convId,
    index,
    isSelected,
    isSelectMode,
    isSelectedForDeletion,
    isMenuOpen,
    tags,
    timeFormatter,
    onSelectConversation,
    onTagSelect,
    handleToggleConversationSelection,
    handleOpenMenu,
    handleCloseMenu
}) => {
    const getCardStyles = () => {
        const baseStyles = "relative group rounded-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.01]";
        const zIndex = isMenuOpen ? "z-[10000]" : "z-10";

        let backgroundStyles;
        if (isSelectMode) {
            backgroundStyles = isSelectedForDeletion
                ? "bg-gradient-to-r from-red-50 to-pink-50 shadow-lg ring-2 ring-red-200/50 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm hover:bg-gray-100/90 hover:shadow-md";
        } else {
            backgroundStyles = isSelected
                ? "bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200/50 backdrop-blur-sm"
                : "bg-white/70 backdrop-blur-sm hover:bg-white/90 hover:shadow-md";
        }

        return `${baseStyles} ${zIndex} ${backgroundStyles}`;
    };

    const handleClick = () => {
        console.log("🖱️ Conversation clicked:", { convId, isSelectMode });

        if (isSelectMode) {
            handleToggleConversationSelection(convId);
        } else {
            onSelectConversation?.(conv);
        }
    };

    const handleOpenMenuClick = (e) => {
        handleOpenMenu(convId, e);
    };

    return (
        <div
            key={convId}
            data-menu-id={convId}
            className={getCardStyles()}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex items-start space-x-3 p-4 pr-12" onClick={handleClick}>

                {/* Left Side - Avatar or Checkbox */}
                {isSelectMode ? (
                    <SelectModeCheckbox
                        isSelectedForDeletion={isSelectedForDeletion}
                        onToggle={() => handleToggleConversationSelection(convId)}
                    />
                ) : (
                    <div className="relative flex-shrink-0">
                        <ConversationAvatar conv={conv} isSelected={isSelected} />
                        <TagButton isMenuOpen={isMenuOpen} onOpenMenu={handleOpenMenuClick} />
                    </div>
                )}

                {/* Content */}
                <ConversationContent
                    conv={conv}
                    isSelectMode={isSelectMode}
                    isSelectedForDeletion={isSelectedForDeletion}
                    isSelected={isSelected}
                    timeFormatter={timeFormatter}
                />
            </div>

            {/* Tag Dropdown - Only show when not in select mode */}
            {!isSelectMode && (
                <TagDropdown
                    isMenuOpen={isMenuOpen}
                    tags={tags}
                    conv={conv}
                    onTagSelect={onTagSelect}
                    onCloseMenu={handleCloseMenu}
                />
            )}
        </div>
    );
};

export default ConversationItem;