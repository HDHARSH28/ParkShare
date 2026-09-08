import api from './api';

export const getPriceRecommendation = async (payload) => {
  const res = await api.post('/smart/pricing/recommend', payload);
  return res.data;
};

export const getDemandForecast = async (params = {}) => {
  const res = await api.get('/smart/demand/forecast', { params });
  return res.data;
};

export const getSmartRecommendations = async (params = {}) => {
  const res = await api.get('/smart/recommendations', { params });
  return res.data;
};

export const getHostInsights = async () => {
  const res = await api.get('/smart/insights/host');
  return res.data;
};

export const evaluateSmartAdvisories = async () => {
  const res = await api.post('/smart/advisories/evaluate');
  return res.data;
};
