import axiosClient from "./axios";

export const create_llm = async (name, key, prompt, user_id) => {
    try {
        const response = await axiosClient.post('/llms/', { name, key, prompt, user_id });
        return response.llm;
    } catch (error) {
        throw error;
    }
}
export const update_llm = async (llm_id, data) => {
    try {
        const response = await axiosClient.put(`/llms/${llm_id}`, data);
        return response.llm;
    } catch (error) {
        throw error
    }   
}

export const delete_llm = async (llm_id) => {
    try {
        const response = axiosClient.delete(`/llms/${llm_id}`);
        return response;
//         {
//     "message": "LLM deleted",
//     "llm_id": 3
// }
    } catch (error) {
        throw error;
    }
}

export const get_llm_by_id = async (llm_id) => {
    try {
        const response = axiosClient.get(`/llms/${llm_id}`);
        return response
    } catch (error) {
        throw error
    }
}

export const get_all_llms = async () => {
    try {
        const response = axiosClient.get('/llms/');
        return response
    } catch (error) {
        throw error;
    }
}