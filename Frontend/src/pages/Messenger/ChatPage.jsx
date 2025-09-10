import { useState, useEffect, useRef } from "react"
import { sendMessage, getChatHistory, getAllChatHistory, connectWebSocket } from "../../services/messengerService"
import Sidebar from "../../components/chat/Sidebar"
import MainChat from "../../components/chat/MainChat"
import { RightPanel } from "../../components/chat/RightPanel"

const ChatPage = () => {
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState("")
    const wsRef = useRef(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const formatTime = (date) => {
        if (!date) return ""
        const now = new Date()
        const messageTime = new Date(date)
        const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60))

        if (diffInMinutes < 1) return "Vừa xong"
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours} giờ trước`

        const diffInDays = Math.floor(diffInHours / 24)
        return `${diffInDays} ngày trước`
    }

    const formatMessageTime = (date) => {
        if (!date) return ""
        return new Date(date).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const data = await getAllChatHistory()
                setConversations(Array.isArray(data) ? data : [])
            } catch (err) {
                setError("Không thể tải danh sách cuộc trò chuyện")
                console.error("Error fetching conversations:", err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchConversations()
    }, [])

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
                wsRef.current = null
            }
        }
    }, [])

    const handleSelectConversation = async (conv) => {
        try {
            setSelectedConversation(conv)
            setIsLoading(true)
            setError(null)

            const convId = conv?.id ?? conv?.session_id ?? conv?.conversation_id
            if (!convId) return

            const data = await getChatHistory(convId)
            setMessages(Array.isArray(data) ? data : [])

            if (wsRef.current) {
                wsRef.current.close()
            }

            wsRef.current = connectWebSocket(
                (msg) => {
                    setMessages((prev) => [...prev, msg])
                },
                (error) => {
                    console.error("WebSocket error:", error)
                    setError("Kết nối WebSocket bị lỗi")
                },
            )
        } catch (err) {
            setError("Không thể tải lịch sử chat")
            console.error("Error selecting conversation:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSendMessage = async () => {
        if (input.trim() === "" || !selectedConversation) return

        const newMessage = {
            id: Date.now(),
            content: input,
            sender_type: "admin",
            created_at: new Date(),
        }

        setMessages((prev) => [...prev, newMessage])
        const messageContent = input
        setInput("")

        try {
            await sendMessage(selectedConversation.session_id, "admin", messageContent)

            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === selectedConversation?.id
                        ? { ...conv, last_message: messageContent, last_message_time: new Date() }
                        : conv,
                ),
            )
        } catch (err) {
            setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id))
            setError("Không thể gửi tin nhắn")
            console.error("Error sending message:", err)
            setInput(messageContent)
        }
    }

    const getPlatformIcon = (platform) => {
        return platform === "facebook" ? "📘" : "🌐"
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case "active":
                return "Đã trả lời"
            case "pending":
                return "Chờ trả lời"
            default:
                return "Không hoạt động"
        }
    }

    return (
        <div className="flex h-screen bg-gray-50">
            {error && (
                <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
                    {error}
                    <button onClick={() => setError(null)} className="ml-2 text-red-500 hover:text-red-700">
                        ×
                    </button>
                </div>
            )}

            <Sidebar
                conversations={conversations}
                selectedConversation={selectedConversation}
                onSelectConversation={handleSelectConversation}
                formatTime={formatTime}
                getPlatformIcon={getPlatformIcon}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                isLoading={isLoading}
            />

            <MainChat
                selectedConversation={selectedConversation}
                messages={messages}
                input={input}
                setInput={setInput}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                formatMessageTime={formatMessageTime}
            />

            {/* Right Panel - Thông tin khách hàng */}
            {selectedConversation && (
                <RightPanel selectedConversation={selectedConversation} />
            )}
        </div>
    )
}

export default ChatPage