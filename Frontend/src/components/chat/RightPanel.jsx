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

    return (
        <div className="w-full lg:w-80 bg-white border-l border-gray-200 overflow-y-auto h-full max-w-sm lg:max-w-none">
            <div className="p-2 lg:p-4 space-y-2 lg:space-y-4">
                {/* Header */}
                <div className="border-b border-gray-100 lg:pb-4">
                    <div className="flex items-center gap-2 lg:gap-3 mb-2">
                        <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-white text-base lg:text-lg">📘</span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base lg:text-lg">Thông tin chi tiết</h3>
                    </div>
                </div>

                {/* Nguồn tin nhắn */}
                <div className="space-y-1 lg:space-y-2">
                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                        <span className="text-base lg:text-lg">🔗</span>
                        <h4 className="font-semibold text-gray-800 text-sm lg:text-base">Nguồn tin nhắn</h4>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 lg:p-4 border border-gray-200">
                        <div className="space-y-2 lg:space-y-3">
                            <div>
                                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1">URL nguồn liên hệ:</p>
                                <p className="text-xs text-gray-500 bg-white px-2 lg:px-3 py-1 lg:py-2 rounded-lg border break-all font-mono">
                                    https://example.com/contact
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-gray-600">Nền tảng:</p>
                                <p className="inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 lg:py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-lg text-xs lg:text-sm font-semibold border border-blue-300">
                                    <span className="text-sm lg:text-base">{selectedConversation.channel || "N/A"}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Thông tin nhân viên */}
                <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                        <span className="text-base lg:text-lg">👤</span>
                        <h4 className="font-semibold text-gray-800 text-sm lg:text-base">Thông tin nhân viên</h4>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 lg:p-4 border border-gray-200">
                        <div className="space-y-3 lg:space-y-4">
                            <div>
                                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">
                                    Tiếp nhận hiện tại:
                                </p>
                                <p className="font-semibold text-gray-900 bg-white px-2 lg:px-3 py-1 lg:py-2 rounded-lg border text-xs lg:text-sm">
                                    {selectedConversation?.current_receiver || "Bot"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs lg:text-sm font-medium text-gray-600 mb-2">
                                    Tiếp nhận trước đó:
                                </p>
                                <p className="text-xs lg:text-sm text-gray-500 bg-white px-2 lg:px-3 py-1 lg:py-2 rounded-lg border italic">
                                    {selectedConversation?.previous_receiver || "Không có"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-xs lg:text-sm font-medium text-gray-600">Trạng thái:</p>
                                <span
                                    className={`inline-flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold ${selectedConversation.sender_type === "bot"
                                        ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-300"
                                        : "bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800 border border-orange-300"
                                        }`}
                                >
                                    <div
                                        className={`w-2 h-2 rounded-full ${selectedConversation.status === "true"
                                            ? "bg-green-500"
                                            : "bg-orange-500"
                                            }`}
                                    ></div>
                                    {selectedConversation.status === "true" ? "Tự động" : "Thủ công"}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Thông tin khách hàng */}
                <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center gap-2 mb-2 lg:mb-3">
                        <span className="text-base lg:text-lg">📋</span>
                        <h4 className="font-semibold text-gray-800 text-sm lg:text-base">Thông tin khách hàng</h4>
                    </div>

                    <div className="space-y-3 lg:space-y-4">
                        {selectedConversation.customer_data && Object.keys(selectedConversation.customer_data).length > 0 ? (
                            Object.entries(selectedConversation.customer_data).map(([key, value]) => (
                                <div key={key}>
                                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                                        {key}:
                                    </label>
                                    <div className={`px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-semibold border shadow-sm text-xs lg:text-sm ${key.includes("Họ tên") ? "bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300" :
                                        key.includes("Số điện thoại") ? "bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300" :
                                            key.includes("email") ? "bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300" :
                                                "bg-gray-100 text-gray-800 border-gray-300"
                                        }`}>
                                        {value ? value : "Chưa cung cấp"}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-3 lg:px-4 py-2 lg:py-3 rounded-xl font-semibold border border-gray-300 text-gray-500 text-xs lg:text-sm shadow-sm">
                                Chưa có thông tin
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}