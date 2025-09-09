import React, { useState, useEffect } from "react";
import { getKnowledgeById, postKnowledge, updateKnowledge } from "../../services/knowledgeService";
import KnowledgeForm from "../../components/knowledge/KnowledgeForm";
import KnowledgeView from "../../components/knowledge/KnowledgeView";

const KnowledgePage = () => {
    const [knowledge, setKnowledge] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        source: "",
        category: ""
    });
    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [showForm, setShowForm] = useState(false); // điều khiển hiển thị form

    // Lấy dữ liệu khi mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getKnowledgeById(); // không truyền id
                setKnowledge(data);
            } catch (err) {
                console.error(err);
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
            category: knowledge.category || ""
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
            category: ""
        });
        setIsEdit(false);
        setShowForm(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                const updated = await updateKnowledge(formData.id || knowledge.id, formData);
                setKnowledge(updated);
                alert("Cập nhật thành công!");
            } else {
                const created = await postKnowledge(formData);
                setKnowledge(created);
                alert("Thêm mới thành công!");
            }
            setShowForm(false); // ẩn form sau khi submit
        } catch (err) {
            console.error(err);
            alert("Có lỗi xảy ra!");
        } finally {
            setLoading(false);
        }
    };

    if (!knowledge && !showForm) {
        // Chưa có knowledge → hiển thị nút Thêm
        return (
            <div className="max-w-3xl mx-auto p-6">
                <button onClick={handleAdd} className="btn btn-primary">Thêm kiến thức</button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            {knowledge && <KnowledgeView knowledge={knowledge} />}

            {/* Nút sửa chỉ hiện khi có knowledge và form chưa mở */}
            {knowledge && !showForm && (
                <button onClick={handleEdit} className="btn btn-primary mb-4">Sửa</button>
            )}

            {/* Hiển thị form khi showForm = true */}
            {showForm && (
                <KnowledgeForm
                    formData={formData}
                    handleChange={handleChange}
                    handleSubmit={handleSubmit}
                    loading={loading}
                    isEdit={isEdit}
                />
            )}
        </div>
    );
};

export default KnowledgePage;
