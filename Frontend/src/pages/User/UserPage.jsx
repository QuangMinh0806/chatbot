import { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { FaSearch, FaPlus } from "react-icons/fa";
import UserTable from "../../components/user/UserTable";
import UserForm from "../../components/user/UserForm";
import { UserView } from "../../components/user/UserView";
import { getUsers, postUsers, updateUser } from "../../services/userService";

const UserPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const users = await getUsers();
            setData(users);
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleAddUser = async (formData) => {
        const newUser = await postUsers({ ...formData, company_id: 1 });
        setData([...data, newUser.user]);
        setShowForm(false);
    };

    const handleEditUser = async (id, formData) => {
        const dataToSend = { ...formData, company_id: 1 };
        if (dataToSend.password === "") {
            delete dataToSend.password;
        }
        console.log(dataToSend);
        const updated = await updateUser(id, dataToSend);
        setData(data.map((u) => (u.id === id ? updated.user : u)));
        setEditingUser(null);
        setShowForm(false);
    };

    return (
        <div className="container mx-auto p-2 sm:p-4 lg:p-6 bg-gray-50 min-h-screen max-w-full">
            <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 px-2 sm:px-0">
                User Management
            </h1>

            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 lg:p-6 mx-2 sm:mx-0">
                {/* Search + Create - Responsive Layout */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 sm:gap-0">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-auto sm:min-w-[250px] lg:min-w-[300px]">
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 top-2.5 sm:top-3 text-gray-400 text-sm sm:text-base" />
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setShowForm(true);
                        }}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center sm:justify-start transition-colors text-sm sm:text-base"
                    >
                        <FaPlus className="mr-2 text-sm sm:text-base" />
                        <span className="sm:inline">Tạo người dùng mới</span>
                    </button>
                </div>

                {/* Table Container with Horizontal Scroll */}
                <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
                    <div className="inline-block min-w-full align-middle px-3 sm:px-4 lg:px-6">
                        {loading ? (
                            <div className="flex justify-center items-center h-32 sm:h-48">
                                <CgSpinner className="animate-spin text-xl sm:text-2xl text-blue-600" />
                            </div>
                        ) : (
                            <UserTable
                                data={data.filter((u) =>
                                    u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
                                )}
                                onEdit={(user) => {
                                    setEditingUser(user);
                                    setShowForm(true);
                                }}
                                onView={(user) => setViewingUser(user)}
                            />
                        )}
                    </div>
                </div>

                {/* Modals/Overlays */}
                {viewingUser && (
                    <UserView user={viewingUser} onClose={() => setViewingUser(null)} />
                )}
                {showForm && (
                    <UserForm
                        initialData={editingUser}
                        onSubmit={(formData) =>
                            editingUser
                                ? handleEditUser(editingUser.id, formData)
                                : handleAddUser(formData)
                        }
                        onCancel={() => {
                            setShowForm(false);
                            setEditingUser(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default UserPage;