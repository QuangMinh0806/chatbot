import React from 'react'

export const RightPanel = (selectedConversation) => {
    return (
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="flex-row g-7 p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-4">📘 Thông tin chi tiết</h3>
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">👤 Thông tin nhân viên</h4>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm">Tiếp nhận hiện tại:</p>
                        <p className="font-medium">Chatbot AI</p>
                        <p className="text-sm mt-2">Tiếp nhận trước đó:</p>
                        <p className="text-sm text-gray-500">Không có</p>
                        <p className="text-sm mt-2">Trạng thái:</p>
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                            Tự động
                        </span>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-2">📋 Thông tin khách hàng</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">HỌ TÊN:</label>
                            <div className="bg-purple-100 text-purple-800 px-3 py-2 rounded text-sm font-medium">
                                {selectedConversation.full_name || "Chưa cung cấp"}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">SỐ ĐIỆN THOẠI:</label>
                            <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-sm font-medium">
                                {selectedConversation.phone_number || "Chưa cung cấp"}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Các thông tin khác:</label>
                            <textarea
                                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm"
                                rows={3}
                                placeholder="Chưa có thông tin bổ sung"
                                value={selectedConversation.notes || ""}
                                readOnly
                            />
                            <p className="text-xs text-gray-500 text-right mt-1">Chưa có thông tin bổ sung</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
