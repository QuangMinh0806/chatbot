import React, { useState, useEffect } from 'react';
import PasswordInput from '../../components/llm/PasswordInput';
import { get_llm_by_id, update_llm } from '../../services/llmService';

const ConfigAI = ({ llmId }) => {
    const [selectedAI, setSelectedAI] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Load thông tin LLM khi component mount
    useEffect(() => {
        const fetchLLM = async () => {
            setLoading(true);
            try {
                const llm = await get_llm_by_id(llmId);
                console.log(llm)
                if (llm) {
                    setSelectedAI(llm.name);
                    setApiKey(llm.key || '');
                    setSystemPrompt(llm.prompt || '');
                }
            } catch (error) {
                console.error(error);
                setMessage('Không thể tải thông tin LLM');
            } finally {
                setLoading(false);
            }
        };

        fetchLLM();
    }, [llmId]);

    const handleSave = async () => {
        if (!apiKey) {
            setMessage('Vui lòng nhập API key');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const updatedLLM = await update_llm(llmId, {
                name: selectedAI,
                key: apiKey,
                prompt: systemPrompt,
            });

            setMessage(`Cập nhật LLM thành công: ${updatedLLM.id || updatedLLM.name}`);
        } catch (error) {
            console.error(error);
            setMessage('Có lỗi xảy ra khi cập nhật LLM');
        } finally {
            setLoading(false);
        }
    };

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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700/20 to-indigo-800/20"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>

                <div className="relative flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">🤖</span>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">AI Configuration</h2>
                        <p className="text-blue-100 text-lg">
                            Chọn nhà cung cấp AI và cấu hình system prompt
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-red-300 text-lg">*</span>
                            <span className="text-blue-200 text-sm">Trường bắt buộc</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8">
                {/* Message Display */}
                {message && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${message.includes('thành công')
                        ? 'bg-green-50 border-2 border-green-200 text-green-800'
                        : 'bg-red-50 border-2 border-red-200 text-red-800'
                        }`}>
                        <span className="text-xl">
                            {message.includes('thành công') ? '✅' : '⚠️'}
                        </span>
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                {/* AI Provider Selection */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                            <span className="text-purple-600 text-lg">🎯</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">Chọn nhà cung cấp AI</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {aiProviders.map((provider) => (
                            <label key={provider.id} className="cursor-pointer group">
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
                                            className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-blue-500"
                                        />
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                                            <span className="text-2xl">{provider.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{provider.name}</h4>
                                            <p className="text-sm text-gray-600 mt-1">{provider.description}</p>
                                        </div>
                                    </div>

                                    {selectedAI === provider.id && (
                                        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                            <div className="w-3 h-3 bg-white rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* API Key */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                            <span className="text-yellow-600 text-lg">🔑</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {selectedAI === 'gemini' ? 'Google Gemini' : 'OpenAI'} API Key
                            <span className="text-red-500 ml-2">*</span>
                        </h3>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                        <PasswordInput
                            placeholder="Nhập API key của bạn..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            tokenType={selectedAI === 'gemini' ? 'geminiKey' : 'openaiKey'}
                        />

                        <div className="mt-4 p-4 bg-white rounded-xl border border-yellow-300">
                            <div className="flex items-start gap-3">
                                <span className="text-yellow-600 text-lg">💡</span>
                                <div className="text-sm text-yellow-700">
                                    <p className="font-semibold mb-1">Lưu ý về bảo mật:</p>
                                    <ul className="list-disc list-inside space-y-1 text-xs">
                                        <li>API key được mã hóa và lưu trữ an toàn</li>
                                        <li>Không chia sẻ API key với người khác</li>
                                        <li>Thường xuyên thay đổi API key để đảm bảo bảo mật</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Prompt */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <span className="text-green-600 text-lg">📝</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900">System Prompt</h3>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                        <div className="relative">
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                placeholder="Nhập system prompt cho AI..."
                                rows={8}
                                className="w-full px-6 py-4 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none text-lg placeholder-gray-400 bg-white"
                            />
                            <div className="absolute bottom-4 right-4 text-gray-400">
                                <span className="text-lg">📝</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <div className="text-sm text-green-700">
                                <span className="font-semibold">{systemPrompt?.length || 0}</span> ký tự
                            </div>
                            <button
                                onClick={() => setSystemPrompt('')}
                                className="text-sm text-red-500 hover:text-red-700 transition-colors font-medium bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100"
                            >
                                🗑️ Xóa prompt
                            </button>
                        </div>

                        {/* Prompt Examples */}
                        <div className="mt-6 p-4 bg-white rounded-xl border border-green-300">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-green-600 text-lg">💡</span>
                                <h4 className="font-semibold text-green-800">Ví dụ System Prompt:</h4>
                            </div>
                            <div className="text-sm text-green-700 space-y-2">
                                <p><strong>Tư vấn bán hàng:</strong> "Bạn là chuyên viên tư vấn bán hàng chuyên nghiệp..."</p>
                                <p><strong>Hỗ trợ khách hàng:</strong> "Bạn là trợ lý AI hỗ trợ khách hàng tận tình..."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-8 pt-0 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                        onClick={() => {
                            setApiKey('');
                            setSystemPrompt('');
                            setMessage('');
                        }}
                        className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                        🔄 Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-800 transition-all font-bold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-3">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang lưu...</span>
                            </div>
                        ) : (
                            <>
                                💾 Lưu cấu hình
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigAI;