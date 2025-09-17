// LLM.jsx
import { useEffect, useState } from "react";
import Sidebar from '../../components/layout/Sildebar';
import ConfigAI from './ConfigAI';
import ChatChanel from './ChatChanel';
import { update_llm, get_llm_by_id } from '../../services/llmService';

const LLM = () => {
    const [selectedAI, setSelectedAI] = useState("gemini");
    const [apiKey, setApiKey] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [greetingMessage, setGreetingMessage] = useState("Xin chaof");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState();

    useEffect(() => {
        const fetchGreeting = async () => {
            try {
                const res = await get_llm_by_id(1);
                console.log(res)
                setGreetingMessage(res.system_greeting);
            } catch (err) {
                console.error("Failed to fetch greeting:", err);
            }
        };

        fetchGreeting();
    }, []);
    const handleSave = async () => {
        setLoading(true);
        setMessage("");
        try {
            await update_llm(1, {
                name: selectedAI,
                key: apiKey,
                prompt: systemPrompt,
                system_greeting: greetingMessage,
            });
            setMessage("Cập nhật cấu hình thành công ✅");
        } catch (err) {
            console.error(err);
            setMessage("Có lỗi khi lưu cấu hình ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 bg-gray-50 min-h-screen overflow-auto space-y-8">
            {/* Hiển thị thông báo */}
            {message && (
                <div
                    className={`p-4 rounded-xl ${message.includes("thành công")
                        ? "bg-green-50 text-green-700 border border-green-300"
                        : "bg-red-50 text-red-700 border border-red-300"
                        }`}
                >
                    {message}
                </div>
            )}

            {/* Truyền state xuống các component con */}
            <ConfigAI
                llmId={1}
                selectedAI={selectedAI}
                setSelectedAI={setSelectedAI}
                apiKey={apiKey}
                setApiKey={setApiKey}
                systemPrompt={systemPrompt}
                setSystemPrompt={setSystemPrompt}
            />

            <ChatChanel
                greetingMessage={greetingMessage}
                setGreetingMessage={setGreetingMessage}
            />

            {/* Nút lưu duy nhất */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50"
                >
                    {loading ? "Đang lưu..." : "💾 Lưu cấu hình"}
                </button>
            </div>
        </div>
    );
};

export default LLM;
