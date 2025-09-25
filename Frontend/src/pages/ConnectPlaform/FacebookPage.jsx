import { useEffect, useState } from "react";
import FacebookPageStats from "../../components/facebookPage/FacebookPageStats";
import FacebookPageTable from "../../components/facebookPage/FacebookPageTable";
import FacebookPageForm from "../../components/facebookPage/FacebookPageForm";
import {
    getFacebookPages,
    createFacebookPage,
    updateFacebookPage,
    deleteFacebookPage,
} from "../../services/facebookPageService";
import LoginWithFb from "../../components/LoginWithFb";
import TelegramBotPage from "./TelegramBotPage"
import ZaloBotPage from "./ZaloBotPage";
const FacebookPage = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const res = await getFacebookPages();
            setPages(res);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleSubmit = async (data) => {
        if (editing) {
            const updated = await updateFacebookPage(editing.id, data);
            setPages(pages.map((p) => (p.id === editing.id ? updated : p)));
        } else {
            const created = await createFacebookPage(data);
            setPages([...pages, created]);
        }
        setShowForm(false);
        setEditing(null);
    };

    const handleDelete = async (id) => {
        await deleteFacebookPage(id);
        setPages(pages.filter((p) => p.id !== id));
    };

    return (
        <div className="flex-1 p-4 lg:p-8 bg-gray-50 min-h-screen overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg">📘</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Quản lý Facebook Fanpages</h1>
                                <p className="text-gray-600 text-sm">Kết nối và quản lý các trang Facebook</p>
                            </div>
                        </div>
                        <LoginWithFb />
                    </div>
                </div>

                <FacebookPageStats pages={pages} />

                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">Đang tải...</p>
                    </div>
                ) : (
                    <FacebookPageTable
                        data={pages}
                        onEdit={(page) => {
                            setEditing(page);
                            setShowForm(true);
                        }}
                        onDelete={handleDelete}
                    />
                )}

                {showForm && (
                    <FacebookPageForm
                        initialData={editing}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditing(null);
                        }}
                    />
                )}

                <TelegramBotPage />

                <ZaloBotPage />
            </div>
        </div>
    );
};

export default FacebookPage;