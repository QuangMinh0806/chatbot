import React, { useState } from "react";
import ManualModeModal from "../../components/ManualModeModal";

const ChatChanel = () => {
    const [isManualEnabled, setIsManualEnabled] = useState(false);
    const [isAutoReactivate, setIsAutoReactivate] = useState(false);
    const [selectedMode, setSelectedMode] = useState(null);

    const handleManualChange = (e) => {
        const checked = e.target.checked;
        setIsManualEnabled(checked);

        if (!checked) {
            setSelectedMode(null);
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
                <div className="border rounded-lg p-4 relative">
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
                        onConfirm={(mode) => {
                            setSelectedMode(mode);
                            console.log("Selected manual mode:", mode);
                        }}
                    />
                </div>

                {/* Cột 3: Auto Reactivate Bot */}
                <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-3">
                        <span className="text-blue-500 mr-2">🔄</span>
                        <h3 className="font-medium text-gray-800">Tái kích hoạt Bot</h3>
                    </div>
                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            id="auto-reactivate"
                            checked={isAutoReactivate}
                            onChange={(e) => setIsAutoReactivate(e.target.checked)}
                            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                            htmlFor="auto-reactivate"
                            className="text-sm text-gray-700"
                        >
                            Tự động tái kích hoạt bot
                        </label>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    🔄 Reset mặc định
                </button>
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                    💾 Lưu cấu hình
                </button>
            </div>
        </div>
    );
};

export default ChatChanel;
