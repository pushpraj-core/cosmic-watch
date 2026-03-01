import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNEOStore = create((set) => ({
  neos: [],
  watchedNeos: [],
  loading: false,
  error: null,

  fetchNEOs: async (token) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/neo/list`);
      set({ neos: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchNEOsFromNASA: async (token) => {
    set({ loading: true, error: null });
    try {
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.post(`${API_URL}/neo/fetch`, {}, config);
      set({ neos: response.data.neos, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getWatchedNeos: async (token) => {
    set({ loading: true });
    try {
      const response = await axios.get(`${API_URL}/neo/watched/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ watchedNeos: response.data, loading: false });
      return response.data;
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  watchNeo: async (neoId, neoName, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/neo/watch`,
        { neoId, neoName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  unwatchNeo: async (neoId, token) => {
    try {
      const response = await axios.delete(`${API_URL}/neo/watch/${neoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set((state) => ({
        watchedNeos: state.watchedNeos.filter(neo => neo.neoId !== neoId)
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  getUpcomingApproaches: async () => {
    try {
      const response = await axios.get(`${API_URL}/neo/upcoming`);
      return response.data;
    } catch (error) {
      set({ error: error.message });
    }
  }
}));
