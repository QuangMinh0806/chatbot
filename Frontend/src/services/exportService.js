import axiosClient from "./axios";

export const export_sheet = async () => {
    try {
        const response = await axiosClient.post('/sheets/export');
        return response;
    } catch (error) {
        throw error;
    }
}

export const get_mapping = async () => {
    try {
        const response = await axiosClient.get('/sheets/mapping');
        return response;
    } catch (error) {
        throw error;
    }
}

export const update_mapping = async (data) => {
    try {
        const response = await axiosClient.put('/sheets/mapping', data);
        return response;
    } catch (error) {
        throw error;
    }
}