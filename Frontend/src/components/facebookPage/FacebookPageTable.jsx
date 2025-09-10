import { FaEdit, FaTrash } from "react-icons/fa";

const FacebookPageTable = ({ data, onEdit, onDelete }) => {
    return (
        <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="w-full table-auto">
                <thead className="bg-gray-100 text-gray-600 uppercase text-sm">
                    <tr>
                        <th className="py-3 px-6 text-left">Fanpage</th>
                        <th className="py-3 px-6 text-center">Trạng thái</th>
                        <th className="py-3 px-6 text-center">Cập nhật</th>
                        <th className="py-3 px-6 text-center">Thao tác</th>
                    </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                    {data.map((page) => (
                        <tr key={page.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-6">
                                <p className="font-semibold text-blue-600">{page.page_name}</p>
                                <p className="text-xs text-gray-500">ID: {page.page_id}</p>
                                <p className="text-xs text-gray-400">{page.category}</p>
                            </td>
                            <td className="py-3 px-6 text-center">
                                {page.is_active ? (
                                    <span className="bg-green-200 text-green-600 py-1 px-3 rounded-full text-xs">
                                        Hoạt động
                                    </span>
                                ) : (
                                    <span className="bg-red-200 text-red-600 py-1 px-3 rounded-full text-xs">
                                        Tạm dừng
                                    </span>
                                )}

                                <div className="mt-2">
                                    {page.auto_response_enabled ? (
                                        <span className="bg-blue-200 text-blue-600 py-1 px-3 rounded-full text-xs">
                                            Auto Reply
                                        </span>
                                    ) : (
                                        <span className="bg-gray-200 text-gray-600 py-1 px-3 rounded-full text-xs">
                                            Không Auto Reply
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="py-3 px-6 text-center">
                                {new Date(page.updated_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-6 text-center">
                                <button
                                    onClick={() => onEdit(page)}
                                    className="text-blue-500 hover:text-blue-700 mr-3"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => onDelete(page.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <FaTrash />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default FacebookPageTable;
