import React, { useEffect, useState, useRef } from "react";
import { Image, X, Send, Users, MessageSquare, Eye, Filter, Tag } from "lucide-react";
import { getAllCustomer, sendBulkMessage } from "../../services/messengerService";
import { getTag } from "../../services/tagService";

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
    const [allSelectedCustomers, setAllSelectedCustomers] = useState([]); // Lưu tất cả khách hàng đã chọn từ mọi nền tảng
    const [selectAll, setSelectAll] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState("all");
    const [selectedTag, setSelectedTag] = useState("all");
    const [imagePreview, setImagePreview] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [allCustomers, setAllCustomers] = useState([]); // Lưu tất cả khách hàng từ mọi nền tảng
    const [tags, setTags] = useState([]);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await getTag();
                setTags(res);
            } catch (err) {
                console.error("Error fetching tags:", err);
            }
        };
        fetchTags();
    }, []);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const channel = selectedChannel === "all" ? undefined : selectedChannel;
                const tagId = selectedTag === "all" ? undefined : selectedTag;
                const res = await getAllCustomer(channel, tagId);
                setCustomers(res);

                // Cập nhật allCustomers với khách hàng mới, tránh trùng lặp
                setAllCustomers(prev => {
                    const existingIds = prev.map(c => c.session_id);
                    const newCustomers = res.filter(c => !existingIds.includes(c.session_id));
                    return [...prev, ...newCustomers];
                });
            } catch (err) {
                console.error("Error fetching customers:", err);
            }
        };
        fetchCustomers();
    }, [selectedChannel, selectedTag]);

    // Effect riêng để cập nhật allSelectedCustomers khi selectedCustomers thay đổi
    // Effect để đồng bộ selectedCustomers với allSelectedCustomers khi thay đổi filter
    useEffect(() => {
        if (customers.length > 0) {
            const currentCustomerIds = customers.map(c => c.session_id);
            const selectedInCurrentFilter = allSelectedCustomers.filter(id => currentCustomerIds.includes(id));
            setSelectedCustomers(selectedInCurrentFilter);

            // Cập nhật selectAll state
            setSelectAll(selectedInCurrentFilter.length === customers.length && customers.length > 0);
        }
    }, [customers, allSelectedCustomers]);

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
        const defaultPromotion = `🎉 KHUYẾN MÃI ĐẶC BIỆT - A2A Fashion 🎉
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

        // Cập nhật allSelectedCustomers ngay lập tức
        setAllSelectedCustomers(prev => {
            if (prev.includes(customerId)) {
                return prev.filter(id => id !== customerId);
            } else {
                return [...prev, customerId];
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

                if (file.size > 500 * 1024) {
                    alert(`Ảnh "${file.name}" vượt quá 500KB!`);
                    return;
                }
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
            const currentCustomerIds = customers.map(c => c.session_id);
            setSelectedCustomers([]);
            // Xóa các khách hàng hiện tại khỏi allSelectedCustomers
            setAllSelectedCustomers(prev => prev.filter(id => !currentCustomerIds.includes(id)));
            setSelectAll(false);
        } else {
            const currentCustomerIds = customers.map(customer => customer.session_id);
            setSelectedCustomers(currentCustomerIds);
            // Thêm tất cả khách hàng hiện tại vào allSelectedCustomers
            setAllSelectedCustomers(prev => {
                const filtered = prev.filter(id => !currentCustomerIds.includes(id));
                return [...filtered, ...currentCustomerIds];
            });
            setSelectAll(true);
        }
    };

    const clearAllFilters = () => {
        setSelectedChannel("all");
        setSelectedTag("all");
        setSelectedCustomers([]);
        setAllSelectedCustomers([]);
        setAllCustomers([]);
        setSelectAll(false);
    };

    const handleSendMessage = async () => {
        console.log("Gửi tin nhắn khuyến mãi");

        // Validate input
        if (allSelectedCustomers.length === 0) {
            alert("Vui lòng chọn ít nhất một khách hàng!");
            return;
        }
        if (promotionMessage.trim() === "" && imagePreview.length === 0) {
            alert("Vui lòng nhập nội dung tin nhắn hoặc chọn ảnh!");
            return;
        }

        // Confirm before sending
        const confirmMessage = `Bạn có chắc chắn muốn gửi tin nhắn${imagePreview.length > 0 ? ` và ${imagePreview.length} ảnh` : ''} cho ${allSelectedCustomers.length} khách hàng?`;
        if (!confirm(confirmMessage)) {
            return;
        }

        // Store current values before clearing to prevent data loss
        const messageContent = promotionMessage.trim();
        const messageImages = [...imagePreview];
        const selectedCustomerIds = [...allSelectedCustomers];

        // Clear form immediately for better UX
        setPromotionMessage("");
        setImagePreview([]);
        setSelectedCustomers([]);
        setAllSelectedCustomers([]);
        setSelectAll(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }

        try {
            console.log("Selected Customers:", selectedCustomerIds);
            console.log("Message Content:", messageContent);
            console.log("Images:", messageImages);

            // Prepare data with proper image format (base64 strings from imagePreview)
            const imageData = messageImages.map(img => img.url); // Get base64 URLs

            const data = {
                customers: selectedCustomerIds,
                content: messageContent,
                image: imageData // Send as 'image' array like in ChatPage
            };

            // Send messages to all selected customers
            const res = await sendBulkMessage(data);
            console.log("Send bulk message result:", res);

            if (res.status === "success") {
                alert(`✅ Đã gửi thành công tin nhắn${imageData.length > 0 ? ` và ${imageData.length} ảnh` : ''} cho ${selectedCustomerIds.length} khách hàng!`);
            } else {
                alert(`❌ Không thể gửi tin nhắn cho bất kỳ khách hàng nào!`);
                // Restore data on failure
                setPromotionMessage(messageContent);
                setImagePreview(messageImages);
                setAllSelectedCustomers(selectedCustomerIds);
            }

        } catch (error) {
            console.error("Error in bulk send:", error);
            alert("❌ Có lỗi xảy ra khi gửi tin nhắn!");

            // Restore data on error
            setPromotionMessage(messageContent);
            setImagePreview(messageImages);
            setAllSelectedCustomers(selectedCustomerIds);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 mb-6">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Send className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Gửi tin nhắn hàng loạt</h1>
                            <p className="text-gray-600 text-sm">Tạo và gửi tin nhắn khuyến mãi cho khách hàng</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Customer Selection */}
                    <div className="xl:col-span-1 bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Users className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900">Chọn khách hàng</h3>
                                </div>
                                {(selectedChannel !== "all" || selectedTag !== "all") && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                                    >
                                        Xóa bộ lọc
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Channel Filter */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-600" />
                                    <label className="text-sm font-medium text-gray-700">Lọc theo kênh</label>
                                </div>
                                <select
                                    value={selectedChannel}
                                    onChange={(e) => {
                                        setSelectedChannel(e.target.value);
                                        setSelectedCustomers([]);
                                        setSelectAll(false);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {channelOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.icon} {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tag Filter */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-gray-600" />
                                    <label className="text-sm font-medium text-gray-700">Lọc theo tag</label>
                                </div>
                                <select
                                    value={selectedTag}
                                    onChange={(e) => {
                                        setSelectedTag(e.target.value);
                                        setSelectedCustomers([]);
                                        setSelectAll(false);
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="all">🏷️ Tất cả tag</option>
                                    {tags.map(tag => (
                                        <option key={tag.id} value={tag.id}>
                                            <span style={{ backgroundColor: tag.color }} className="inline-block w-2 h-2 rounded-full mr-2"></span>
                                            {tag.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Select All */}
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                                    />
                                    <span className="font-medium text-gray-800">Chọn tất cả ({customers.length})</span>
                                </label>
                            </div>

                            {/* Customer List */}
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {customers.map(customer => {
                                    const channelInfo = getChannelInfo(customer.channel);
                                    return (
                                        <div key={customer.session_id} className="bg-white p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelectedCustomers.includes(customer.session_id)}
                                                    onChange={() => handleCustomerSelect(customer.session_id)}
                                                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 mt-1"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-medium text-gray-800 truncate">{customer.name}</p>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${channelInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                                            channelInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {channelInfo.icon} {channelInfo.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate">{customer.page_id}</p>
                                                </div>
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Selected Customers List */}
                            {allSelectedCustomers.length > 0 && (
                                <div className="border border-gray-200 rounded-lg">
                                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                                        <h4 className="font-medium text-gray-800">Khách hàng đã chọn ({allSelectedCustomers.length})</h4>
                                    </div>
                                    <div className="p-3 max-h-40 overflow-y-auto space-y-2">
                                        {allCustomers
                                            .filter(customer => allSelectedCustomers.includes(customer.session_id))
                                            .map(customer => {
                                                const channelInfo = getChannelInfo(customer.channel);
                                                const isInCurrentFilter = selectedCustomers.includes(customer.session_id);
                                                return (
                                                    <div key={customer.session_id} className={`flex items-center justify-between p-2 rounded border ${isInCurrentFilter ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${channelInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                                                                channelInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                                }`}>
                                                                {channelInfo.icon}
                                                            </span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-800 text-sm truncate">{customer.name}</p>
                                                                <p className="text-xs text-gray-500 truncate">{customer.page_id}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleCustomerSelect(customer.session_id)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            title="Bỏ chọn"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        {allSelectedCustomers.length > 0 && allCustomers.filter(customer => allSelectedCustomers.includes(customer.session_id)).length === 0 && (
                                            <p className="text-sm text-gray-500 text-center italic">Đang tải thông tin khách hàng...</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle: Message Configuration */}
                    <div className="xl:col-span-1 bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Nội dung tin nhắn</h3>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Nội dung tin nhắn</label>
                                <textarea
                                    value={promotionMessage}
                                    onChange={handlePromotionMessageChange}
                                    rows={10}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nhập nội dung tin nhắn khuyến mãi..."
                                />
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-500">{promotionMessage.length} ký tự</span>
                                    <button
                                        onClick={resetToDefault}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        Sử dụng mẫu có sẵn
                                    </button>
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-800 flex items-center gap-2">
                                        <Image className="w-4 h-4" />
                                        Đính kèm ảnh
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
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

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Độ dài tin nhắn</p>
                                    <p className="font-semibold text-gray-900">{promotionMessage.length} ký tự</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-gray-600">Số ảnh</p>
                                    <p className="font-semibold text-gray-900">{imagePreview.length} ảnh</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="xl:col-span-1 bg-white rounded-lg border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Xem trước</h3>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="bg-gray-50 rounded-lg p-4 min-h-[300px]">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Send className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white rounded-lg p-3 shadow-sm flex-1 max-w-[85%]">
                                        {promotionMessage && (
                                            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mb-3">
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
                                                        className="w-full h-16 object-cover rounded border"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {!promotionMessage && imagePreview.length === 0 && (
                                            <p className="text-gray-500 text-sm italic">
                                                Nội dung tin nhắn sẽ hiển thị ở đây...
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Send Button */}
                            <button
                                onClick={handleSendMessage}
                                disabled={allSelectedCustomers.length === 0 || (promotionMessage.trim() === "" && imagePreview.length === 0)}
                                className={`w-full mt-6 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${allSelectedCustomers.length > 0 && (promotionMessage.trim() !== "" || imagePreview.length > 0)
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                {allSelectedCustomers.length === 0
                                    ? "Chưa chọn khách hàng"
                                    : (promotionMessage.trim() === "" && imagePreview.length === 0)
                                        ? "Chưa có nội dung"
                                        : `Gửi cho ${allSelectedCustomers.length} khách hàng${imagePreview.length > 0 ? ` (${imagePreview.length} ảnh)` : ''}`
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SendMessage;