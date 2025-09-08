import { useState } from "react";

const UserForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        full_name: "",
        username: "",
        email: "",
        role: "",
        is_active: true,
    });
    const [error, setError] = useState("");

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
        onSubmit({ ...formData, id: Date.now(), last_login: new Date().toISOString() });
        setFormData({ full_name: "", username: "", email: "", role: "", is_active: true });
        setError("");
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl w-96">
                <h2 className="text-2xl font-bold mb-4">Create New User</h2>
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
                            Submit
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
