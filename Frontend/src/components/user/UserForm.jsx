import { useState, useEffect } from "react";

const UserForm = ({ initialData, onSubmit, onCancel }) => {
    console.log(initialData)
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        role: "",
        password: "",
        is_active: true,
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name,
                username: initialData.username,
                email: initialData.email,
                role: initialData.role,
                password: "",
                is_active: initialData.is_active || true,
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.full_name || !formData.username || !formData.email || !formData.role) {
            setError("Tất cả các trường bắt buộc phải được điền");
            return;
        }
        // Nếu thêm mới, password bắt buộc, nếu edit thì password có thể để trống
        if (!initialData && !formData.password) {
            setError("Mật khẩu là bắt buộc cho người dùng mới");
            return;
        }

        setIsLoading(true);
        try {
            console.log(formData)
            await onSubmit(formData);
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra");
        } finally {
            setIsLoading(false);
        }
    };

    const roleOptions = [
        { value: "admin", label: "👑 Quản trị viên", color: "text-red-600" },
        { value: "manager", label: "👨‍💼 Quản lý", color: "text-blue-600" },
        { value: "agent", label: "👤 Nhân viên", color: "text-green-600" },
        { value: "viewer", label: "👁️ Chỉ xem", color: "text-gray-600" }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <span className="text-xl">👤</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold mb-1">
                                {initialData ? "Chỉnh sửa người dùng" : "Tạo người dùng mới"}
                            </h2>
                            <p className="text-blue-100 text-sm">
                                {initialData ? "Cập nhật thông tin người dùng" : "Thêm thành viên mới vào hệ thống"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
                            <span>⚠️</span>
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Basic Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="block text-gray-700 font-medium text-sm">
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nhập họ và tên..."
                                    required
                                />
                            </div>

                            {/* Username */}
                            <div className="space-y-1">
                                <label className="block text-gray-700 font-medium text-sm">
                                    Tên đăng nhập *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                    placeholder="Nhập tên đăng nhập..."
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-gray-700 font-medium text-sm">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="example@domain.com"
                                    required
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-1">
                                <label className="block text-gray-700 font-medium text-sm">
                                    Vai trò *
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Chọn vai trò...</option>
                                    {roleOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <label className="block text-gray-700 font-medium text-sm">
                                Mật khẩu {initialData ? "" : "*"}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder={initialData ? "Để trống để giữ mật khẩu hiện tại" : "Nhập mật khẩu..."}
                            />
                            {initialData && (
                                <p className="text-sm text-gray-500">
                                    Để trống nếu không muốn thay đổi mật khẩu
                                </p>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-gray-800">Trạng thái hoạt động</h3>
                                    <p className="text-gray-600 text-sm">Cho phép người dùng đăng nhập và sử dụng hệ thống</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </div>
                            ) : (
                                <>
                                    {initialData ? "Cập nhật" : "Tạo mới"}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserForm;