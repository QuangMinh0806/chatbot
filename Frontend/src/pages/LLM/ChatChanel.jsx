import { useState } from "react";
import { Settings, Bot, Edit3, Check, X } from "lucide-react";
const ChatChanel = ({ greetingMessage, setGreetingMessage, botName, setBotName }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState(botName);

    const handleSave = () => {
        if (tempName.trim()) {
            setBotName(tempName.trim());
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setTempName(botName);
        setIsEditing(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };
    const handleGreetingMessageChange = (e) => {
        setGreetingMessage(e.target.value);
    };

    const resetToDefault = () => {
        const defaultGreeting = `Em là nhân viên tư vấn của hệ thống đào tạo tiếng Trung THANHMAIHSK. Em rất vui được hỗ trợ anh/chị!
Trung tâm THANHMAIHSK chuyên đào tạo:
- Tiếng Trung HSK (các cấp độ)
- Tiếng Trung giao tiếp
- Tiếng Trung doanh nghiệp
- Luyện thi tiếng Trung

Anh/chị muốn tìm hiểu về khóa học nào ạ? Em sẽ tư vấn chi tiết giúp anh/chị!
`;


        setGreetingMessage(defaultGreeting);
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-700/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

                <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">💬</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Lời chào mặc định</h2>
                        <p className="text-blue-100 text-lg">
                            Tin nhắn đầu tiên mà khách hàng sẽ thấy khi bắt đầu cuộc trò chuyện trên website
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Greeting Message Input */}
                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 border-2 border-yellow-200 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-2xl">📝</span>
                            </div>
                            <h3 className="font-bold text-yellow-900 text-2xl">Nội dung lời chào</h3>
                        </div>

                        <div className="space-y-6">
                            <textarea
                                value={greetingMessage}
                                onChange={handleGreetingMessageChange}
                                rows={15}
                                className="w-full p-6 border-2 border-yellow-300 rounded-xl resize-none focus:ring-yellow-500 focus:border-yellow-500 text-lg leading-relaxed"
                                placeholder="Nhập lời chào mặc định..."
                            />

                            <button
                                onClick={resetToDefault}
                                className="w-full px-6 py-4 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all font-bold text-lg"
                            >
                                🔄 Khôi phục mặc định
                            </button>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 border-2 border-purple-200">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-2xl">👀</span>
                            </div>
                            <h3 className="font-bold text-purple-900 text-2xl">Xem trước</h3>
                        </div>

                        <div className="bg-white rounded-xl p-6 border border-purple-300 min-h-[500px]">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-lg">🤖</span>
                                </div>
                                <div className="bg-blue-100 rounded-2xl p-5 max-w-full shadow-sm">
                                    <p className="text-blue-800 text-lg leading-relaxed whitespace-pre-wrap">
                                        {greetingMessage}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Display */}
                <div>
                    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                <Settings className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-xl">Cấu hình tên gọi chatbot</h3>
                                <p className="text-gray-500 text-sm mt-1">Tùy chỉnh tên hiển thị của trợ lý AI</p>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
                            <div className="flex items-center justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Bot className="text-white w-8 h-8" />
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-500 mb-3">Tên hiện tại của chatbot:</p>

                                {!isEditing ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-xl shadow-md">
                                            {botName}
                                        </div>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                            title="Chỉnh sửa tên"
                                        >
                                            <Edit3 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                                        <input
                                            type="text"
                                            value={tempName}
                                            onChange={(e) => setTempName(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            className="flex-1 px-4 py-3 border-2 border-blue-200 rounded-xl text-center font-bold text-xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                            placeholder="Nhập tên chatbot..."
                                            autoFocus
                                            maxLength={50}
                                        />
                                        <button
                                            onClick={handleSave}
                                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-200"
                                            title="Lưu"
                                        >
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                            title="Hủy"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Character count */}
                            <div className="text-center">
                                <p className="text-xs text-gray-400">
                                    {isEditing ? tempName.length : botName.length}/50 ký tự
                                </p>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-white text-xs font-bold">💡</span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-blue-800 text-sm mb-1">Gợi ý:</h4>
                                    <ul className="text-xs text-blue-600 space-y-1">
                                        <li>• Chọn tên ngắn gọn, dễ nhớ</li>
                                        <li>• Tránh sử dụng ký tự đặc biệt</li>
                                        <li>• Tên nên phản ánh tính cách của chatbot</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatChanel;
