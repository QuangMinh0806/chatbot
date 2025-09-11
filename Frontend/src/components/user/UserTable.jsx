import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

const UserTable = ({ data, onEdit, onDelete, onView }) => {
    const getRoleInfo = (role) => {
        switch (role) {
            case 'admin':
                return { icon: '👑', label: 'Quản trị viên', color: 'bg-red-100 text-red-700 border-red-200' };
            case 'manager':
                return { icon: '👨‍💼', label: 'Quản lý', color: 'bg-blue-100 text-blue-700 border-blue-200' };
            case 'agent':
                return { icon: '👤', label: 'Nhân viên', color: 'bg-green-100 text-green-700 border-green-200' };
            case 'viewer':
                return { icon: '👁️', label: 'Chỉ xem', color: 'bg-gray-100 text-gray-700 border-gray-200' };
            default:
                return { icon: '❓', label: role, color: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Danh sách người dùng</h2>
                        <p className="text-indigo-100 mt-1">Quản lý thành viên trong hệ thống</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                👤 Người dùng
                            </th>
                            <th className="py-4 px-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                                📧 Liên hệ
                            </th>
                            <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                👑 Vai trò
                            </th>
                            <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                🔄 Trạng thái
                            </th>
                            <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                🕐 Đăng nhập cuối
                            </th>
                            <th className="py-4 px-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                                ⚙️ Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((user, index) => {
                            const roleInfo = getRoleInfo(user.role);

                            return (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                                    {/* User Info */}
                                    <td className="py-6 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                                                    <span className="text-white font-bold text-lg">
                                                        {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                                                    </span>
                                                </div>
                                                {user.is_active && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-gray-900 text-lg mb-1">
                                                    {user.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded-lg inline-block">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="py-6 px-6">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">📧</span>
                                                <span className="text-sm font-medium text-gray-700 break-all">
                                                    {user.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Role */}
                                    <td className="py-6 px-6 text-center">
                                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 ${roleInfo.color}`}>
                                            <span className="text-base">{roleInfo.icon}</span>
                                            {roleInfo.label}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="py-6 px-6 text-center">
                                        <div className="flex items-center justify-center">
                                            {user.is_active ? (
                                                <span className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 py-2 px-4 rounded-xl text-sm font-bold border border-green-200 shadow-sm">
                                                    ✅ Hoạt động
                                                </span>
                                            ) : (
                                                <span className="bg-gradient-to-r from-red-100 to-red-100 text-red-700 py-2 px-4 rounded-xl text-sm font-bold border border-red-200 shadow-sm">
                                                    ❌ Không hoạt động
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Last Login */}
                                    <td className="py-6 px-6 text-center">
                                        <div className="bg-gray-50 rounded-xl p-3 border">
                                            {user.last_login ? (
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        {new Date(user.last_login).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {new Date(user.last_login).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500 italic">
                                                    Chưa đăng nhập
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-6 px-6">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => onView(user)}
                                                className="group p-3 bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                                                title="Xem chi tiết"
                                            >
                                                <FaEye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit(user)}
                                                className="group p-3 bg-green-100 hover:bg-green-500 text-green-600 hover:text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                                                title="Chỉnh sửa"
                                            >
                                                <FaEdit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(user.id)}
                                                className="group p-3 bg-red-100 hover:bg-red-500 text-red-600 hover:text-white rounded-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-110"
                                                title="Xóa"
                                            >
                                                <FaTrash className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Empty State */}
                {data.length === 0 && (
                    <div className="text-center py-16 px-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">👥</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Chưa có người dùng nào</h3>
                        <p className="text-gray-500 mb-6">Thêm thành viên đầu tiên để bắt đầu quản lý hệ thống</p>
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl border border-blue-200">
                            <span>💡</span>
                            <span className="font-medium">Nhấn nút "Tạo người dùng mới" để bắt đầu</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserTable;