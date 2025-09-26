import { getKnowledgeById, postKnowledge, updateKnowledge } from "../../services/knowledgeService";
import { useState, useEffect } from "react";
import { Edit, BookOpen } from "lucide-react";
import { KnowledgeForm } from "../../components/knowledge/KnowledgeForm";
import { KnowledgeView } from "../../components/knowledge/KnowledgeView";

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
    const [currentView, setCurrentView] = useState('detail');

    // Lấy dữ liệu khi mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setInitialLoading(true);
                const data = await getKnowledgeById(); // không truyền id
                setKnowledge(data);
                if (data) {
                    setCurrentView('detail');
                }
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
        console.log("Editing knowledge:", knowledge);
        if (!knowledge) return;
        setFormData({
            title: knowledge.title || "",
            content: knowledge.content || "",
            source: knowledge.source || "",
            category: knowledge.category || "",
            is_active: knowledge.is_active || false
        });
        setIsEdit(true);
        setCurrentView('form');
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
        setCurrentView('form');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setCurrentView('detail');
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
            console.log("Submitting form data:", formData);
            if (isEdit) {
                console.log(formData.id || knowledge.id);
                const updated = await updateKnowledge(formData.id || knowledge.id, formData);
                console.log(updated)
                setKnowledge(updated.knowledge_base);
                alert("Cập nhật thành công!");
            } else {
                const created = await postKnowledge(formData);
                setKnowledge(created.knowledge_base);
                alert("Thêm mới thành công!");
            }
            setCurrentView('detail');
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Simple Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                            <h1 className="text-xl font-bold text-gray-900">Quản lý Kiến thức</h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-6">

                {/* Detail View */}
                {currentView === 'detail' && knowledge && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Chi tiết kiến thức</h2>
                            <button
                                onClick={handleEdit}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                            </button>
                        </div>
                        <KnowledgeView knowledge={knowledge} />
                    </div>
                )}

                {/* Form View */}
                {currentView === 'form' && (
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
    );
};

export default KnowledgePage;