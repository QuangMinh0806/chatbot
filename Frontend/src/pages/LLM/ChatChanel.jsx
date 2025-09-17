import React from "react";

const ChatChanel = ({ greetingMessage, setGreetingMessage }) => {
    console.log(greetingMessage)
    const handleGreetingMessageChange = (e) => {
        setGreetingMessage(e.target.value);
    };

    const resetToDefault = () => {
        const defaultGreeting =
            "Xin chào! Em là nhân viên tư vấn của Hệ thống đào tạo tiếng Trung Thanh Mai HSK. Em rất vui được hỗ trợ anh/chị!";
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
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-lg">📊</span>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Thống kê</h3>
                    </div>

                    <div className="bg-white rounded-xl p-4 border text-center">
                        <p className="text-sm text-gray-600 mb-1">Độ dài tin nhắn:</p>
                        <p className="font-bold text-blue-600 text-2xl">
                            {greetingMessage.length} ký tự
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatChanel;
