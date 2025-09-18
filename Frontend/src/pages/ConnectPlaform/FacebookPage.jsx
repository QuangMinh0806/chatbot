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
import ConnectWithFb from "../../components/ConnectWithFb";
import TelegramBotPage from "./Telegram"
import ZaloBotPage from "./Zalo";
const FacebookPagePage = () => {
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
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Quản lý Facebook Fanpages</h1>

            <FacebookPageStats pages={pages} />

            <div className="flex justify-end mb-4 gap-2">
                <ConnectWithFb />
            </div>

            {loading ? (
                <p>Đang tải...</p>
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
    );
};

export default FacebookPagePage;