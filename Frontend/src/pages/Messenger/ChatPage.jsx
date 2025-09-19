import { useState, useEffect, useRef } from "react";
import {
    sendMessage,
    getChatHistory,
    getAllChatHistory,
    connectAdminSocket,
    disconnectAdmin,
    updateStatus,
} from "../../services/messengerService";
import { getTag } from "../../services/tagService";
import Sidebar from "../../components/chat/Sidebar";
import MainChat from "../../components/chat/MainChat";
import { RightPanel } from "../../components/chat/RightPanel";

const ChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showRightPanel, setShowRightPanel] = useState(false);
    const selectedConversationRef = useRef(null);
    const [tag, setTag] = useState([]);

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

        // KHÔNG reset selectedConversation ở đây!
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
                setTag(await getTag());
                setConversations(Array.isArray(data) ? data : []);
            } catch (err) {
                setError("Không thể tải danh sách cuộc trò chuyện");
            } finally {
                setIsLoading(false);
            }
        };
        fetchConversations();
    }, []);

    useEffect(() => {
        connectAdminSocket((msg) => {
            // --- Cập nhật Sidebar ---
            setConversations((prev) => {
                console.log("📩 Admin nhận conversations:", prev);
                let exists = false;
                let updated = prev.map((conv) => {
                    if (conv.session_id === msg.chat_session_id) {
                        exists = true;
                        return {
                            ...conv,
                            content: msg.content,
                            created_at: new Date(),
                            // Cập nhật status nếu tin nhắn từ user
                            status: msg.sender_type === 'user' ? 'pending' : conv.status
                        };
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
                        status: msg.sender_type === 'user' ? 'pending' : 'active',
                        platform: msg.platform || 'web',
                        // Thêm các field khác nếu cần
                        user_name: msg.user_name || 'Unknown User',
                        user_avatar: msg.user_avatar || null,
                    };
                    updated = [newConversation, ...updated];
                    console.log("✅ Thêm conversation mới:", newConversation);
                }

                // Sort theo thời gian mới nhất lên đầu
                const sorted = updated.sort(
                    (a, b) => new Date(b.updatedAt || b.created_at) - new Date(a.updatedAt || a.created_at)
                );

                console.log("📝 Conversations sau khi cập nhật:", sorted);
                return sorted;
            });

            // --- Cập nhật MainChat ---
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
                if (selectedConversationRef.current?.session_id === msg.chat_session_id) {
                    return [...prev, msg];
                }
                return prev;
            });
        });

        return () => disconnectAdmin();
    }, []);

    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    const onTagSelect = async (conversation, tag) => {
        try {
            console.log("🏷️ Gắn tag:", tag.name, "cho conversation:", conversation.session_id);

            const data = {
                id_tag: tag.id,
            };

            const res = await updateStatus(conversation.session_id, data);
            if (res) {
                // Chỉ cập nhật conversation cụ thể dựa trên session_id
                setConversations(prev =>
                    prev.map(conv =>
                        conv.session_id === conversation.session_id  // ✅ Sử dụng session_id thay vì id
                            ? {
                                ...conv,
                                tag_name: tag.name,
                                id_tag: tag.id,
                                tag: tag
                            }
                            : conv  // ✅ Giữ nguyên các conversation khác
                    )
                );

                // Cập nhật selectedConversation nếu đang được chọn
                if (selectedConversation?.session_id === conversation.session_id) {
                    setSelectedConversation(prev => ({
                        ...prev,
                        id_tag: tag.id,
                        tag: tag,
                        tag_name: tag.name
                    }));
                }

                console.log("✅ Đã cập nhật tag thành công");
            }
        } catch (error) {
            console.error("❌ Lỗi khi gắn tag cho hội thoại:", error);
            alert("Có lỗi xảy ra khi gắn tag!");
        }
    };

    const handleSelectConversation = async (conv) => {
        try {
            console.log("🔍 Selecting conversation:", conv);
            setSelectedConversation(conv);
            setIsLoading(true);
            setError(null);
            setShowSidebar(false);

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
        if (input.trim() === "" || !selectedConversation) return;

        const newMessage = {
            id: Date.now(),
            content: input,
            sender_type: "admin",
            created_at: new Date(),
        };

        setMessages((prev) => [...prev, newMessage]);
        const messageContent = input;
        setInput("");

        try {
            await sendMessage(
                selectedConversation.session_id,
                "admin",
                messageContent,
                true
            );
        } catch (err) {
            setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
            setError("Không thể gửi tin nhắn");
            console.error("Error sending message:", err);
            setInput(messageContent);
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
            throw error; // Re-throw để Header component handle
        }
    };


    return (
        <div className="flex h-screen bg-gray-50 relative">
            {error && (
                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 shadow-lg max-w-xs">
                    <div className="text-sm">{error}</div>
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-500 hover:text-red-700"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Mobile Menu Button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="bg-blue-500 text-white p-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
                >
                    {showSidebar ? "✕" : "☰"}
                </button>
            </div>

            {/* Mobile Info Button */}
            {selectedConversation && (
                <div className="lg:hidden fixed top-4 right-4 z-50">
                    <button
                        onClick={() => setShowRightPanel(!showRightPanel)}
                        className="bg-blue-500 text-white p-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
                    >
                        ℹ️
                    </button>
                </div>
            )}

            {/* Overlay for mobile */}
            {(showSidebar || showRightPanel) && (
                <div
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={() => {
                        setShowSidebar(false);
                        setShowRightPanel(false);
                    }}
                />
            )}

            {/* Sidebar */}
            <div
                className={`
                fixed lg:relative z-40 h-full transition-transform duration-300 ease-in-out
                ${showSidebar
                        ? "translate-x-0"
                        : "-translate-x-full lg:translate-x-0"
                    }
            `}
            >
                <Sidebar
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    onSelectConversation={handleSelectConversation}
                    formatTime={formatTime}
                    isLoading={isLoading}
                    tags={tag}
                    onTagSelect={onTagSelect}
                    onDeleteConversations={handleDeleteConversations} // Truyền function delete
                />
            </div>

            {/* Main Chat */}
            <div className="flex-1 min-w-0">
                <MainChat
                    selectedConversation={selectedConversation}
                    onUpdateConversation={setSelectedConversation}
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    formatMessageTime={formatMessageTime}
                    onMessagesUpdate={handleMessagesUpdate} // ✅ Sử dụng function riêng
                    onConversationsUpdate={handleConversationsUpdate} // ✅ Function riêng cho conversations
                />
            </div>

            {/* Right Panel */}
            {selectedConversation && (
                <div
                    className={`
                    fixed lg:relative z-40 h-full transition-transform duration-300 ease-in-out
                    ${showRightPanel
                            ? "translate-x-0"
                            : "translate-x-full lg:translate-x-0"
                        }
                    right-0
                `}
                >
                    <RightPanel selectedConversation={selectedConversation} />
                </div>
            )}
        </div>
    );
};

export default ChatPage;