import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = ({ placeholder, value, onChange, tokenType }) => {
    const [showTokens, setShowTokens] = useState({
        geminiKey: false,
        verifyToken: false,
        pageAccessToken: false,
        zaloSecret: false
    });

    const toggleTokenVisibility = (tokenType) => {
        setShowTokens(prev => ({
            ...prev,
            [tokenType]: !prev[tokenType]
        }));
    };

    return (
        <div className="relative">
            <input
                type={showTokens[tokenType] ? 'text' : 'password'}
                placeholder={placeholder}
                value={value}       // value đồng bộ với parent
                onChange={onChange} // bắt sự kiện gõ
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            />
            <button
                type="button"
                onClick={() => toggleTokenVisibility(tokenType)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
                {showTokens[tokenType] ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
            </button>
        </div>
    );
};

export default PasswordInput;
