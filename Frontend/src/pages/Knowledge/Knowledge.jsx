import React, { useState, useEffect } from "react";
import { getKnowledgeById, postKnowledge, updateKnowledge } from "../../services/knowledgeService";
import KnowledgeForm from "../../components/knowledge/KnowledgeForm";
import KnowledgeView from "../../components/knowledge/KnowledgeView";
import { Plus, Edit, BookOpen } from "lucide-react";
import Sidebar from "../../components/layout/Sildebar";
const KnowledgePage = () => {
    const [knowledge, setKnowledge] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        source: "",
        category: "",
        is_active: true
    });
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isEdit, setIsEdit] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Lấy dữ liệu khi mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setInitialLoading(true);
                const data = await getKnowledgeById(); // không truyền id
                setKnowledge(data);
            } catch (err) {
                console.error(err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, []);

    // Khi bấm nút sửa
    const handleEdit = () => {
        if (!knowledge) return;
        setFormData({
            title: knowledge.title || "",
            content: knowledge.content || "",
            source: knowledge.source || "",
            category: knowledge.category || "",
            is_active: knowledge.is_active || false
        });
        setIsEdit(true);
        setShowForm(true);
    };

    // Khi bấm nút thêm
    const handleAdd = () => {
        setFormData({
            title: "",
            content: "",
            source: "",
            category: "",
            is_active: true
        });
        setIsEdit(false);
        setShowForm(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setShowForm(false);
        setFormData({
            title: "",
            content: "",
            source: "",
            category: "",
            is_active: true
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                const updated = await updateKnowledge(formData.id || knowledge.id, formData);
                setKnowledge(updated.knowledge_base);
                alert("Cập nhật thành công!");
            } else {
                const created = await postKnowledge(formData);
                setKnowledge(created.knowledge_base);
                alert("Thêm mới thành công!");
            }
            setShowForm(false);
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 p-8 bg-gray-50 min-h-screen overflow-auto">
                    {/* Header */}
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!knowledge && !showForm) {
        return (
            <div className="flex h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 p-8 bg-gray-50 min-h-screen overflow-auto">
                    {/* Header */}
                    <div className="text-center">
                        <BookOpen className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">Chưa có kiến thức nào</h2>
                        <p className="text-gray-500 mb-8">Bắt đầu bằng cách thêm kiến thức đầu tiên của bạn</p>
                        <button
                            onClick={handleAdd}
                            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-all mx-auto"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm kiến thức đầu tiên
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 p-8 bg-gray-50 min-h-screen overflow-auto">
                {/* Header */}
                <div className="max-w-4xl mx-auto px-6">
                    {knowledge && <KnowledgeView knowledge={knowledge} />}

                    {/* Nút sửa chỉ hiện khi có knowledge và form chưa mở */}
                    {knowledge && !showForm && (
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
                            >
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                            </button>

                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-teal-700 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Thêm kiến thức mới
                            </button>
                        </div>
                    )}

                    {/* Hiển thị form khi showForm = true */}
                    {showForm && (
                        <KnowledgeForm
                            formData={formData}
                            handleChange={handleChange}
                            handleSubmit={handleSubmit}
                            handleCancel={handleCancel}
                            loading={loading}
                            isEdit={isEdit}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default KnowledgePage;