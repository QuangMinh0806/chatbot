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
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-2xl font-bold mb-4">Quản lý Telegram</h1>

            <TelegramBotStats bots={bots} />

            <div className="flex justify-end mb-4 gap-2">
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                    Thêm Bot Mới
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <p>Đang tải...</p>
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
    );
};

export default TelegramBotPage;