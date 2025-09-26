import React, { useEffect } from 'react';
import { Bot, Key, FileText } from 'lucide-react';
import PasswordInput from '../../components/llm/PasswordInput';
import { get_llm_by_id } from '../../services/llmService';

const ConfigAI = ({ llmId, selectedAI, setSelectedAI, apiKey, setApiKey, systemPrompt, setSystemPrompt, showPrompt = true }) => {
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
            description: 'AI mạnh mẽ từ Google với khả năng hiểu ngữ cảnh tốt'
        },
        {
            id: 'openai',
            name: 'OpenAI',
            icon: '⚡',
            description: 'GPT models với khả năng xử lý ngôn ngữ tự nhiên vượt trội'
        }
    ];

    return (
        <div className="space-y-6">
            {/* AI Provider Selection */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Nhà cung cấp AI</h3>
                </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiProviders.map((provider) => (
                            <label key={provider.id} className="cursor-pointer">
                                <div className={`border-2 rounded-lg p-4 transition-all ${selectedAI === provider.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="ai-provider"
                                            value={provider.id}
                                            checked={selectedAI === provider.id}
                                            onChange={(e) => setSelectedAI(e.target.value)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                            <span className="text-xl">{provider.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{provider.name}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* API Key */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            {selectedAI === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key
                        </h3>
                    </div>
                    <PasswordInput
                        placeholder="Nhập API key của bạn..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        tokenType={selectedAI === 'gemini' ? 'geminiKey' : 'openaiKey'}
                    />
                </div>

                {/* System Prompt - chỉ hiển thị khi showPrompt = true */}
                {showPrompt && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Custom Prompt</h3>
                        </div>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={6}
                            placeholder="Nhập custom prompt cho AI..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        <p className="text-sm text-gray-500">
                            Custom prompt sẽ định hướng cách AI phản hồi và hành xử
                        </p>
                    </div>
                )}
        </div>
    );
};

export default ConfigAI;
