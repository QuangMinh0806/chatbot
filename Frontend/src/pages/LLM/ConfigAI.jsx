import React, { useEffect } from 'react';
import PasswordInput from '../../components/llm/PasswordInput';
import { get_llm_by_id } from '../../services/llmService';

const ConfigAI = ({ llmId, selectedAI, setSelectedAI, apiKey, setApiKey, systemPrompt, setSystemPrompt }) => {
    // Load thông tin LLM khi component mount
    useEffect(() => {
        const fetchLLM = async () => {
            try {
                const llm = await get_llm_by_id(llmId);
                if (llm) {
                    setSelectedAI(llm.name || 'gemini');
                    setApiKey(llm.key || '');
                    setSystemPrompt(llm.prompt || '');
                }
            } catch (error) {
                console.error("Không thể tải thông tin LLM:", error);
            }
        };
        fetchLLM();
    }, [llmId, setSelectedAI, setApiKey, setSystemPrompt]);

    const aiProviders = [
        {
            id: 'gemini',
            name: 'Google Gemini',
            icon: '🤖',
            color: 'border-blue-300 bg-blue-50',
            description: 'AI mạnh mẽ từ Google với khả năng hiểu ngữ cảnh tốt'
        },
        {
            id: 'openai',
            name: 'OpenAI',
            icon: '⚡',
            color: 'border-green-300 bg-green-50',
            description: 'GPT models với khả năng xử lý ngôn ngữ tự nhiên vượt trội'
        }
    ];

    return (
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
                <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                        <span className="text-3xl">🤖</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">AI Configuration</h2>
                        <p className="text-blue-100 text-lg">
                            Chọn nhà cung cấp AI và cấu hình system prompt
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
                {/* AI Provider Selection */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        🎯 Chọn nhà cung cấp AI
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {aiProviders.map((provider) => (
                            <label key={provider.id} className="cursor-pointer">
                                <div className={`relative border-2 rounded-2xl p-6 transition-all duration-300 ${selectedAI === provider.id
                                    ? `${provider.color} border-opacity-100 shadow-lg transform scale-105`
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                    }`}>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="radio"
                                            name="ai-provider"
                                            value={provider.id}
                                            checked={selectedAI === provider.id}
                                            onChange={(e) => setSelectedAI(e.target.value)}
                                            className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-2xl">{provider.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900">{provider.name}</h4>
                                            <p className="text-sm text-gray-600">{provider.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* API Key */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        🔑 {selectedAI === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key
                    </h3>
                    <PasswordInput
                        placeholder="Nhập API key của bạn..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        tokenType={selectedAI === 'gemini' ? 'geminiKey' : 'openaiKey'}
                    />
                </div>

                {/* System Prompt */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        📝 System Prompt
                    </h3>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        rows={8}
                        placeholder="Nhập system prompt cho AI..."
                        className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:ring-green-500 focus:border-green-500 resize-none text-lg"
                    />
                </div>
            </div>
        </div>
    );
};

export default ConfigAI;
