import axios from "axios";

const API =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getBlogs = () =>
  axios.get(`${API}/api/blogs`);

export const getBlog = (slug) =>
  axios.get(`${API}/api/blogs/${slug}`);

export const createBlog = (data, token) =>
  axios.post(`${API}/api/blogs`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const updateBlog = (id, data, token) =>
  axios.put(`${API}/api/blogs/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

export const deleteBlog = (id, token) =>
  axios.delete(`${API}/api/blogs/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });