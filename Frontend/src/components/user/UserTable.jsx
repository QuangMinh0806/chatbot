import { FaEdit, FaTrash, FaEye } from "react-icons/fa";

const UserTable = ({ data, onEdit, onDelete, onView }) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full table-auto">
                <thead>
                    <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                        <th className="py-3 px-6 text-left">Full Name</th>
                        <th className="py-3 px-6 text-left">Username</th>
                        <th className="py-3 px-6 text-left">Email</th>
                        <th className="py-3 px-6 text-left">Role</th>
                        <th className="py-3 px-6 text-center">Active</th>
                        <th className="py-3 px-6 text-center">Last Login</th>
                        <th className="py-3 px-6 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody className="text-gray-600 text-sm font-light">
                    {data.map((item) => (
                        <tr
                            key={item.id}
                            className="border-b border-gray-200 hover:bg-gray-100 transition duration-300 ease-in-out"
                        >
                            <td className="py-3 px-6">{item.full_name}</td>
                            <td className="py-3 px-6">{item.username}</td>
                            <td className="py-3 px-6">{item.email}</td>
                            <td className="py-3 px-6">{item.role}</td>
                            <td className="py-3 px-6 text-center">
                                {item.is_active ? (
                                    <span className="bg-green-200 text-green-600 py-1 px-3 rounded-full text-xs">Active</span>
                                ) : (
                                    <span className="bg-red-200 text-red-600 py-1 px-3 rounded-full text-xs">Inactive</span>
                                )}
                            </td>
                            <td className="py-3 px-6 text-center">
                                {item.last_login ? new Date(item.last_login).toLocaleString() : "Never"}
                            </td>
                            <td className="py-3 px-6 text-center">
                                <div className="flex item-center justify-center">
                                    <button className="w-4 mr-2 hover:text-purple-500" onClick={() => onEdit(item)}>
                                        <FaEdit />
                                    </button>
                                    <button className="w-4 mr-2 hover:text-red-500" onClick={() => onDelete(item.id)}>
                                        <FaTrash />
                                    </button>
                                    <button className="w-4 mr-2 hover:text-blue-500" onClick={() => onView(item)}>
                                        <FaEye />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
