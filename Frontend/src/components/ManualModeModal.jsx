import React, { useState } from 'react';

const ManualModeModal = ({ onClose, onConfirm }) => {
    const [selectedOption, setSelectedOption] = useState('1-hour');

    const timeOptions = [
        {
            id: '1-hour',
            title: '1 giờ',
            description: 'Kích hoạt bot sau 1 giờ (đếm ngược)',
            value: '1-hour',
        },
        {
            id: '4-hour',
            title: '4 giờ',
            description: 'Kích hoạt bot sau 4 giờ (đếm ngược)',
            value: '4-hour',
        },
        {
            id: '8am-tomorrow',
            title: 'Đến 8 giờ sáng hôm sau',
            description: 'Kích hoạt bot vào 8:00 AM ngày mai (đếm ngược)',
            value: '8am-tomorrow',
        },
        {
            id: 'manual-only',
            title: 'Thủ công hoàn toàn',
            description: 'Tắt bot vĩnh viễn, chỉ bật lại khi thủ công',
            value: 'manual-only',
        },
    ];

    const handleOptionChange = (optionValue) => {
        setSelectedOption(optionValue);
    };

    const handleConfirm = () => {
        onConfirm(selectedOption);
        onClose();
    };

    return (
        <div className=" rounded-lg bg-white shadow-md w-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">🤝</span>
                    Chuyển sang chế độ thủ công
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Chọn thời gian tắt chatbot cho phiên này:
                </p>
            </div>

            {/* Options */}
            <div className="p-4">
                <div className="space-y-3">
                    {timeOptions.map((option) => (
                        <div
                            key={option.id}
                            className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${selectedOption === option.value
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleOptionChange(option.value)}
                        >
                            <div className="flex items-start">
                                <input
                                    type="radio"
                                    name="timeOption"
                                    value={option.value}
                                    checked={selectedOption === option.value}
                                    onChange={() => handleOptionChange(option.value)}
                                    className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                    <h3 className="font-medium text-gray-900 mb-1">
                                        {option.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">{option.description}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end space-x-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    Hủy
                </button>
                <button
                    onClick={handleConfirm}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Xác nhận
                </button>
            </div>
        </div>
    );
};

export default ManualModeModal;
