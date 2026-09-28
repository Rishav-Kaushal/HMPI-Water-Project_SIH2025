import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hmpi_token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("hmpi_token");
      localStorage.removeItem("hmpi_user");
    }
    return Promise.reject(error);
  }
);

export const waterAPI = {
  health: () => api.get("/api/health/"),
  dashboard: () => api.get("/api/dashboard/"),
  samples: (params = {}) => api.get("/api/samples/", { params }),
  sample: (id) => api.get(`/api/samples/${id}/`),
  createSample: (data) => api.post("/api/samples/", data),
  updateSample: (id, data) => api.put(`/api/samples/${id}/`, data),
  deleteSample: (id) => api.delete(`/api/samples/${id}/`),
  calculate: (data) => api.post("/api/calculate/", data),
  standards: () => api.get("/api/standards/"),
  recalculate: (id) => api.post(`/api/samples/${id}/recalculate/`),
  login: (data) => api.post("/api/auth/login/", data),
  me: () => api.get("/api/auth/me/"),
  uploadCsv: (file) => {
    const body = new FormData();
    body.append("file", file);
    return api.post("/api/upload-csv/", body, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  exportCsv: () => api.get("/api/export-csv/", { responseType: "blob" }),
};

export default api;
