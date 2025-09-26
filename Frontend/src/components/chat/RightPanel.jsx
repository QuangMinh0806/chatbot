import { useAuth } from "../context/AuthContext"
import React, { useState, useEffect, useRef } from "react";

export const RightPanel = ({ selectedConversation }) => {

    console.log("RightPanel", selectedConversation)
    console.log("-------------------------")
    useEffect(() => {
        console.log("📡 RightPanel - selectedConversation changed:", selectedConversation);
        if (selectedConversation?.customer_data) {
            console.log("✅ Customer data found:", selectedConversation.customer_data);
        } else {
            console.log("❌ No customer data");
        }
    }, [selectedConversation.customer_data]);

    const displayName = selectedConversation.sender_name != null
        ? selectedConversation.sender_name
        : selectedConversation.sender_type === "bot"
            ? "Bot"
            : "Nhân viên";
    let customerData = {};
    try {
        if (selectedConversation?.customer_data) {
            customerData = JSON.parse(selectedConversation.customer_data);
        }
    } catch (e) {
        console.error("❌ Lỗi parse customer_data:", e);
        customerData = {};
    }
    return (
        <div className="w-full lg:w-80 bg-white border-l border-gray-200 overflow-y-auto h-full max-w-sm lg:max-w-none">
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white">�</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">Thông tin chi tiết</h3>
                    </div>
                </div>

                {/* Nguồn tin nhắn */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span>🔗</span>
                        <h4 className="font-medium text-gray-800">Nguồn tin nhắn</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">URL nguồn liên hệ:</p>
                                <p className="text-xs text-gray-500 bg-white px-2 lg:px-3 py-1 lg:py-2 rounded-lg border break-all font-mono">
                                    {selectedConversation?.url_channel}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-600">Nền tảng:</p>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                                    {selectedConversation.channel || "N/A"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thông tin nhân viên */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span>👤</span>
                        <h4 className="font-medium text-gray-800">Thông tin nhân viên</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Tiếp nhận hiện tại:
                                </p>
                                <p className="font-medium text-gray-900 bg-white px-3 py-2 rounded border text-sm">
                                    {selectedConversation?.current_receiver || "Bot"}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                    Tiếp nhận trước đó:
                                </p>
                                <p className="text-sm text-gray-500 bg-white px-3 py-2 rounded border italic">
                                    {selectedConversation?.previous_receiver || "Không có"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-600">Trạng thái:</p>
                                <span
                                    className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm font-medium ${selectedConversation.status === "true"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                        }`}
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full ${selectedConversation.status === "true"
                                            ? "bg-green-500"
                                            : "bg-yellow-500"
                                            }`}
                                    ></div>
                                    {selectedConversation.status === "true" ? "Tự động" : "Thủ công"}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Thông tin khách hàng */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <span>�</span>
                        <h4 className="font-medium text-gray-800">Thông tin khách hàng</h4>
                    </div>

                    <div className="space-y-3">
                        {selectedConversation.customer_data && Object.keys(selectedConversation.customer_data).length > 0 ? (
                            Object.entries(selectedConversation.customer_data).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        {key}:
                                    </label>
                                    <div className={`px-3 py-2 rounded border text-sm ${key.includes("Họ tên") ? "bg-purple-50 text-purple-800 border-purple-200" :
                                        key.includes("Số điện thoại") ? "bg-green-50 text-green-800 border-green-200" :
                                            key.includes("email") ? "bg-blue-50 text-blue-800 border-blue-200" :
                                                "bg-gray-50 text-gray-800 border-gray-200"
                                        }`}>
                                        {value ? value : "Chưa cung cấp"}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-3 rounded border border-gray-200 text-gray-500 text-sm bg-gray-50">
                                Chưa có thông tin
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}