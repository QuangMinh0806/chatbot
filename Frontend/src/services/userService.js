import axiosClient from './axios';

export const login = async (username, password) => {
    try {
        const response = await axiosClient.post('/users/login', { username, password });
        return response.data;
    } catch (error) {
        throw error;
    }
};



export const getUsers = async () => {
    try {
        const response = await axiosClient.get('/users');
        return response;
    } catch (error) {
        throw error;
    }
};



export const postUsers = async (data) => {
    try {
        const response = await axiosClient.post('/users', data);
        console.log(response);
        return response;

    } catch (error) {
        throw error;
    }
};

// Cập nhật user
export const updateUser = async (id, data) => {
    const response = await axiosClient.put(`/users/${id}`, data);
    return response;
};

