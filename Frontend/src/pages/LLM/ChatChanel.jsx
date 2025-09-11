import React, { useState, useEffect } from "react";
import ManualModeModal from "../../components/ManualModeModal";
import { update_config, get_config } from "../../services/config";

const ChatChanel = () => {
    const [isManualEnabled, setIsManualEnabled] = useState(false);
    const [isAutoReactivate, setIsAutoReactivate] = useState(false);
    const [selectedMode, setSelectedMode] = useState(null);
    const [selectedTime, setSelectedTime] = useState(30);
    const [isLoading, setIsLoading] = useState(false);
    const [configData, setConfigData] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setIsLoading(true);
                const configId = 1;
                const data = await get_config(configId);
                setConfigData(data);

                if (data) {
                    setIsManualEnabled(!data.status);
                    setIsAutoReactivate(data.status);
                    if (data.time && !data.status) {
                        const minutes = Math.round((new Date(data.time) - new Date()) / 60000);
                        setSelectedTime(minutes > 0 ? minutes : 30);
                    }
                }
            } catch (error) {
                console.error("Error fetching config:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfig();
    }, []);

    const handleManualChange = (e) => {
        const checked = e.target.checked;
        setIsManualEnabled(checked);

        if (checked) {
            setIsAutoReactivate(false);
            setConfigData(prev => ({
                ...prev,
                status: false
            }));
        } else {
            setSelectedMode(null);
        }
    };

    const handleAutoReactivateChange = (e) => {
        const checked = e.target.checked;
        setIsAutoReactivate(checked);

        if (checked) {
            setIsManualEnabled(false);
            setSelectedMode(null);
            setConfigData(prev => ({
                ...prev,
                status: true
            }));
        }
    };

    const handleTimeConfirm = (mode) => {
        setSelectedMode(mode);
        const minutes = mode === 'manual-only' ? 0 :
            mode === '1-hour' ? 60 :
                mode === '4-hour' ? 240 :
                    mode === '8am-tomorrow' ? Math.max(0, Math.ceil((new Date(new Date().setHours(8, 0, 0, 0) + 24 * 60 * 60 * 1000) - new Date()) / 60000)) : 30;

        setSelectedTime(minutes);

        setConfigData(prev => ({
            ...prev,
            status: false,
            time: new Date(new Date().getTime() + minutes * 60000).toISOString()
        }));
    };

    const handleSaveConfig = async () => {
        if (!configData) return;

        try {
            setIsLoading(true);
            const configId = 1;
            await update_config(configId, configData);
            console.log("Config updated successfully:", configData);
        } catch (error) {
            console.error("Error updating config:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-orange-700/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

                <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">🤝</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Can thiệp thủ công</h2>
                        <p className="text-orange-100 text-lg">
                            Cấu hình chuyển giao cuộc trò chuyện cho nhân viên
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
                {/* 3 Columns Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Manual Intervention */}
                    <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200 transition-all duration-300 ${isAutoReactivate ? "opacity-50 pointer-events-none" : "opacity-100 hover:shadow-lg"
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">⚙️</span>
                            </div>
                            <h3 className="font-bold text-blue-900 text-lg">Can thiệp thủ công</h3>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="manual-intervention"
                                    checked={isManualEnabled}
                                    onChange={handleManualChange}
                                    disabled={isAutoReactivate || isLoading}
                                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="manual-intervention"
                                    className="text-blue-800 font-semibold"
                                >
                                    Cho phép can thiệp thủ công
                                </label>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-blue-300">
                            <p className="text-sm text-blue-700 leading-relaxed">
                                Khi bật, nhân viên có thể chuyển bot sang chế độ thủ công để xử lý trực tiếp
                            </p>
                        </div>
                    </div>

                    {/* Column 2: Manual Mode Modal */}
                    <div className={`bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-200 transition-all duration-300 ${isManualEnabled ? "opacity-100" : "opacity-50 pointer-events-none"
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">⏱️</span>
                            </div>
                            <h3 className="font-bold text-yellow-900 text-lg">Thời gian thủ công</h3>
                        </div>

                        {isManualEnabled && (
                            <div className="space-y-4">
                                <ManualModeModal
                                    onClose={() => setIsManualEnabled(false)}
                                    onConfirm={handleTimeConfirm}
                                />

                                {selectedMode && (
                                    <div className="bg-white rounded-xl p-4 border border-yellow-300">
                                        <p className="text-sm text-yellow-700">
                                            <span className="font-semibold">Đã chọn:</span> {
                                                selectedMode === '1-hour' ? '1 giờ' :
                                                    selectedMode === '4-hour' ? '4 giờ' :
                                                        selectedMode === '8am-tomorrow' ? '8AM ngày mai' :
                                                            'Thủ công hoàn toàn'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Column 3: Auto Reactivate */}
                    <div className={`bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 transition-all duration-300 ${isManualEnabled ? "opacity-50 pointer-events-none" : "opacity-100 hover:shadow-lg"
                        }`}>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white text-xl">🔄</span>
                            </div>
                            <h3 className="font-bold text-green-900 text-lg">Tái kích hoạt Bot</h3>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="auto-reactivate"
                                    checked={isAutoReactivate}
                                    onChange={handleAutoReactivateChange}
                                    disabled={isManualEnabled || isLoading}
                                    className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                                />
                                <label
                                    htmlFor="auto-reactivate"
                                    className="text-green-800 font-semibold"
                                >
                                    Tự động tái kích hoạt bot
                                </label>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-green-300">
                            <p className="text-sm text-green-700 leading-relaxed">
                                Bot sẽ tự động hoạt động trở lại và xử lý tin nhắn mà không cần can thiệp
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Display */}
                {configData && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg">📊</span>
                            </div>
                            <h3 className="font-bold text-gray-800 text-lg">Trạng thái hiện tại</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl p-4 border">
                                <p className="text-sm text-gray-600 mb-1">Chế độ hoạt động:</p>
                                <p className={`font-bold ${configData.status ? 'text-green-600' : 'text-orange-600'}`}>
                                    {configData.status ? '🤖 Bot tự động' : '👨‍💼 Thủ công'}
                                </p>
                            </div>

                            {configData.time && !configData.status && (
                                <div className="bg-white rounded-xl p-4 border">
                                    <p className="text-sm text-gray-600 mb-1">Thời gian kích hoạt lại:</p>
                                    <p className="font-bold text-blue-600">
                                        {new Date(configData.time).toLocaleString('vi-VN')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-8 pt-0 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                        className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                        disabled={isLoading}
                    >
                        🔄 Reset mặc định
                    </button>
                    <button
                        className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                        onClick={handleSaveConfig}
                        disabled={isLoading || !configData}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang lưu...</span>
                            </div>
                        ) : (
                            <>
                                💾 Lưu cấu hình
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatChanel;