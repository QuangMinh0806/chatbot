import { useEffect, useState } from "react";
import { Settings, Save, CheckCircle, AlertCircle } from "lucide-react";
import ConfigAI from './ConfigAI';
import ChatChanel from './ChatChanel';
import { update_llm, get_llm_by_id } from '../../services/llmService';

const LLM = () => {
    const [selectedAI, setSelectedAI] = useState("gemini");
    const [apiKey, setApiKey] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [greetingMessage, setGreetingMessage] = useState("Xin chào");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState();
    const [botName, setBotName] = useState('AI Assistant');

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
        console.log("Saving configuration:", {
            selectedAI,
            apiKey,
            systemPrompt,
            greetingMessage,
            botName
        });
        try {
            await update_llm(1, {
                name: selectedAI,
                key: apiKey,
                prompt: systemPrompt,
                system_greeting: greetingMessage,
                botName: botName
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 mb-6">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Settings className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Cấu hình LLM</h1>
                                <p className="text-gray-600 text-sm">Thiết lập AI và cấu hình chatbot</p>
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Lưu cấu hình
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-8 space-y-6">
                {/* Hiển thị thông báo */}
                {message && (
                    <div className={`flex items-center gap-3 p-4 rounded-lg border ${message.includes("thành công")
                        ? "bg-green-50 text-green-800 border-green-200"
                        : "bg-red-50 text-red-800 border-red-200"
                        }`}>
                        {message.includes("thành công") ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                {/* Main Content */}
                <div className="space-y-6">
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
                        botName={botName}
                        setBotName={setBotName}
                    />
                </div>
            </div>
        </div>
    );
};

export default LLM;
