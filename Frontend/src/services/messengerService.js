import axiosClient from './axios';


let socket;
let callbacks = [];

export const connectWebSocket = (onMessage) => {
    socket = new WebSocket("ws://localhost:8000/chat/ws");

    socket.onopen = () => {
        console.log("✅ WebSocket connected");
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📩 Nhận tin nhắn từ server:", data);
        if (onMessage) onMessage(data);
    };

    socket.onclose = () => {
        console.log("❌ WebSocket disconnected");
    };
};






export const disconnect = () => {
    if (socket) socket.close();
};

export const sendMessage = (chatSessionId, senderType, content) => {


    if (socket && socket.readyState === WebSocket.OPEN){
        socket.send(JSON.stringify({ chat_session_id: chatSessionId, sender_type: senderType, content }));

    }
};

export const checkSession = async () => {
    try {
        let sessionId = localStorage.getItem("chatSessionId");

        if (!sessionId) {
            const response = await axiosClient.post("/chat/session");
            sessionId = response.id;
            localStorage.setItem("chatSessionId", sessionId);
        }

        return sessionId;
    } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
    }
};



export const getChatHistory = async (chatSessionId) => {
    try {

        const response = await axiosClient.get(`/chat/history/1`);

        return response;
    } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
    }
};


export const getAllChatHistory = async () => {
    try {

        const response = await axiosClient.get("/chat/admin/history");

        return response;
    } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
    }
};