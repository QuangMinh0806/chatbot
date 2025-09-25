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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bảng ánh xạ chi tiết</h3>
                        <p className="text-gray-600 text-sm">Xem và chỉnh sửa ánh xạ</p>
                    </div>
                </div>
                <button
                    onClick={handleAddColumn}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    + Thêm cột
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b text-sm">Cột Sheet</th>
                            <th className="py-3 px-4 text-left font-semibold text-gray-700 border-b text-sm">Trường ánh xạ</th>
                            <th className="py-3 px-4 text-center font-semibold text-gray-700 border-b text-sm">Trạng thái</th>
                            <th className="py-3 px-4 text-center font-semibold text-gray-700 border-b text-sm">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(mappings).map((column) => {
                            const mappedField = mappings[column];
                            const fieldInfo = customerFields.find(f => f.key === mappedField);

                            return (
                                <tr key={column} className="hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-4 border-b">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                                                <span className="font-semibold text-blue-600 text-xs">{column}</span>
                                            </div>
                                            <span className="font-medium text-sm">Cột {column}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 border-b">
                                        <select
                                            value={mappedField}
                                            onChange={(e) => handleMappingChange(column, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                                        >
                                            <option value="">-- Chọn trường --</option>
                                            {customerFields.map((field) => (
                                                <option key={field.key} value={field.key}>
                                                    {field.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="py-3 px-4 text-center border-b">
                                        {fieldInfo ? (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${fieldInfo.required
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {fieldInfo.required ? 'Bắt buộc' : 'Tùy chọn'}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                                                Chưa ánh xạ
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center border-b">
                                        <button
                                            onClick={() => handleRemoveColumn(column)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
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