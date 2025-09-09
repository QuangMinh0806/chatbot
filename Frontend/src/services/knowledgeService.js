import axiosClient from './axios';

export const getKnowledgeById  = async () => {
    try {
        console.log("aaaaaaa")
        const response = await axiosClient.get('/knowledge-base');
        console.log(response)
        return response;
    } catch (error) {
        throw error;
    }
};



export const postKnowledge  = async (data) => {
    try {
        const response = await axiosClient.get('/knowledge-base', data);
        console.log(response)
        return response;
    } catch (error) {
        throw error;
    }
};



export const updateKnowledge   = async (id, data) => {
    try {
        console.log("aaaaaaa")
        const response = await axiosClient.get('/knowledge-base');
        console.log(response)
        return response;
    } catch (error) {
        throw error;
    }
};




