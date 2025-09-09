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

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm">🤖</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">AI Configuration</h2>
                <span className="text-red-500 ml-1">*</span>
            </div>

            <p className="text-gray-600 mb-6">Chọn nhà cung cấp AI và nhập API Key, cấu hình system prompt</p>

            {/* Chọn nhà cung cấp AI */}
            <div className="mb-6">
                <label className="block text-gray-700 mb-3">Chọn nhà cung cấp AI:</label>
                <div className="flex space-x-8">
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="ai-provider"
                            value="gemini"
                            checked={selectedAI === 'gemini'}
                            onChange={(e) => setSelectedAI(e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">Google Gemini</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="radio"
                            name="ai-provider"
                            value="openai"
                            checked={selectedAI === 'openai'}
                            onChange={(e) => setSelectedAI(e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-700">OpenAI</span>
                    </label>
                </div>
            </div>

            {/* API Key */}
            <div className="mb-6">
                <label className="block text-gray-700 mb-2">{selectedAI} API Key:</label>
                <PasswordInput
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    tokenType={selectedAI === 'gemini' ? 'geminiKey' : 'openaiKey'}
                />
            </div>

            {/* System Prompt */}
            <div className="mb-4">
                <label className="block text-gray-700 mb-2">System Prompt:</label>
                <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Nhập system prompt cho AI..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
                <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">{systemPrompt.length} ký tự</span>
                    <button
                        onClick={() => setSystemPrompt('')}
                        className="text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                        Xóa prompt
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end mt-4">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                    {loading ? 'Đang lưu...' : 'Lưu cấu hình'}
                </button>
            </div>

            {message && <p className="mt-2 text-gray-700">{message}</p>}
        </div>
    );
};

export default ConfigAI;
