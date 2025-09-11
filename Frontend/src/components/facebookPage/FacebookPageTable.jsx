import { FaEdit, FaTrash } from "react-icons/fa";

const FacebookPageTable = ({ data, onEdit, onDelete }) => {
    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Danh sách Fanpages</h2>
                        <p className="text-blue-100 mt-1">Quản lý và cấu hình các fanpage Facebook</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                📘 Fanpage
                            </th>
                            <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                🔄 Trạng thái
                            </th>
                            <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                📅 Cập nhật
                            </th>
                            <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                ⚙️ Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((page, index) => (
                            <tr key={page.id} className="hover:bg-gray-50 transition-colors duration-200">
                                {/* Fanpage Info */}
                                <td className="py-6 px-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-white font-bold text-lg">
                                                {page.page_name?.charAt(0) || "F"}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-bold text-blue-600 text-lg mb-1 truncate">
                                                {page.page_name}
                                            </h3>
                                            <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg inline-block">
                                                ID: {page.page_id}
                                            </p>
                                            <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                {page.category}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Status */}
                                <td className="py-6 px-6">
                                    <div className="flex flex-col items-center gap-3">
                                        {/* Active Status */}
                                        <div className="flex items-center gap-2">
                                            {page.is_active ? (
                                                <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 py-2 px-4 rounded-xl text-sm font-bold border border-green-200 shadow-sm">
                                                    ✅ Hoạt động
                                                </span>
                                            ) : (
                                                <span className="bg-gradient-to-r from-red-100 to-red-100 text-red-700 py-2 px-4 rounded-xl text-sm font-bold border border-red-200 shadow-sm">
                                                    ❌ Tạm dừng
                                                </span>
                                            )}
                                        </div>

                                        {/* Auto Reply Status */}
                                        <div className="flex items-center gap-2">
                                            {page.auto_response_enabled ? (
                                                <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 py-2 px-4 rounded-xl text-sm font-bold border border-blue-200 shadow-sm">
                                                    🤖 Auto Reply
                                                </span>
                                            ) : (
                                                <span className="bg-gradient-to-r from-gray-100 to-gray-100 text-gray-700 py-2 px-4 rounded-xl text-sm font-bold border border-gray-200 shadow-sm">
                                                    ⏸️ Manual
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>

                                {/* Updated Time */}
                                <td className="py-6 px-6 text-center">
                                    <div className="bg-gray-50 rounded-xl p-3 border">
                                        <div className="text-sm font-semibold text-gray-700">
                                            {new Date(page.updated_at).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(page.updated_at).toLocaleTimeString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="py-6 px-6">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => onEdit(page)}
                                            className="group p-3 bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                                            title="Chỉnh sửa"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(page.id)}
                                            className="group p-3 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                                            title="Xóa"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Empty State */}
                {data.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📭</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có fanpage nào</h3>
                        <p className="text-gray-500 mb-6">Thêm fanpage đầu tiên để bắt đầu nhận tin nhắn</p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                            <span>💡</span>
                            <span className="font-medium">Nhấn nút "Thêm Fanpage" để bắt đầu</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacebookPageTable;