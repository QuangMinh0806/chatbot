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
        // console.log(formData)
        // const updated = await updateUser(id, { ...formData, company_id: 1 });
        const dataToSend = { ...formData, company_id: 1 };
        if (dataToSend.password === "") {
            delete dataToSend.password;
        }
        console.log(dataToSend)
        const updated = await updateUser(id, dataToSend);
        setData(data.map((u) => (u.id === id ? updated.user : u)));
        setEditingUser(null);
        setShowForm(false);
    };


    return (
        <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-semibold mb-6 text-gray-800">User Management</h1>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                {/* Search + Create */}
                <div className="flex justify-between items-center mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setShowForm(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center transition-colors"
                    >
                        <FaPlus className="mr-2" /> Tạo người dùng mới
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-48">
                        <CgSpinner className="animate-spin text-2xl text-blue-600" />
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
