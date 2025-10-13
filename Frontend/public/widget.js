(function () {
    const scriptTag = document.currentScript;
    const API_URL = scriptTag.getAttribute("data-api-url") || "https://chatbotbe.a2alab.vn"; // domain backend của bạn
    const WS_URL = scriptTag.getAttribute("data-ws-url") || "wss://chatbotbe.a2alab.vn";    // WebSocket server (default: same as API_URL)
    let socketCustomer = null;
    let sessionId = localStorage.getItem("chatSessionId");
    let isConnected = false;
    let isWaitingBot = false;
    let botName = "Bot";
    let page = 1;
    let messageIds = new Set(); // ✅ Theo dõi ID tin nhắn đã hiển thị để tránh trùng lặp
    let isHistoryLoaded = false; // ✅ Đánh dấu đã load lịch sử chưa

    // Giao diện chat đẹp hơn
    const chatButton = document.createElement("div");
    chatButton.innerHTML = "💬";
    chatButton.style.cssText = `
        position:fixed; bottom:20px; right:20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color:white;
        border-radius:50%; width:60px; height:60px;
        display:flex; align-items:center; justify-content:center;
        cursor:pointer; box-shadow:0 4px 12px rgba(102, 126, 234, 0.4);
        z-index:9999;
        font-size: 24px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    `;
    chatButton.onmouseover = () => {
        chatButton.style.transform = "scale(1.1)";
        chatButton.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.6)";
    };
    chatButton.onmouseout = () => {
        chatButton.style.transform = "scale(1)";
        chatButton.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
    };
    document.body.appendChild(chatButton);

    const chatBox = document.createElement("div");
    chatBox.style.cssText = `
        position:fixed; bottom:90px; right:20px;
        width:380px; height:550px; background:white;
        border-radius:16px; box-shadow:0 8px 32px rgba(0,0,0,0.15);
        display:none; flex-direction:column; overflow:hidden; z-index:9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;
    chatBox.innerHTML = `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;padding:16px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;">
                    🤖
                </div>
                <div>
                    <div style="font-weight:600;font-size:16px;">Chat với THANHMAIHSK</div>
                    <div style="font-size:12px;opacity:0.9;display:flex;align-items:center;gap:5px;">
                        <span id="connectionStatus" style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:50%;"></span>
                        <span id="connectionText">Đang kết nối...</span>
                    </div>
                </div>
            </div>
            <button id="closeChat" style="background:transparent;border:none;color:white;font-size:24px;cursor:pointer;padding:0;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:background 0.2s;">×</button>
        </div>
        <div id="chatMessages" style="flex:1;padding:16px;overflow-y:auto;background:#f9fafb;"></div>
        <div id="typingIndicator" style="display:none;padding:8px 16px;background:#f9fafb;">
            <div style="display:flex;align-items:center;gap:8px;">
                <div style="width:28px;height:28px;background:#6b7280;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">🤖</div>
                <div style="background:white;border:1px solid #e5e7eb;border-radius:12px;padding:8px 12px;">
                    <div style="display:flex;gap:4px;">
                        <div style="width:8px;height:8px;background:#9ca3af;border-radius:50%;animation:bounce 1.4s infinite;"></div>
                        <div style="width:8px;height:8px;background:#9ca3af;border-radius:50%;animation:bounce 1.4s infinite 0.2s;"></div>
                        <div style="width:8px;height:8px;background:#9ca3af;border-radius:50%;animation:bounce 1.4s infinite 0.4s;"></div>
                    </div>
                </div>
            </div>
        </div>
        <div style="padding:12px;border-top:1px solid #e5e7eb;background:white;">
            <div style="display:flex;gap:8px;align-items:flex-end;">
                <textarea id="chatInput" style="flex:1;padding:10px;border:1px solid #d1d5db;border-radius:12px;resize:none;font-size:14px;font-family:inherit;min-height:42px;max-height:120px;outline:none;transition:border-color 0.2s;" placeholder="Nhập tin nhắn... (Shift+Enter để xuống dòng)" rows="1"></textarea>
                <button id="chatSend" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;border:none;border-radius:12px;padding:10px 16px;cursor:pointer;font-weight:500;transition:opacity 0.2s;min-width:60px;height:42px;">Gửi</button>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:11px;color:#9ca3af;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span id="statusDot" style="display:inline-block;width:6px;height:6px;background:#ef4444;border-radius:50%;"></span>
                    <span id="statusText">Mất kết nối</span>
                </div>
                <div style="display:flex;gap:8px;">
                    <span>Realtime</span>
                    <span>•</span>
                    <span>AI Powered</span>
                </div>
            </div>
        </div>
    `;

    // Thêm CSS animations
    const style = document.createElement("style");
    style.textContent = `
        @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }
        #closeChat:hover {
            background: rgba(255,255,255,0.2) !important;
        }
        #chatInput:focus {
            border-color: #667eea !important;
        }
        #chatSend:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        #chatSend:hover:not(:disabled) {
            opacity: 0.9;
        }
        #chatMessages::-webkit-scrollbar {
            width: 6px;
        }
        #chatMessages::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        #chatMessages::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
        }
        #chatMessages::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(chatBox);

    const chatMessages = document.getElementById("chatMessages");
    const chatInput = document.getElementById("chatInput");
    const chatSend = document.getElementById("chatSend");
    const closeChat = document.getElementById("closeChat");
    const typingIndicator = document.getElementById("typingIndicator");
    const connectionStatus = document.getElementById("connectionStatus");
    const connectionText = document.getElementById("connectionText");
    const statusDot = document.getElementById("statusDot");
    const statusText = document.getElementById("statusText");

    // Hàm escape HTML để tránh XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Toggle chat box
    chatButton.onclick = () => {
        const isVisible = chatBox.style.display === "flex";
        chatBox.style.display = isVisible ? "none" : "flex";
        if (!isVisible) {
            // Khi mở chatbox, luôn load lịch sử nếu chưa load
            if (!isHistoryLoaded) {
                loadChatHistory();
            }
            // Kiểm tra và kết nối lại WebSocket nếu bị ngắt
            if (!isConnected || (socketCustomer && socketCustomer.readyState !== WebSocket.OPEN)) {
                console.log("🔄 Reconnecting WebSocket...");
                connectSocket();
            }
        }
    };

    closeChat.onclick = () => {
        chatBox.style.display = "none";
    };

    // Cập nhật trạng thái kết nối
    function updateConnectionStatus(connected) {
        isConnected = connected;
        const color = connected ? "#10b981" : "#ef4444";
        const text = connected ? "Đã kết nối" : "Mất kết nối";

        connectionStatus.style.background = color;
        connectionText.textContent = text;
        statusDot.style.background = color;
        statusText.textContent = text;

        chatSend.disabled = !connected;
    }

    // Hiển thị tin nhắn
    function displayMessage(msg, skipDuplicateCheck = false) {
        if (!msg || !msg.content) {
            console.warn("⚠️ Tin nhắn không hợp lệ:", msg);
            return;
        }

        // ✅ Kiểm tra trùng lặp dựa vào ID (nếu có)
        if (!skipDuplicateCheck && msg.id && messageIds.has(msg.id)) {
            console.log(`⏭️ Bỏ qua tin nhắn trùng lặp ID: ${msg.id}`);
            return;
        }

        // ✅ Thêm ID vào Set để theo dõi
        if (msg.id) {
            messageIds.add(msg.id);
        }

        const isCustomer = msg.sender_type === "customer";
        const messageDiv = document.createElement("div");
        messageDiv.style.cssText = `
            display:flex;
            justify-content:${isCustomer ? "flex-end" : "flex-start"};
            margin-bottom:12px;
        `;
        
        // ✅ Thêm data-message-id để có thể tham chiếu sau
        if (msg.id) {
            messageDiv.setAttribute('data-message-id', msg.id);
        }

        // Parse thời gian
        let time = 'Vừa xong';
        if (msg.created_at) {
            try {
                const date = new Date(msg.created_at);
                time = date.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (e) {
                console.warn("⚠️ Lỗi parse thời gian:", e);
            }
        }

        // Parse images
        let images = [];
        if (msg.image) {
            if (Array.isArray(msg.image)) {
                images = msg.image;
            } else if (typeof msg.image === 'string') {
                try {
                    images = JSON.parse(msg.image);
                } catch (e) {
                    if (msg.image.startsWith('http')) {
                        images = [msg.image];
                    }
                }
            }
        }

        messageDiv.innerHTML = `
            <div style="display:flex;align-items:start;gap:8px;max-width:75%;${isCustomer ? 'flex-direction:row-reverse;' : ''}">
                ${!isCustomer ? `<div style="width:28px;height:28px;background:#6b7280;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">🤖</div>` : ''}
                <div style="background:${isCustomer ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white'};
                            color:${isCustomer ? 'white' : '#1f2937'};
                            padding:10px 14px;
                            border-radius:12px;
                            ${isCustomer ? 'border-radius-bottom-right:4px;' : 'border-radius-bottom-left:4px;'}
                            box-shadow:0 1px 3px rgba(0,0,0,0.1);
                            ${!isCustomer ? 'border:1px solid #e5e7eb;' : ''}">
                    <div style="font-size:11px;font-weight:500;margin-bottom:4px;opacity:0.8;">
                        ${isCustomer ? 'Bạn' : botName}
                    </div>
                    ${images.length > 0 ? images.map(img => `
                        <img src="${img}" style="max-width:200px;border-radius:8px;margin-bottom:8px;display:block;" alt="Hình ảnh" />
                    `).join('') : ''}
                    <div style="font-size:14px;line-height:1.5;white-space:pre-line;word-wrap:break-word;">
                        ${escapeHtml(msg.content)}
                    </div>
                    <div style="font-size:10px;margin-top:4px;opacity:0.7;">
                        ${time}
                    </div>
                </div>
                ${isCustomer ? `<div style="width:28px;height:28px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">👤</div>` : ''}
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        
        // Tự động scroll xuống cuối để xem tin nhắn mới nhất
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    // Hàm tạo hoặc lấy session (giống messengerService.js)
    async function checkSession() {
        try {
            let currentSessionId = localStorage.getItem("chatSessionId");
            const oldSessionId = sessionId; // Lưu session ID cũ

            if (!currentSessionId) {
                // Lần đầu tiên: Tạo session mới
                const res = await fetch(`${API_URL}/chat/session`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        url_channel: window.location.href // Lưu URL của trang web nhúng chatbot
                    })
                });
                const data = await res.json();
                currentSessionId = data.id;
                localStorage.setItem("chatSessionId", currentSessionId);
                console.log("✅ Tạo session mới:", currentSessionId);
            } else {
                // Từ lần 2: Kiểm tra session cũ có còn tồn tại không
                try {
                    // Gửi url_channel qua query params
                    const checkUrl = new URL(`${API_URL}/chat/session/${currentSessionId}`);
                    checkUrl.searchParams.append('url_channel', window.location.href);
                    
                    const res = await fetch(checkUrl.toString());
                    if (res.ok) {
                        const data = await res.json();
                        currentSessionId = data.id;
                        console.log("✅ Sử dụng session cũ:", currentSessionId);
                    } else {
                        // Session cũ không tồn tại, tạo mới
                        throw new Error("Session không tồn tại");
                    }
                } catch (err) {
                    console.log("⚠️ Session cũ không hợp lệ, tạo session mới");
                    const res = await fetch(`${API_URL}/chat/session`, { 
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            url_channel: window.location.href
                        })
                    });
                    const data = await res.json();
                    currentSessionId = data.id;
                    localStorage.setItem("chatSessionId", currentSessionId);
                    console.log("✅ Tạo session mới sau khi session cũ hết hạn:", currentSessionId);
                }
            }
            
            // ✅ Nếu session ID thay đổi, reset lịch sử
            if (oldSessionId && oldSessionId !== currentSessionId) {
                console.log("🔄 Session ID thay đổi, reset lịch sử");
                isHistoryLoaded = false;
                messageIds.clear();
                chatMessages.innerHTML = '';
            }
            
            sessionId = currentSessionId;
            return sessionId;
        } catch (err) {
            console.error("❌ Error checking/creating session:", err);
            return null;
        }
    }

    // Load lịch sử chat
    async function loadChatHistory() {
        if (isHistoryLoaded) {
            console.log("ℹ️ Lịch sử đã được load, bỏ qua");
            return;
        }

        try {
            const sid = await checkSession();
            if (!sid) {
                console.error("❌ Không có session ID");
                return;
            }

            console.log(`📚 Đang tải lịch sử chat cho session ${sid}...`);
            const res = await fetch(`${API_URL}/chat/history/${sid}?page=${page}&limit=50`);
            
            if (!res.ok) {
                console.error(`❌ Lỗi tải lịch sử: ${res.status}`);
                return;
            }

            const data = await res.json();
            console.log("📦 Dữ liệu lịch sử nhận được:", data);

            // ✅ Backend trả về array trực tiếp, không có wrapper object
            const messages = Array.isArray(data) ? data : [];

            if (messages.length > 0) {
                console.log(`✅ Tìm thấy ${messages.length} tin nhắn lịch sử`);
                
                // ✅ Clear messageIds trước khi load lịch sử
                messageIds.clear();
                
                // Hiển thị tin nhắn theo thứ tự từ cũ đến mới
                messages.forEach(msg => {
                    displayMessage(msg);
                });
                
                console.log("✅ Đã hiển thị tất cả tin nhắn lịch sử");
                isHistoryLoaded = true;
            } else if (page === 1) {
                console.log("ℹ️ Chưa có lịch sử chat, hiển thị tin nhắn chào mừng");
                // Hiển thị tin nhắn chào mừng nếu chưa có lịch sử
                displayMessage({
                    sender_type: "bot",
                    content: "Xin chào! Tôi có thể giúp gì cho bạn?",
                    created_at: new Date().toISOString(),
                }, true); // skipDuplicateCheck = true cho welcome message
                isHistoryLoaded = true;
            }
        } catch (err) {
            console.error("❌ Lỗi loading chat history:", err);
        }
    }

    // Kết nối WebSocket
    async function connectSocket() {
        const sid = await checkSession();
        if (!sid) {
            console.error("Cannot connect without session ID");
            return;
        }

        socketCustomer = new WebSocket(`${WS_URL}/chat/ws/customer?sessionId=${sid}`);

        socketCustomer.onopen = () => {
            console.log("✅ Connected to chat server");
            updateConnectionStatus(true);
        };

        socketCustomer.onclose = () => {
            console.log("❌ Disconnected from chat server");
            updateConnectionStatus(false);
            // Thử kết nối lại sau 3 giây
            setTimeout(connectSocket, 3000);
        };

        socketCustomer.onerror = (error) => {
            console.error("WebSocket error:", error);
            updateConnectionStatus(false);
        };

        socketCustomer.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📩 Tin nhắn nhận được qua WebSocket:", data);

                // ✅ Ẩn typing indicator khi nhận được phản hồi từ bot/admin
                if (data.sender_type === "bot" || data.sender_type === "admin") {
                    isWaitingBot = false;
                    typingIndicator.style.display = "none";
                }

                // ✅ Chỉ hiển thị tin nhắn từ bot/admin, bỏ qua echo tin nhắn customer
                // (vì tin nhắn customer đã được hiển thị ngay khi gửi)
                if (data.sender_type !== "customer") {
                    displayMessage(data);
                }
            } catch (err) {
                console.error("❌ Lỗi parse tin nhắn WebSocket:", err);
            }
        };
    }

    // Gửi tin nhắn
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text || !isConnected) {
            console.warn("⚠️ Không thể gửi tin nhắn:", { text: !!text, isConnected });
            return;
        }

        // ✅ Tạo tin nhắn tạm thời với ID duy nhất để hiển thị ngay
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        const newMsg = {
            id: tempId, // ID tạm thời
            sender_type: "customer",
            content: text,
            created_at: new Date().toISOString(),
        };

        // ✅ Hiển thị tin nhắn của customer ngay lập tức
        displayMessage(newMsg, true); // skipDuplicateCheck vì là tin nhắn mới

        // ✅ Gửi qua WebSocket
        socketCustomer.send(JSON.stringify({
            chat_session_id: sessionId,
            sender_type: "customer",
            content: text
        }));

        // ✅ Clear input
        chatInput.value = "";
        chatInput.style.height = "42px";

        // ✅ Hiển thị typing indicator
        isWaitingBot = true;
        typingIndicator.style.display = "block";
    }

    // Auto-resize textarea
    chatInput.addEventListener("input", () => {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
    });

    // Xử lý Enter để gửi tin nhắn
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    chatSend.onclick = sendMessage;

    // Khởi tạo
    (async function init() {
        await checkSession();
        await connectSocket();
    })();
})();