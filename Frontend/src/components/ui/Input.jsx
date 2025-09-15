import React from "react"

export function Input({ value, onChange, placeholder = "", className = "", type = "text", disabled = false, onKeyPress }) {
    return (
        <input
            type={type}
            value={value}
            onChange={onChange}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={`border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${className}`}
        />
    )
}
