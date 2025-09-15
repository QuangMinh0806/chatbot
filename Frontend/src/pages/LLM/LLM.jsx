// LLM.jsx
import { useState } from "react";
import Sidebar from '../../components/layout/Sildebar';
import ConfigAI from './ConfigAI';
import ChatChanel from './ChatChanel';
import { update_llm } from '../../services/llmService';

const LLM = () => {
    const [selectedAI, setSelectedAI] = useState("gemini");
    const [apiKey, setApiKey] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [greetingMessage, setGreetingMessage] = useState(
        "Xin chào! Em là nhân viên tư vấn của Hệ thống đào tạo tiếng Trung Thanh Mai HSK. Em rất vui được hỗ trợ anh/chị!"
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSave = async () => {
        setLoading(true);
        setMessage("");
        try {
            await update_llm(5, {
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
        <div className="flex h-screen bg-gray-50">
            <Sidebar />
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
                    llmId={5}
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
        </div>
    );
};

export default LLM;
