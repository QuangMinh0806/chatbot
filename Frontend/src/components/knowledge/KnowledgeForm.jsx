import React from "react";

const KnowledgeForm = ({ formData, handleChange, handleSubmit, loading, isEdit }) => {
    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded bg-white">
            <h2 className="text-xl font-bold mb-4">{isEdit ? "Chỉnh sửa" : "Thêm kiến thức"}</h2>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Tiêu đề</label>
                <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Danh mục</label>
                <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Nguồn</label>
                <input
                    type="text"
                    name="source"
                    value={formData.source}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Nội dung</label>
                <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    rows="5"
                ></textarea>
            </div>
            <div className="mb-4 flex items-center">
                <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="mr-2"
                />
                <label>Hoạt động</label>
            </div>
            <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                disabled={loading}
            >
                {loading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Thêm"}
            </button>
        </form>
    );
};

export default KnowledgeForm;
