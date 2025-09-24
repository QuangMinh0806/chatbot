import React, { useEffect, useState, useRef } from "react";
import { Image, X } from "lucide-react";
import { getAllCustomer, sendBulkMessage } from "../../services/messengerService";

const channelOptions = [
    { value: "all", label: "Tất cả kênh", icon: "🌐", color: "gray" },
    { value: "facebook", label: "Facebook", icon: "📘", color: "blue" },
    { value: "zalo", label: "Zalo", icon: "💬", color: "blue" },
    { value: "telegram", label: "Telegram", icon: "✈️", color: "blue" },
    { value: "web", label: "Website", icon: "🌍", color: "green" },
    { value: "other", label: "Khác", icon: "📱", color: "gray" }
];

const SendMessage = () => {
    const [promotionMessage, setPromotionMessage] = useState("");
    const [selectedCustomers, setSelectedCustomers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState("all");
    const [imagePreview, setImagePreview] = useState([]);
    const [customers, setCustomers] = useState([]);

    const fileInputRef = useRef(null);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await getAllCustomer(selectedChannel === "all" ? undefined : selectedChannel);
                setCustomers(res);
            } catch (err) {
                console.error("Error fetching customers:", err);
            }
        };
        fetchCustomers();
    }, [selectedChannel]);

    const removeImage = (index) => {
        setImagePreview((prev) => prev.filter((_, i) => i !== index));
        if (fileInputRef.current && imagePreview.length === 1) {
            fileInputRef.current.value = "";
        }
    };

    const handlePromotionMessageChange = (e) => {
        setPromotionMessage(e.target.value);
    };

    const resetToDefault = () => {
        const defaultPromotion = `🎉 KHUYẾN MÃI ĐẶC BIỆT - THANHMAIHSK 🎉

📚 Ưu đại lớn cho các khóa học tiếng Trung:
✨ Giảm 30% học phí cho khóa HSK
✨ Tặng tài liệu học tập trị giá 500.000đ
✨ Học thử MIỄN PHÍ buổi đầu tiên

⏰ Thời gian có hạn: từ nay đến 30/10/2025
📞 Liên hệ ngay: 0123.456.789
🌐 Website: www.thanhmaihsk.com

Đăng ký ngay để không bỏ lỡ cơ hội vàng này! 💫`;

        setPromotionMessage(defaultPromotion);
    };

    const handleCustomerSelect = (customerId) => {
        setSelectedCustomers(prev => {
            if (prev.includes(customerId)) {
                const newSelection = prev.filter(id => id !== customerId);
                setSelectAll(false);
                return newSelection;
            } else {
                const newSelection = [...prev, customerId];
                if (newSelection.length === customers.length) {
                    setSelectAll(true);
                }
                return newSelection;
            }
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const newPreviews = [];
        let processedCount = 0;

        files.forEach((file) => {
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    newPreviews.push({
                        id: Date.now() + Math.random(),
                        url: reader.result,
                        name: file.name,
                        file: file
                    });
                    processedCount++;

                    if (processedCount === files.length) {
                        setImagePreview((prev) => [...prev, ...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            } else {
                processedCount++;
                if (processedCount === files.length && newPreviews.length > 0) {
                    setImagePreview((prev) => [...prev, ...newPreviews]);
                }
            }
        });
    };

    const getChannelInfo = (channel) => {
        return channelOptions.find(option => option.value === channel) || channelOptions[channelOptions.length - 1];
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedCustomers([]);
            setSelectAll(false);
        } else {
            setSelectedCustomers(customers.map(customer => customer.session_id));
            setSelectAll(true);
        }
    };

    const handleSendMessage = async () => {
        console.log("Gửi tin nhắn khuyến mãi");
        // Validate input
        if (selectedCustomers.length === 0) {
            alert("Vui lòng chọn ít nhất một khách hàng!");
            return;
        }
        if (promotionMessage.trim() === "" && imagePreview.length === 0) {
            alert("Vui lòng nhập nội dung tin nhắn hoặc chọn ảnh!");
            return;
        }

        // Confirm before sending
        const confirmMessage = `Bạn có chắc chắn muốn gửi tin nhắn${imagePreview.length > 0 ? ` và ${imagePreview.length} ảnh` : ''} cho ${selectedCustomers.length} khách hàng?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        // Store current values before clearing
        console.log("Selected Customers:", selectedCustomers);
        console.log("Message Content:", promotionMessage);
        console.log("Images:", imagePreview);
        const messageContent = promotionMessage.trim();
        const messageImages = [...imagePreview];

        try {
            // Show loading state (có thể thêm loading spinner)
            const sendButton = document.querySelector('button[disabled]');
            if (sendButton) {
                sendButton.textContent = '⏳ Đang gửi...';
                sendButton.disabled = true;
            }
            const data = {
                customers: selectedCustomers,
                content: messageContent
            }
            // Send messages to all selected customers
            try {
                const res = await sendBulkMessage(data);
                console.log("Send bulk message result:", res);
                if (res.status) {
                    alert(`✅ Đã gửi thành công tin nhắn cho khách hàng!`);
                } else {
                    alert(`❌ Không thể gửi tin nhắn cho bất kỳ khách hàng nào!`);
                }
            } catch (error) {
                console.error("Failed to send bulk message:", error);
            }

            // Show results

            setPromotionMessage("");
            setImagePreview([]);
            setSelectedCustomers([]);
            setSelectAll(false);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

        } catch (error) {
            console.error("Error in bulk send:", error);
            alert("❌ Có lỗi xảy ra khi gửi tin nhắn!");
        } finally {
            // Reset button state
            const sendButton = document.querySelector('button');
            if (sendButton) {
                sendButton.disabled = selectedCustomers.length === 0 ||
                    (promotionMessage.trim() === "" && imagePreview.length === 0);
                // Button text will be updated by React re-render
            }
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-red-600/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

                <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">🎯</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Cấu hình Tin nhắn Khuyến mãi</h2>
                        <p className="text-orange-100 text-lg">
                            Tạo và gửi tin nhắn khuyến mãi cho khách hàng đã có trong hệ thống
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left: Customer Selection */}
                    <div className="xl:col-span-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">👥</span>
                            </div>
                            <h3 className="font-bold text-blue-900 text-xl">Chọn khách hàng</h3>
                        </div>

                        {/* Channel Filter */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-blue-800 mb-2">Lọc theo kênh:</label>
                            <select
                                value={selectedChannel}
                                onChange={(e) => {
                                    setSelectedChannel(e.target.value);
                                    setSelectedCustomers([]);
                                    setSelectAll(false);
                                }}
                                className="w-full p-3 border-2 border-blue-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 font-medium"
                            >
                                {channelOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.icon} {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Select All */}
                        <div className="mb-4 p-3 bg-white rounded-lg border-2 border-blue-300">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                                />
                                <span className="font-bold text-blue-800">Chọn tất cả ({customers.length})</span>
                            </label>
                        </div>

                        {/* Customer List */}
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {customers.map(customer => {
                                const channelInfo = getChannelInfo(customer.channel);
                                return (
                                    <div key={customer.session_id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedCustomers.includes(customer.session_id)}
                                                onChange={() => handleCustomerSelect(customer.session_id)}
                                                className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500 mt-1"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-semibold text-gray-800 truncate">{customer.name}</p>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${channelInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                                        channelInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {channelInfo.icon} {channelInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 truncate">{customer.page_id}</p>
                                            </div>
                                        </label>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Selection Summary */}
                        <div className="mt-4 p-3 bg-blue-600 text-white rounded-lg text-center">
                            <p className="font-bold">Đã chọn: {selectedCustomers.length} khách hàng</p>
                        </div>
                    </div>

                    {/* Middle: Message Configuration */}
                    <div className="xl:col-span-1 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">📝</span>
                            </div>
                            <h3 className="font-bold text-yellow-900 text-xl">Nội dung tin nhắn</h3>
                        </div>

                        <div className="space-y-4">
                            <textarea
                                value={promotionMessage}
                                onChange={handlePromotionMessageChange}
                                rows={12}
                                className="w-full p-4 border-2 border-yellow-300 rounded-lg resize-none focus:ring-yellow-500 focus:border-yellow-500 text-sm leading-relaxed"
                                placeholder="Nhập nội dung tin nhắn khuyến mãi..."
                            />

                            <button
                                onClick={resetToDefault}
                                className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all font-bold"
                            >
                                🔄 Mẫu tin nhắn khuyến mãi
                            </button>

                            {/* Image Upload Section */}
                            <div className="bg-white border-2 border-yellow-300 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-yellow-800">📷 Đính kèm ảnh</h4>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-all flex items-center gap-2"
                                    >
                                        <Image className="w-4 h-4" />
                                        Chọn ảnh
                                    </button>
                                </div>

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    multiple
                                    className="hidden"
                                />

                                {/* Image Preview */}
                                {imagePreview.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-3">
                                        {imagePreview.map((img, index) => (
                                            <div key={img.id} className="relative group">
                                                <img
                                                    src={img.url}
                                                    alt={`Preview ${index}`}
                                                    className="w-full h-20 object-cover rounded-lg border border-gray-300"
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    type="button"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                                                    {img.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {imagePreview.length === 0 && (
                                    <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-lg">
                                        Chưa có ảnh nào được chọn
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg p-3 border text-center">
                                    <p className="text-sm text-gray-600 mb-1">Độ dài tin nhắn:</p>
                                    <p className="font-bold text-yellow-600 text-lg">
                                        {promotionMessage.length} ký tự
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border text-center">
                                    <p className="text-sm text-gray-600 mb-1">Số ảnh:</p>
                                    <p className="font-bold text-yellow-600 text-lg">
                                        {imagePreview.length} ảnh
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="xl:col-span-1 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">👀</span>
                            </div>
                            <h3 className="font-bold text-purple-900 text-xl">Xem trước</h3>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-purple-300 min-h-[400px]">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white">🎁</span>
                                </div>
                                <div className="bg-orange-100 rounded-2xl p-4 max-w-full shadow-sm flex-1">
                                    {promotionMessage && (
                                        <p className="text-orange-800 text-sm leading-relaxed whitespace-pre-wrap mb-3">
                                            {promotionMessage}
                                        </p>
                                    )}

                                    {imagePreview.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {imagePreview.map((image, index) => (
                                                <img
                                                    key={image.id}
                                                    src={image.url}
                                                    alt={image.name}
                                                    className="w-full h-20 object-cover rounded border"
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {!promotionMessage && imagePreview.length === 0 && (
                                        <p className="text-orange-600 text-sm italic">
                                            Nội dung tin nhắn và ảnh sẽ hiển thị ở đây...
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Send Button */}
                        <button
                            onClick={handleSendMessage}
                            disabled={selectedCustomers.length === 0 || (promotionMessage.trim() === "" && imagePreview.length === 0)}
                            className={`w-full mt-6 px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${selectedCustomers.length > 0 && (promotionMessage.trim() !== "" || imagePreview.length > 0)
                                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                }`}
                        >
                            {selectedCustomers.length === 0
                                ? "⚠️ Chưa chọn khách hàng"
                                : (promotionMessage.trim() === "" && imagePreview.length === 0)
                                    ? "⚠️ Chưa có nội dung"
                                    : `🚀 Gửi cho ${selectedCustomers.length} khách hàng ${imagePreview.length > 0 ? `(${imagePreview.length} ảnh)` : ''}`
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendMessage;