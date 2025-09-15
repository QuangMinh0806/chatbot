import { X, Plus, BarChart3 } from "lucide-react"
const TableMapping = ({ mappings, setMappings, loading, customerFields }) => {
    const handleAddColumn = () => {
        const columns = Object.keys(mappings);
        const lastColumn = columns[columns.length - 1];
        // Tạo cột mới (chỉ support tới Z)
        if (lastColumn && lastColumn.charCodeAt(0) < 90) {
            const nextColumn = String.fromCharCode(lastColumn.charCodeAt(0) + 1);
            if (!mappings[nextColumn]) {
                setMappings(prev => ({ ...prev, [nextColumn]: '' }));
            }
        }
    };

    const handleRemoveColumn = (column) => {
        const newMappings = { ...mappings };
        delete newMappings[column];
        setMappings(newMappings);
    };

    const handleMappingChange = (column, field) => {
        setMappings(prev => ({ ...prev, [column]: field }));
    };
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Bảng ánh xạ chi tiết</h3>
                        <p className="text-gray-200 mt-1">Xem và chỉnh sửa ánh xạ</p>
                    </div>
                </div>
                <button
                    onClick={handleAddColumn}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                >
                    + Thêm cột
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-4 px-6 text-left font-bold text-gray-700 border-b">Cột Sheet</th>
                            <th className="py-4 px-6 text-left font-bold text-gray-700 border-b">Trường ánh xạ</th>
                            <th className="py-4 px-6 text-center font-bold text-gray-700 border-b">Trạng thái</th>
                            <th className="py-4 px-6 text-center font-bold text-gray-700 border-b">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(mappings).map((column) => {
                            const mappedField = mappings[column];
                            const fieldInfo = customerFields.find(f => f.key === mappedField);

                            return (
                                <tr key={column} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-4 px-6 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <span className="font-bold text-blue-600 text-sm">{column}</span>
                                            </div>
                                            <span className="font-medium">Cột {column}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 border-b">
                                        <select
                                            value={mappedField}
                                            onChange={(e) => handleMappingChange(column, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">-- Chọn trường --</option>
                                            {customerFields.map((field) => (
                                                <option key={field.key} value={field.key}>
                                                    {field.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-4 px-6 text-center border-b">
                                        {fieldInfo ? (
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${fieldInfo.required
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {fieldInfo.required ? '🔴 Bắt buộc' : '🟡 Tùy chọn'}
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm font-medium">
                                                ⚪ Chưa ánh xạ
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-center border-b">
                                        <button
                                            onClick={() => handleRemoveColumn(column)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default TableMapping