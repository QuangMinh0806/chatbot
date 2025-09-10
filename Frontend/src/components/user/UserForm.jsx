import { useState, useEffect } from "react";

const UserForm = ({ initialData, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        role: "",
        password: "",
        is_active: true,
    });
    const [error, setError] = useState("");

    useEffect(() => {
        if (initialData) {
            setFormData({
                full_name: initialData.full_name,
                username: initialData.username,
                email: initialData.email,
                role: initialData.role,
                password: "",
                is_active: initialData.is_active,
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

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.full_name || !formData.username || !formData.email || !formData.role) {
            setError("All fields are required");
            return;
        }
        // Nếu thêm mới, password bắt buộc, nếu edit thì password có thể để trống
        if (!initialData && !formData.password) {
            setError("Password is required for new user");
            return;
        }
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-96">
                <h2 className="text-2xl font-bold mb-4">
                    {initialData ? "Edit User" : "Create New User"}
                </h2>
                <form onSubmit={handleSubmit}>
                    {["full_name", "username", "email", "role"].map((field) => (
                        <div className="mb-4" key={field}>
                            <label className="block text-gray-700 text-sm font-bold mb-2 capitalize">
                                {field.replace("_", " ")}
                            </label>
                            <input
                                type={field === "email" ? "email" : "text"}
                                name={field}
                                value={formData[field]}
                                onChange={handleChange}
                                className="border rounded w-full py-2 px-3"
                            />
                        </div>
                    ))}

                    {/* Password */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder={initialData ? "Leave blank to keep current password" : ""}
                            className="border rounded w-full py-2 px-3"
                        />
                    </div>

                    <div className="mb-4 flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="mr-2"
                        />
                        <span>Active</span>
                    </div>

                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

                    <div className="flex items-center justify-between">
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                            {initialData ? "Update" : "Submit"}
                        </button>
                        <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserForm;
