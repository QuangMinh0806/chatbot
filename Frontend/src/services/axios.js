import axios from "axios";
const Url = `https://chatbotbe.haduyson.com`;
console.log("API URL:", Url);
const axiosClient = axios.create({
    baseURL: Url,
    withCredentials : true
}); 

axiosClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        return Promise.reject(error.response?.data || error);
    }
);

export default axiosClient;