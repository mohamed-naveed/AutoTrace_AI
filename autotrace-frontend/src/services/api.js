/**
 * api.js — Centralised API client for AutoTrace AI
 * All endpoints point to /api/v1/estimates/* (proxied to FastAPI backend)
 */
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '';
const BASE = `${API_URL}/api/v1/estimates`;

const api = {
    // POST  /api/v1/estimates/  — run pipeline and save
    createEstimate: (payload) => axios.post(`${BASE}/`, payload),

    // GET   /api/v1/estimates/projects — list projects collection
    getProjects: () => axios.get(`${BASE}/projects`),

    // GET   /api/v1/estimates/  — list cost_estimates collection
    getEstimates: () => axios.get(`${BASE}/`),

    // GET   /api/v1/estimates/dna — list cost_dna collection
    getDNA: () => axios.get(`${BASE}/dna`),

    // GET   /api/v1/estimates/:id/dna — single project DNA
    getProjectDNA: (projectId) => axios.get(`${BASE}/${projectId}/dna`),

    // POST  /api/v1/replay/:id — Run a what-if scenario on past DNA
    runReplay: (projectId, overrides) => axios.post(`/api/v1/replay/${projectId}`, overrides),
}

export default api
