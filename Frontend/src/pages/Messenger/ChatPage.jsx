import { useState, useEffect, useRef } from "react";
import {
    sendMessage,
    getChatHistory,
    getAllChatHistory,
    connectAdminSocket,
    disconnectAdmin,
    updateTag,
} from "../../services/messengerService";
import { getTag, getTagsByChatSession } from "../../services/tagService";
import Sidebar from "../../components/chat/Sidebar";
import MainChat from "../../components/chat/MainChat";
import { RightPanel } from "../../components/chat/RightPanel";
import { Menu, X, Info } from "lucide-react";

const ChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [imagePreview, setImagePreview] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // State cho thông báo khách hàng
    const [customerInfoNotifications, setCustomerInfoNotifications] = useState(new Set());
    const [hasNewCustomerInfo, setHasNewCustomerInfo] = useState(false);

    // Simplified responsive state
    const [isMobile, setIsMobile] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);

    const selectedConversationRef = useRef(null);
    const [tag, setTag] = useState([]);
    // Debug useEffect để kiểm tra tags
    useEffect(() => {
        console.log("🏷️ Tags state updated:", tag);
    }, [tag]);

    const formatTime = (date) => {
        if (!date) return "";
        const now = new Date();
        const messageTime = new Date(date);
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

        if (diffInMinutes < 1) return "Vừa xong";
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;

        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} ngày trước`;
    };

    const formatMessageTime = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Screen size detection
    useEffect(() => {
        const checkScreenSize = () => {
            const mobile = window.innerWidth < 1024; // lg breakpoint
            setIsMobile(mobile);

            // Auto close panels on mobile when screen becomes desktop
            if (!mobile) {
                setSidebarOpen(false);
                setRightPanelOpen(false);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Panel handlers
    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
        // Close right panel when opening sidebar on mobile
        if (!sidebarOpen && isMobile) {
            setRightPanelOpen(false);
        }
    };

    const handleCloseSidebar = () => {
        setSidebarOpen(false);
    };

    const handleToggleRightPanel = () => {
        setRightPanelOpen(!rightPanelOpen);
        // Close sidebar when opening right panel on mobile
        if (!rightPanelOpen && isMobile) {
            setSidebarOpen(false);
        }
    };

    const handleCloseRightPanel = () => {
        setRightPanelOpen(false);
    };

    // Close panels when selecting conversation on mobile
    const handleSelectConversationWithClose = async (conv) => {
        await handleSelectConversation(conv);
        
        // Xóa thông báo khi chọn conversation
        if (customerInfoNotifications.has(conv.session_id)) {
            setCustomerInfoNotifications(prev => {
                const newSet = new Set(prev);
                newSet.delete(conv.session_id);
                return newSet;
            });
            
            // Cập nhật hasNewCustomerInfo nếu không còn thông báo nào
            setHasNewCustomerInfo(prev => {
                const newSet = new Set(customerInfoNotifications);
                newSet.delete(conv.session_id);
                return newSet.size > 0;
            });
            
            // Xóa flag hasNewInfo khỏi conversation
            setConversations(prev => 
                prev.map(c => 
                    c.session_id === conv.session_id 
                        ? { ...c, hasNewInfo: false }
                        : c
                )
            );
        }
        
        if (isMobile) {
            setSidebarOpen(false);
            setRightPanelOpen(false);
        }
    };

    // ✅ Hàm riêng để handle messages update (chỉ cập nhật messages)
    const handleMessagesUpdate = (updatedMessages) => {
        console.log("📝 Updating messages:", updatedMessages.length);
        setMessages(updatedMessages);

        // Cập nhật số lượng tin nhắn trong conversations nếu cần
        if (selectedConversation) {
            setConversations(prev =>
                prev.map(conv =>
                    conv.session_id === selectedConversation.session_id
                        ? { ...conv, messageCount: updatedMessages.length }
                        : conv
                )
            );
        }
    };

    // ✅ Hàm riêng để handle conversations update
    const handleConversationsUpdate = (updatedConversations) => {
        console.log("📋 Updating conversations:", updatedConversations.length);
        setConversations(updatedConversations);
    };

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setIsLoading(true);
                const data = await getAllChatHistory();
                setConversations(Array.isArray(data) ? data : []);
            } catch (err) {
                setError("Không thể tải danh sách cuộc trò chuyện");
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTags = async () => {
            try {
                const tagData = await getTag();
                setTag(Array.isArray(tagData) ? tagData : []);
            } catch (err) {
                console.error("❌ Error loading tags:", err);
                setTag([]);
            }
        };
        fetchConversations();
        fetchTags();
    }, []);

    useEffect(() => {
        connectAdminSocket((msg) => {
            // Xử lý sự kiện cập nhật thông tin khách hàng
            if (msg.type === 'customer_info_update') {
                console.log('📝 Nhận cập nhật thông tin khách hàng:', msg);
                
                // Thêm vào danh sách thông báo
                setCustomerInfoNotifications(prev => new Set([...prev, msg.chat_session_id]));
                setHasNewCustomerInfo(true);
                
                // Cập nhật thông tin trong conversations
                setConversations(prev => 
                    prev.map(conv => 
                        conv.session_id === msg.chat_session_id
                            ? { ...conv, customer_data: msg.customer_data, hasNewInfo: true }
                            : conv
                    )
                );
                return;
            }

            // --- Cập nhật Sidebar ---
            setConversations((prev) => {
                console.log("📩 Admin nhận conversations:", msg);
                let exists = false;
                let updated = prev.map((conv) => {
                    if (conv.session_id === msg.chat_session_id) {
                        exists = true;

                        if (msg.customer_data && !msg.content) {
                            return {
                                ...conv,
                                customer_data: msg.customer_data,
                            };
                        } else {
                            return {
                                ...conv,
                                content: msg.content || prev.content,
                                created_at: new Date() || prev.created_at,
                                sender_type: msg.sender_type || prev.sender_type,
                                status: msg.session_status,
                                current_receiver: msg.current_receiver,
                                previous_receiver: msg.previous_receiver,
                                time: msg.time,
                                image: msg.image || []
                            };
                        }
                    }
                    return conv;
                });

                // Nếu chưa có conversation này thì thêm mới
                if (!exists) {
                    const newConversation = {
                        session_id: msg.chat_session_id,
                        content: msg.content,
                        created_at: new Date(),
                        name: msg.session_name,
                        status: msg.session_status,
                        platform: msg.platform || "web"
                    };
                    updated = [newConversation, ...updated];
                }

                // Sort theo thời gian mới nhất lên đầu
                const sorted = updated.sort(
                    (a, b) => new Date(b.updatedAt || b.created_at) - new Date(a.updatedAt || a.created_at)
                );

                return sorted;
            });

            // --- Cập nhật MainChat ---
            if (msg.content) {
                setMessages((prev) => {
                    const lastMessage = prev[prev.length - 1];

                    // Nếu tin nhắn nhận từ socket giống tin nhắn cuối cùng thì bỏ qua
                    if (
                        lastMessage &&
                        lastMessage.content === msg.content &&
                        lastMessage.sender_type === msg.sender_type &&
                        lastMessage.sender_type === "admin"
                    ) {
                        return prev;
                    }
                    // chỉ push nếu đang mở đúng conversation
                    if (
                        selectedConversationRef.current?.session_id === msg.chat_session_id
                    ) {
                        return [...prev, msg];
                    }
                    return prev;
                });
            }
        });

        return () => disconnectAdmin();
    }, []);

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    useEffect(() => {
        if (selectedConversation) {
            const updatedConversation = conversations.find(
                (conv) => conv.session_id === selectedConversation.session_id
            );

            if (updatedConversation) {
                setSelectedConversation(updatedConversation);
            }
        }
    }, [conversations]);

    const onTagSelect = async (conversation, tag) => {
        console.log("🏷️ Toggling tag:", tag, "for conversation:", conversation);
        try {
            let updatedTagIds = conversation.tag_ids || [];
            let updatedTagNames = conversation.tag_names || [];
            if (updatedTagIds.includes(tag.id)) {
                // Nếu đã có thì xóa
                updatedTagIds = updatedTagIds.filter(id => id !== tag.id);
                updatedTagNames = updatedTagNames.filter(name => name !== tag.name);
            } else {
                // Nếu chưa có thì thêm
                updatedTagIds = [...updatedTagIds, tag.id];
                updatedTagNames = [...updatedTagNames, tag.name];
            }

            const data = {
                tags: updatedTagIds, // ✅ chỉ gửi ID cho backend
            };

            const res = await updateTag(conversation.session_id, data);
            if (res) {
                // Cập nhật conversations
                setConversations(prev =>
                    prev.map(conv =>
                        conv.session_id === conversation.session_id
                            ? {
                                ...conv,
                                tag_ids: updatedTagIds,
                                tag_names: updatedTagNames,
                            }
                            : conv
                    )
                );

                // Cập nhật selectedConversation
                if (selectedConversation?.session_id === conversation.session_id) {
                    setSelectedConversation(prev => ({
                        ...prev,
                        tag_ids: updatedTagIds,
                        tag_names: updatedTagNames,
                    }));
                }

                console.log("✅ Đã cập nhật tags:", updatedTagNames);
            }
        } catch (error) {
            console.error("❌ Lỗi khi gắn/xóa tag:", error);
            alert("Có lỗi xảy ra khi gắn/xóa tag!");
        }
    };

    const handleSelectConversation = async (conv) => {
        try {
            console.log("🔍 Selecting conversation:", conv);
            setSelectedConversation(conv);
            setIsLoading(true);
            setError(null);

            const convId = conv.session_id;
            if (!convId) return;

            const data = await getChatHistory(convId);
            setMessages(Array.isArray(data) ? data : []);
            console.log("✅ Loaded messages for conversation:", data.length);
        } catch (err) {
            setError("Không thể tải lịch sử chat");
            console.error("Error selecting conversation:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const newMessage = {
            id: Date.now(),
            content: input.trim(),
            image: [...imagePreview],
            sender_type: "admin",
            created_at: new Date(),
        };

        // Hiển thị tạm thời trong UI
        setMessages((prev) => [...prev, newMessage]);

        const messageContent = input.trim();
        const messageImage = imagePreview;
        setInput("");
        setImagePreview([]);

        try {
            await sendMessage(
                selectedConversation.session_id,
                "admin",
                messageContent,
                true,
                messageImage
            );
        } catch (err) {
            // rollback nếu lỗi
            setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
            setError("Không thể gửi tin nhắn");
            console.error("Error sending message:", err);

            // trả lại input và preview nếu fail
            setInput(messageContent);
            setImagePreview(messageImage);
        }
    };

    // ✅ Function để xóa multiple conversations
    const handleDeleteConversations = async (conversationIds) => {
        try {
            console.log("🗑️ Deleting conversations:", conversationIds);

            const { deleteSessionChat } = await import("../../services/messengerService");

            await deleteSessionChat(conversationIds);

            setConversations(prev =>
                prev.filter(conv => !conversationIds.includes(conv.session_id || conv.id))
            );

            if (
                selectedConversation &&
                conversationIds.includes(selectedConversation.session_id || selectedConversation.id)
            ) {
                setSelectedConversation(null);
                setMessages([]);
            }

            console.log("✅ Deleted conversations successfully");
        } catch (error) {
            console.error("❌ Error deleting conversations:", error);
            throw error;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 relative">
            {/* Error notification */}
            {error && (
                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded z-50 shadow-lg max-w-xs">
                    <div className="text-sm">{error}</div>
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-500 hover:text-red-700"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Mobile Controls */}
            {isMobile && (
                <>
                    {!sidebarOpen && (
                        <div className="fixed top-4 left-4 z-50">
                            <button
                                onClick={handleToggleSidebar}
                                className="p-3 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                                aria-label="Mở danh sách"
                            >
                                <Menu size={20} className="text-gray-700" />
                            </button>
                        </div>
                    )}

                    {/* Info button for Right Panel */}
                    {selectedConversation && (
                        <div className="fixed top-4 right-4 z-50">
                            <button
                                onClick={handleToggleRightPanel}
                                className="p-3 rounded-lg bg-white shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
                                aria-label={rightPanelOpen ? "Đóng thông tin" : "Xem thông tin"}
                            >
                                {rightPanelOpen ? (
                                    <X size={20} className="text-gray-700" />
                                ) : (
                                    <Info size={20} className="text-gray-700" />
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Overlay for mobile */}
            {isMobile && (sidebarOpen || rightPanelOpen) && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => {
                        setSidebarOpen(false);
                        setRightPanelOpen(false);
                    }}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                    ${isMobile
                        ? 'fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out'
                        : 'relative'
                    }
                    ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                    ${isMobile ? 'w-80 max-w-[85vw]' : 'w-auto'}
                `}
            >
                <Sidebar
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={handleSelectConversationWithClose}
                    formatTime={formatTime}
                    getPlatformIcon={() => null}
                    getStatusColor={() => "gray"}
                    getStatusText={() => ""}
                    isLoading={isLoading}
                    tags={tag}
                    onTagSelect={onTagSelect}
                    onDeleteConversations={handleDeleteConversations}
                    // Pass responsive props
                    isMobile={isMobile}
                    isOpen={isMobile ? sidebarOpen : true}
                    onClose={handleCloseSidebar}
                    // Thêm props cho thông báo khách hàng
                    customerInfoNotifications={customerInfoNotifications}
                    hasNewCustomerInfo={hasNewCustomerInfo}
                />
            </div>

            {/* Main Chat */}
            <div className={`flex-1 min-w-0 ${isMobile ? 'w-full' : ''}`}>
                <MainChat
                    selectedConversation={selectedConversation}
                    onUpdateConversation={setSelectedConversation}
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    imagePreview={imagePreview}
                    setImagePreview={setImagePreview}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    formatMessageTime={formatMessageTime}
                    onMessagesUpdate={handleMessagesUpdate}
                    onConversationsUpdate={handleConversationsUpdate}
                    isMobile={isMobile}
                />
            </div>

            {/* Right Panel */}
            {selectedConversation && (
                <div
                    className={`
                        ${isMobile
                            ? 'fixed inset-y-0 right-0 z-40 transform transition-transform duration-300 ease-in-out'
                            : 'relative'
                        }
                        ${isMobile && !rightPanelOpen ? 'translate-x-full' : 'translate-x-0'}
                        ${isMobile ? 'w-80 max-w-[85vw]' : 'w-auto'}
                    `}
                >
                    <RightPanel
                        selectedConversation={selectedConversation}
                        isMobile={isMobile}
                        isOpen={isMobile ? rightPanelOpen : true}
                        onClose={handleCloseRightPanel}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatPage;