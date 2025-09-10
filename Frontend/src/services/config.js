import axiosClient from "./axios";


export const get_config = async (id) => {
    try {
        const response = await axiosClient.get(`/config/${id}`);
        return response;
    } catch (error) {
        throw error;
    }
}

export const update_config = async (id, data) => {
    try {
        console.log("data ", data)
        const response = await axiosClient.put(`/config/${id}`, data);
        console.log(response)
        return response;
    } catch (error) {
        throw error;
    }
}