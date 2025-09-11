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
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-700/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                            <BookOpen className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold mb-2">
                                {isEdit ? "✏️ Chỉnh sửa kiến thức" : "➕ Thêm kiến thức mới"}
                            </h2>
                            <p className="text-green-100 text-lg">
                                {isEdit ? "Cập nhật thông tin kiến thức" : "Tạo kiến thức mới cho hệ thống"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="p-3 hover:bg-white/10 rounded-2xl transition-colors backdrop-blur-sm"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="p-8 space-y-8">
                <form onSubmit={handleFormSubmit} className="space-y-8">
                    {/* Basic Information Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Title */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-gray-800 font-bold text-lg">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                </div>
                                Tiêu đề *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg placeholder-gray-400 bg-gray-50 hover:bg-white"
                                placeholder="Nhập tiêu đề kiến thức..."
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 text-gray-800 font-bold text-lg">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Tag className="w-5 h-5 text-purple-600" />
                                </div>
                                Danh mục
                            </label>
                            <input
                                type="text"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-lg placeholder-gray-400 bg-gray-50 hover:bg-white"
                                placeholder="Nhập danh mục..."
                            />
                        </div>
                    </div>

                    {/* Source */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-gray-800 font-bold text-lg">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Globe className="w-5 h-5 text-green-600" />
                            </div>
                            Nguồn tham khảo
                        </label>
                        <input
                            type="text"
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all text-lg placeholder-gray-400 bg-gray-50 hover:bg-white"
                            placeholder="Nhập nguồn tham khảo..."
                        />
                    </div>

                    {/* Content */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 text-gray-800 font-bold text-lg">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-orange-600" />
                            </div>
                            Nội dung
                        </label>
                        <div className="relative">
                            <textarea
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none text-lg placeholder-gray-400 bg-gray-50 hover:bg-white"
                                rows={8}
                                placeholder="Nhập nội dung kiến thức chi tiết..."
                            />
                            <div className="absolute bottom-4 right-4 text-gray-400">
                                <FileText className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-sm text-gray-500 text-right">
                            {formData.content?.length || 0} ký tự
                        </div>
                    </div>

                    {/* Active Toggle */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                    <span className="text-white text-xl">⚙️</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Kích hoạt kiến thức</h3>
                                    <p className="text-gray-600">Cho phép kiến thức này được sử dụng trong hệ thống</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    id="is_active"
                                    checked={formData.is_active || false}
                                    onChange={handleCheckboxChange}
                                    className="sr-only peer"
                                />
                                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </form>
            </div>

            {/* Footer Actions */}
            <div className="p-8 pt-0">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                        onClick={handleCancel}
                        className="flex items-center justify-center gap-3 bg-gray-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                    >
                        <X className="w-5 h-5" />
                        Hủy bỏ
                    </button>

                    <button
                        onClick={handleFormSubmit}
                        disabled={loading}
                        className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-10 py-4 rounded-2xl font-bold hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {isEdit ? "💾 Cập nhật" : "✨ Thêm mới"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeForm;