import React, { useState } from 'react';
import PasswordInput from '../../components/llm/PasswordInput';

const ChatChanel = () => {
    const [facebookEnabled, setFacebookEnabled] = useState(true);
    const [zaloEnabled, setZaloEnabled] = useState(false);

    // State cho các token
    const [verifyToken, setVerifyToken] = useState('');
    const [pageAccessToken, setPageAccessToken] = useState('');
    const [zaloAppSecret, setZaloAppSecret] = useState('');
    const [zaloAppID, setZaloAppID] = useState('3581547215348469');
    const [zaloOAID, setZaloOAID] = useState('4383237443089172651');
    const [zaloAccessToken, setZaloAccessToken] = useState('');

    const ToggleSwitch = ({ enabled, onToggle }) => (
        <button
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    );

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-gray-600 text-sm">💬</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">Kênh Chat</h2>
            </div>

            {/* Facebook Integration */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-600 rounded mr-3 flex items-center justify-center">
                            <span className="text-white text-xs">f</span>
                        </div>
                        <span className="text-gray-800 font-medium">Facebook Integration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                            {facebookEnabled ? 'ON' : 'OFF'}
                        </span>
                        <ToggleSwitch
                            enabled={facebookEnabled}
                            onToggle={() => setFacebookEnabled(!facebookEnabled)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Verify Token:</label>
                        <PasswordInput
                            placeholder="Enter verify token"
                            value={verifyToken}
                            onChange={(e) => setVerifyToken(e.target.value)}
                            tokenType="verifyToken"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Page Access Token:</label>
                        <PasswordInput
                            placeholder="Enter page access token"
                            value={pageAccessToken}
                            onChange={(e) => setPageAccessToken(e.target.value)}
                            tokenType="pageAccessToken"
                        />
                    </div>
                </div>
            </div>

            {/* Zalo Integration */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded mr-3 flex items-center justify-center">
                            <span className="text-white text-xs">Z</span>
                        </div>
                        <span className="text-gray-800 font-medium">ZaloOA Integration</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                            {zaloEnabled ? 'ON' : 'OFF'}
                        </span>
                        <ToggleSwitch
                            enabled={zaloEnabled}
                            onToggle={() => setZaloEnabled(!zaloEnabled)}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Zalo App ID:</label>
                        <input
                            type="text"
                            value={zaloAppID}
                            onChange={(e) => setZaloAppID(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Zalo App Secret:</label>
                        <PasswordInput
                            placeholder="Enter app secret"
                            value={zaloAppSecret}
                            onChange={(e) => setZaloAppSecret(e.target.value)}
                            tokenType="zaloSecret"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Zalo OA ID:</label>
                        <input
                            type="text"
                            value={zaloOAID}
                            onChange={(e) => setZaloOAID(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Zalo Access Token:</label>
                        <input
                            type="text"
                            value={zaloAccessToken}
                            onChange={(e) => setZaloAccessToken(e.target.value)}
                            placeholder="Nhập Zalo Access Token"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatChanel;
