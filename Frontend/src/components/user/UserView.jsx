import { useState } from "react";

export const UserView = ({ user, onClose }) => {

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return dateString;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="max-w-lg w-full mx-auto p-6 bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">User Information</h2>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 text-xl"
                        >
                            ×
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">ID:</span>
                        <span className="text-gray-900">#{user.id}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Full Name:</span>
                        <span className="text-gray-900">{user.full_name}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Username:</span>
                        <span className="text-gray-900">{user.username}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Email:</span>
                        <span className="text-gray-900">{user.email}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Role:</span>
                        <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {user.role}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Company ID:</span>
                        <span className="text-gray-900">#{user.company_id}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-sm ${user.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                            }`}>
                            {user.is_active ? "Active" : "Inactive"}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Created:</span>
                        <span className="text-gray-900 text-sm">{formatDate(user.created_at)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-700">Last Login:</span>
                        <span className="text-gray-900 text-sm">{formatDate(user.last_login)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};