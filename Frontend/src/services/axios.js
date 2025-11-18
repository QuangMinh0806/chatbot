import axios from "axios";
const Url = `https://chatbotbe.a2alab.vn`;
// const Url = `http://localhost:8000`;

const axiosClient = axios.create({
  baseURL: Url,
  withCredentials: true,
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Xử lý lỗi từ server
    if (error.response) {
      // Server trả về lỗi với status code
      const errorData = error.response.data;

      // Nếu server trả về format lỗi chuẩn
      if (errorData && errorData.error && errorData.message) {
        return Promise.reject(new Error(errorData.message));
      }

      // Nếu server trả về detail (FastAPI HTTPException format)
      if (errorData && errorData.detail) {
        return Promise.reject(new Error(errorData.detail));
      }

      // Fallback cho các format lỗi khác
      return Promise.reject(
        new Error(errorData.message || "Đã xảy ra lỗi từ server")
      );
    } else if (error.request) {
      // Lỗi network (không có response từ server)
      return Promise.reject(
        new Error(
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng."
        )
      );
    } else {
      // Lỗi khác
      return Promise.reject(
        new Error(error.message || "Đã xảy ra lỗi không xác định")
      );
    }
  }
);

export default axiosClient;
