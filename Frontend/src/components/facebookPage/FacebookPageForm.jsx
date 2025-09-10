import { useState, useEffect } from "react";

const FacebookPageForm = ({ onSubmit, onCancel, initialData }) => {
    const [form, setForm] = useState({
        page_id: "",
        page_name: "",
        access_token: "",
        webhook_verify_token: "",
        description: "",
        category: "",
        avatar_url: "",
        cover_url: "",
        is_active: true,
        auto_response_enabled: true,
    });

    useEffect(() => {
        if (initialData) setForm(initialData);
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white rounded-lg p-6 w-96">
                <h2 className="text-lg font-bold mb-4">
                    {initialData ? "Cập nhật Fanpage" : "Thêm Fanpage"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-3">
                    {["page_id", "page_name", "access_token", "category"].map((f) => (
                        <div key={f}>
                            <label className="block text-sm font-medium mb-1">
                                {f.replace("_", " ")}
                            </label>
                            <input
                                type="text"
                                name={f}
                                value={form[f]}
                                onChange={handleChange}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    ))}

                    <div className="flex items-center space-x-4">
                        <label>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={handleChange}
                            />{" "}
                            Active
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                name="auto_response_enabled"
                                checked={form.auto_response_enabled}
                                onChange={handleChange}
                            />{" "}
                            Auto Reply
                        </label>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-gray-400 text-white px-3 py-2 rounded">
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-500 text-white px-3 py-2 rounded">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FacebookPageForm;
