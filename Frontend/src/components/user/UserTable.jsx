import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

const UserTable = ({ data, onEdit, onView }) => {
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gray-100 p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-lg">👥</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Danh sách người dùng</h2>
                        <p className="text-gray-600 text-sm">Quản lý thành viên trong hệ thống</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                                Người dùng
                            </th>
                            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">
                                Liên hệ
                            </th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                                Vai trò
                            </th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                                Trạng thái
                            </th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                                Đăng nhập cuối
                            </th>
                            <th className="py-3 px-4 text-center text-sm font-medium text-gray-700">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((user, index) => {
                            const roleInfo = getRoleInfo(user.role);

                            return (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    {/* User Info */}
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                                    <span className="text-white font-medium text-sm">
                                                        {user.full_name?.charAt(0)?.toUpperCase() || "U"}
                                                    </span>
                                                </div>
                                                {user.is_active && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-white rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-medium text-gray-900 mb-1">
                                                    {user.full_name}
                                                </h3>
                                                <p className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block">
                                                    @{user.username}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="py-4 px-4">
                                        <span className="text-sm text-gray-700 break-all">
                                            {user.email}
                                        </span>
                                    </td>

                                    {/* Role */}
                                    <td className="py-4 px-4 text-center">
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium border ${roleInfo.color}`}>
                                            <span>{roleInfo.icon}</span>
                                            {roleInfo.label}
                                        </span>
                                    </td>

                                    {/* Status */}
                                    <td className="py-4 px-4 text-center">
                                        {user.is_active ? (
                                            <span className="bg-green-100 text-green-700 py-1 px-3 rounded-lg text-sm font-medium border border-green-200">
                                                Hoạt động
                                            </span>
                                        ) : (
                                            <span className="bg-red-100 text-red-700 py-1 px-3 rounded-lg text-sm font-medium border border-red-200">
                                                Không hoạt động
                                            </span>
                                        )}
                                    </td>

                                    {/* Last Login */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="text-sm text-gray-700">
                                            {user.last_login ? (
                                                <div>
                                                    <div>
                                                        {new Date(user.last_login).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(user.last_login).toLocaleTimeString('vi-VN', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-500">
                                                    Chưa đăng nhập
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-4 px-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => onView(user)}
                                                className="p-2 bg-blue-100 hover:bg-blue-500 text-blue-600 hover:text-white rounded-lg transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <FaEye className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEdit(user)}
                                                className="p-2 bg-green-100 hover:bg-green-500 text-green-600 hover:text-white rounded-lg transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <FaEdit className="w-4 h-4" />
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
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">👥</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có người dùng nào</h3>
                        <p className="text-gray-500 mb-4">Thêm thành viên đầu tiên để bắt đầu quản lý hệ thống</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-200">
                            <span>💡</span>
                            <span className="text-sm">Nhấn nút "Tạo người dùng mới" để bắt đầu</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserTable;