import { useEffect, useState } from "react";
import TelegramBotStats from "../../components/telegramPage/TelegramBotStats";
import TelegramBotCard from "../../components/telegramPage/TelegramBotTable";
import TelegramBotForm from "../../components/telegramPage/TelegramBotForm";
import {
    getTelegramBots,
    createTelegramBot,
    updateTelegramBot,
    deleteTelegramBot,
} from "../../services/telegramService";

const TelegramBotPage = () => {
    const [bots, setBots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await getTelegramBots();
                setBots(res);
            } catch (error) {
                console.error("Error fetching telegram bots:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (data) => {
        try {
            if (editing) {
                const updated = await updateTelegramBot(editing.id, data);
                setBots(bots.map((b) => (b.id === editing.id ? updated : b)));
            } else {
                const created = await createTelegramBot(data);
                setBots([...bots, created]);
            }
            setShowForm(false);
            setEditing(null);
        } catch (error) {
            console.error("Error submitting telegram bot:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTelegramBot(id);
            setBots(bots.filter((b) => b.id !== id));
        } catch (error) {
            console.error("Error deleting telegram bot:", error);
        }
    };

    return (
        <div className="flex-1 p-4 lg:p-8 bg-gray-50 min-h-screen overflow-auto">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-lg">📱</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">Quản lý Telegram Bot</h1>
                                <p className="text-gray-600 text-sm">Kết nối và quản lý Telegram Bot</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <span className="text-sm">+</span>
                            Thêm Bot Mới
                        </button>
                    </div>
                </div>

                <TelegramBotStats bots={bots} />

                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">Đang tải...</p>
                    </div>
                ) : (
                    <TelegramBotCard
                        data={bots.length ? bots[0] : null}
                        onEdit={(bot) => {
                            setEditing(bot);
                            setShowForm(true);
                        }}
                    />
                )}

                {showForm && (
                    <TelegramBotForm
                        initialData={editing}
                        onSubmit={handleSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditing(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default TelegramBotPage;