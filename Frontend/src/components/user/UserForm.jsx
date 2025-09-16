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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-indigo-800/20"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

                    <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <span className="text-3xl">👤</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2">
                                {initialData ? "✏️ Chỉnh sửa người dùng" : "➕ Tạo người dùng mới"}
                            </h2>
                            <p className="text-blue-100 text-lg">
                                {initialData ? "Cập nhật thông tin người dùng" : "Thêm thành viên mới vào hệ thống"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-2xl flex items-center gap-3">
                            <span className="text-xl">⚠️</span>
                            <span className="font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-800 font-bold">
                                    <span className="text-lg">👤</span>
                                    Họ và tên *
                                </label>
                                <input
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-gray-50 hover:bg-white"
                                    placeholder="Nhập họ và tên..."
                                    required
                                />
                            </div>

                            {/* Username */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-800 font-bold">
                                    <span className="text-lg">🔖</span>
                                    Tên đăng nhập *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-gray-50 hover:bg-white font-mono"
                                    placeholder="Nhập tên đăng nhập..."
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-800 font-bold">
                                    <span className="text-lg">📧</span>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-gray-50 hover:bg-white"
                                    placeholder="example@domain.com"
                                    required
                                />
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gray-800 font-bold">
                                    <span className="text-lg">👑</span>
                                    Vai trò *
                                </label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-gray-50 hover:bg-white"
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
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-gray-800 font-bold">
                                <span className="text-lg">🔒</span>
                                Mật khẩu {initialData ? "" : "*"}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all bg-gray-50 hover:bg-white font-mono"
                                placeholder={initialData ? "Để trống để giữ mật khẩu hiện tại" : "Nhập mật khẩu..."}
                            />
                            {initialData && (
                                <p className="text-sm text-gray-500 italic">
                                    💡 Để trống nếu không muốn thay đổi mật khẩu
                                </p>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                        <span className="text-white text-xl">✅</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">Trạng thái hoạt động</h3>
                                        <p className="text-gray-600">Cho phép người dùng đăng nhập và sử dụng hệ thống</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-8 pt-0 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-4 justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="w-full sm:w-auto px-8 py-4 text-gray-700 bg-white border-2 border-gray-300 rounded-2xl hover:bg-gray-50 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            ❌ Hủy
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Đang xử lý...</span>
                                </div>
                            ) : (
                                <>
                                    {initialData ? "💾 Cập nhật" : "✨ Tạo mới"}
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