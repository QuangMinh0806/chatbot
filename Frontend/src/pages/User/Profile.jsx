import { useState } from 'react';
import UserForm from '../../components/user/UserForm';
import { useAuth } from '../../components/context/AuthContext';
import { updateUser } from "../../services/userService";

const Profile = () => {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const handleEditUser = async (id, formData) => {
        const dataToSend = { ...formData, company_id: 1 };
        if (dataToSend.password === "") {
            delete dataToSend.password;
        }
        const updated = await updateUser(id, dataToSend);
        setData(data.map((u) => (u.id === id ? updated.user : u)));
        setShowForm(false);

    };
    return (
        <div>
            {showForm && (
                <UserForm
                    initialData={user}
                    onSubmit={(formData) =>
                        handleEditUser(user.id, formData)}
                    onCancel={() => {
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    )
}

export default Profile