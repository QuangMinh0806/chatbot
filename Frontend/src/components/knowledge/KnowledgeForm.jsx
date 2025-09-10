import React from "react";
import { Plus, X, Save, BookOpen, Tag, Globe, FileText } from "lucide-react";

const KnowledgeForm = ({ formData, handleChange, handleSubmit, handleCancel, loading, isEdit }) => {
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        handleChange({ target: { name, value: checked } });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSubmit(e);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Plus className="w-6 h-6" />
                        <h2 className="text-xl font-bold">{isEdit ? "Chỉnh sửa kiến thức" : "Thêm kiến thức mới"}</h2>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                            <BookOpen className="w-4 h-4" />
                            Tiêu đề *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Nhập tiêu đề kiến thức"
                            required
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                            <Tag className="w-4 h-4" />
                            Danh mục
                        </label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="Nhập danh mục"
                        />
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <Globe className="w-4 h-4" />
                        Nguồn tham khảo
                    </label>
                    <input
                        type="text"
                        name="source"
                        value={formData.source}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Nhập nguồn tham khảo"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                        <FileText className="w-4 h-4" />
                        Nội dung
                    </label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        rows={6}
                        placeholder="Nhập nội dung kiến thức..."
                    />
                </div>

                <div className="flex items-center">
                    <input
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        checked={formData.is_active || false}
                        onChange={handleCheckboxChange}
                        className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="ml-3 text-gray-700 font-medium">
                        Kích hoạt kiến thức này
                    </label>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                        onClick={handleFormSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                {isEdit ? "Cập nhật" : "Thêm mới"}
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-all"
                    >
                        <X className="w-4 h-4" />
                        Hủy bỏ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeForm;