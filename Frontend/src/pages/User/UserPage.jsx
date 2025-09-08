import { useState, useEffect } from "react";
import { CgSpinner } from "react-icons/cg";
import { FaSearch, FaPlus } from "react-icons/fa";
import UserTable from "../../components/user/UserTable";
import UserForm from "../../components/user/UserForm";
import { getUsers } from '../../services/userService';

const UserPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const users = await getUsers();
            setData(users);
            setLoading(false);
        };
        fetchData();
    }, []);


    const handleAddUser = (newUser) => {
        setData([...data, newUser]);
        setShowForm(false);
    };

    return (
        <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management</h1>
            <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Search + Create */}
                <div className="flex justify-between items-center mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center"
                    >
                        <FaPlus className="mr-2" /> Create New User
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <CgSpinner className="animate-spin text-4xl text-blue-500" />
                    </div>
                ) : (
                    <UserTable
                        data={data}
                        onEdit={(user) => console.log("Edit", user)}
                        onDelete={(id) => setData(data.filter((u) => u.id !== id))}
                        onView={(user) => alert(JSON.stringify(user, null, 2))}
                    />
                )}

                {showForm && <UserForm onSubmit={handleAddUser} onCancel={() => setShowForm(false)} />}
            </div>
        </div>
    );
};

export default UserPage;
