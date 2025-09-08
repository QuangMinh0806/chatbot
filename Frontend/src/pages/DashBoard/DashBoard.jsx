import React from 'react'
import Sidebar from '../../components/layout/Sildebar'

export const DashBoard = () => {
    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 p-6 bg-gray-100 min-h-screen">
                <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
                <p>Welcome to your admin panel!</p>
            </div>
        </div>
    )
}
