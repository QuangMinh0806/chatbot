import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true
});

axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;