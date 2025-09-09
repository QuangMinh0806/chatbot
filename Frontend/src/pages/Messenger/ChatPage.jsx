import React, { useState, useEffect } from "react";
import Sidebar from "../../components/chat/Sidebar";
import ChatInput from "../../components/chat/ChatInput";
import MainChat from "../../components/chat/MainChat";
import {
    connectWebSocket,
    sendMessage,
    checkSession,
    disconnect,
    getChatHistory,
    getAllChatHistory,
} from "../../services/messengerService";
const ChatPage = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);


    useEffect(() => {
        const fetchConversations = async () => {
            const data  = await getAllChatHistory();
            setConversations(data );
        };

        fetchConversations();
    }, []);



    const handleSelectConversation = async (conv) => {
        setSelectedConversation(conv);

        const data = await getChatHistory(conv.id);
        setMessages(data);
    };

    const handleSendMessage = (message) => {
        const newMessage = {
            id: Date.now(),
            content: message,
            sender_type: "user",
        };
        setMessages((prev) => [...prev, newMessage]);
    };

    
    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar conversations={conversations} onSelect={handleSelectConversation} />
            <div className="flex flex-col flex-1">
                <MainChat messages={messages} selectedConversation={selectedConversation} />
                <ChatInput onSend={handleSendMessage} />
            </div>
        </div>
    );
};

export default ChatPage;
