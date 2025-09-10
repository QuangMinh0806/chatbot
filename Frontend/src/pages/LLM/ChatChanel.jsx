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
            // Chỉ cập nhật state, không gọi API
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
            // Chỉ cập nhật state, không gọi API
            setConfigData(prev => ({
                ...prev,
                status: true
            }));
        }
    };

    const handleTimeConfirm = (mode) => {
        setSelectedMode(mode);
        // Cập nhật configData với time dự kiến nhưng chưa gửi API
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
        <div className="bg-white p-6 rounded-lg shadow-sm">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                    <span className="mr-2">🤝</span>
                    Can thiệp thủ công
                </h2>
                <p className="text-gray-600 text-sm">
                    Cấu hình chuyển giao cuộc trò chuyện cho nhân viên
                </p>
            </div>

            {/* 3 Cột song song */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Cột 1: Can thiệp thủ công */}
                <div className={`border rounded-lg p-4 transition-all ${isAutoReactivate ? "opacity-50 pointer-events-none" : "opacity-100"
                    }`}>
                    <div className="flex items-center mb-3">
                        <span className="text-blue-500 mr-2">⚙️</span>
                        <h3 className="font-medium text-gray-800">Can thiệp thủ công</h3>
                    </div>

                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            id="manual-intervention"
                            checked={isManualEnabled}
                            onChange={handleManualChange}
                            disabled={isAutoReactivate || isLoading}
                            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                            htmlFor="manual-intervention"
                            className="text-sm text-gray-700"
                        >
                            Cho phép can thiệp thủ công
                        </label>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                        Khi bật, nhân viên có thể chuyển bot sang chế độ thủ công
                    </p>
                </div>

                {/* Cột 2: Manual Mode */}
                <div
                    className={`border rounded-lg p-4 transition-all ${isManualEnabled ? "opacity-100" : "opacity-50 pointer-events-none"
                        }`}
                >
                    <ManualModeModal
                        onClose={() => setIsManualEnabled(false)}
                        onConfirm={handleTimeConfirm}
                    />

                </div>

                {/* Cột 3: Auto Reactivate Bot */}
                <div className={`border rounded-lg p-4 transition-all ${isManualEnabled ? "opacity-50 pointer-events-none" : "opacity-100"
                    }`}>
                    <div className="flex items-center mb-3">
                        <span className="text-blue-500 mr-2">🔄</span>
                        <h3 className="font-medium text-gray-800">Tái kích hoạt Bot</h3>
                    </div>
                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            id="auto-reactivate"
                            checked={isAutoReactivate}
                            onChange={handleAutoReactivateChange}
                            disabled={isManualEnabled || isLoading}
                            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                            htmlFor="auto-reactivate"
                            className="text-sm text-gray-700"
                        >
                            Tự động tái kích hoạt bot
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Bot sẽ tự động hoạt động trở lại
                    </p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <button
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                >
                    🔄 Reset mặc định
                </button>
                <button
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
                    onClick={handleSaveConfig}
                    disabled={isLoading || !configData}
                >
                    {isLoading ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            💾 Lưu cấu hình
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ChatChanel;