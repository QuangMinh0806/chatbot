(function () {
    const scriptTag = document.currentScript;
    const API_URL = "https://yourdomain.com"; // domain backend của bạn
    const WS_URL = "wss://yourdomain.com";    // WebSocket server
    let socketCustomer = null;
    let sessionId = localStorage.getItem("chatSessionId");


    // Giao diện chat đơn giản
    const chatButton = document.createElement("div");
    chatButton.textContent = "💬 Chat";
    chatButton.style.cssText = `
    position:fixed; bottom:20px; right:20px;
    background:#007bff; color:white;
    border-radius:50%; width:60px; height:60px;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; box-shadow:0 2px 8px rgba(0,0,0,0.2);
    z-index:9999;
  `;
    document.body.appendChild(chatButton);


    const chatBox = document.createElement("div");
    chatBox.style.cssText = `
    position:fixed; bottom:90px; right:20px;
    width:300px; height:400px; background:white;
    border-radius:10px; box-shadow:0 3px 8px rgba(0,0,0,0.3);
    display:none; flex-direction:column; overflow:hidden; z-index:9999;
  `;
    chatBox.innerHTML = `
    <div style="background:#007bff;color:white;padding:10px;">Hỗ trợ khách hàng</div>
    <div id="chatMessages" style="flex:1;padding:10px;overflow-y:auto;"></div>
    <div style="padding:10px;border-top:1px solid #ddd;">
      <input id="chatInput" style="width:80%;padding:5px;" placeholder="Nhập tin nhắn...">
      <button id="chatSend">Gửi</button>
    </div>
  `;
    document.body.appendChild(chatBox);


    chatButton.onclick = () => {
        chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
    };


    // Hàm tạo hoặc lấy session
    async function checkSession() {
        try {
            if (!sessionId) {
                const res = await fetch(`${API_URL}/chat/session`, { method: "POST" });
                const data = await res.json();
                sessionId = data.id;
                localStorage.setItem("chatSessionId", sessionId);
            }
            return sessionId;
        } catch (err) {
            console.error("Error creating session", err);
        }
    }


    // Kết nối WebSocket
    async function connectSocket() {
        const sid = await checkSession();
        socketCustomer = new WebSocket(`${WS_URL}/chat/ws/customer?sessionId=${sid}`);


        const chatMessages = document.getElementById("chatMessages");
        const chatInput = document.getElementById("chatInput");
        const chatSend = document.getElementById("chatSend");


        socketCustomer.onopen = () => console.log("Connected to chat server");


        socketCustomer.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const msg = document.createElement("div");
            msg.textContent = data.content || event.data;
            chatMessages.appendChild(msg);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };


        chatSend.onclick = () => {
            const text = chatInput.value.trim();
            if (!text) return;
            socketCustomer.send(JSON.stringify({
                chat_session_id: sid,
                sender_type: "customer",
                content: text
            }));
            chatInput.value = "";
        };
    }


    connectSocket();
})();