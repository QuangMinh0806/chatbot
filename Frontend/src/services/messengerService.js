import axiosClient from './axios';



let socketCustomer;
let socketAdmin;
// const VITE_URL_WS = `wss://chatbotbe.haduyson.com`
const VITE_URL_WS = `ws://localhost:8000`
export const connectCustomerSocket = (onMessage) => {
    if (socketCustomer) return;

    const sessionId = localStorage.getItem("chatSessionId");

    socketCustomer = new WebSocket(`${VITE_URL_WS}/chat/ws/customer?sessionId=${sessionId}`);

    socketCustomer.onopen = () => {
        console.log("✅ Customer WebSocket connected");
    };

    socketCustomer.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("📩 Customer nhận tin nhắn:", data);
        onMessage(data);

    };

    socketCustomer.onclose = () => {
        console.log("❌ Customer WebSocket disconnected");

        socketCustomer = null;
    };

};


export const connectAdminSocket = (onMessage) => {
    socketAdmin = new WebSocket(`${VITE_URL_WS}/chat/ws/admin`);
    socketAdmin.onopen = () => {
        console.log("✅ Admin WebSocket connected");
    };

    socketAdmin.onmessage = (event) => {
        const data = JSON.parse(event.data)
        console.log("📩 Admin nhận tin nhắn:", data);
        if (onMessage) onMessage(data);
    };

    socketAdmin.onclose = () => {
        console.log("❌ Admin WebSocket disconnected");
    };

    return socketAdmin;
};


export const sendMessage = (chatSessionId, senderType, content, isAdmin = false, image = null) => {
    const targetSocket = isAdmin ? socketAdmin : socketCustomer;

    if (targetSocket  && targetSocket.readyState === WebSocket.OPEN){
        console.log(chatSessionId)
        targetSocket.send(JSON.stringify({ chat_session_id: chatSessionId, sender_type: senderType, content,  image: image || null}));
        console.log("đã gửi xong")
    }
};

export const disconnectCustomer = () => {
    if (socketCustomer) socketCustomer.close();
};

export const disconnectAdmin = () => {
    if (socketAdmin) socketAdmin.close();
};


export const checkSession = async () => {
    try {
        let sessionId = localStorage.getItem("chatSessionId");
        
        if (!sessionId) {
            const response = await axiosClient.post("/chat/session");
            sessionId = response.id;
            localStorage.setItem("chatSessionId", sessionId);
        }
        else{
            const response = await axiosClient.get(`/chat/session/${sessionId}`);
            sessionId = response.id;
            localStorage.setItem("chatSessionId", sessionId);
            console.log("Gỡ session cũ")
        }
        return sessionId;
    } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
    }
};

export const getChatHistory = async (chatSessionId) => {
    try {

        const response = await axiosClient.get(`/chat/history/${chatSessionId}`);

        return response;
    } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
    }
};

export const getAllCustomer = async (channel, tagId) => {
    try {
        const params = {};
        if (channel) params.channel = channel;
        if (tagId) params.tag_id = tagId;
        
        const response = await axiosClient.get("/chat/admin/customers", {
            params   
        });
        return response;
    } catch (error) {
        console.error("Error fetching customers:", error);
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

export const updateStatus = async (id,data) => {
    try {
        const response = await axiosClient.patch(`/chat/${id}`, data);
        return response
    } catch (error) {
        throw error
    }
}
export const updateTag = async (id,data) => {
    try {
        console.log("data tag:", data)
        const response = await axiosClient.patch(`/chat/tag/${id}`, data);
        console.log("response tag:", response)
        return response
    } catch (error) {
        throw error
    }
}
export const deleteSessionChat = async (ids) => {
    try {
        const res = await axiosClient.delete(`/chat/chat_sessions`, {
            data: { ids }
        });
        return res
    } catch (error) {
        throw error
    }
}

export const deleteMess = async (ids, chatId) => {
    try {
        const res = await axiosClient.delete(`/chat/messages/${chatId}`, {
            data: { ids }  // <-- truyền body ở đây
        });
        return res;
    } catch (error) {
        throw error;
    }
}

export const sendBulkMessage = async (data) => {
    try
    {
        const res = await axiosClient.post(`/chat/send_message`, data);
        return res;
    } catch (error) {
        throw error;
    }
}