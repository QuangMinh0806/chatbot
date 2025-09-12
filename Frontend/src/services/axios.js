import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://chatbot_chatbot-fe:80/",
}); 

axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;