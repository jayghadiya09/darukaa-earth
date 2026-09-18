import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { BarChart3, MapPin, Loader2 } from 'lucide-react';

export const AnalyticsPage = () => {
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (siteId) => {
    try {
      const res = await apiClient.get(`/analytics/site/${siteId}`);
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Failed to load site analytics:', err);
    }
  }, []);

  const fetchSites = useCallback(async () => {
    try {
      const res = await apiClient.get('/sites/');
      setSites(res.data);
      if (res.data.length > 0) {
        setSelectedSiteId(res.data[0].id);
        await fetchAnalytics(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sites for analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  const handleSelectChange = (e) => {
    const id = e.target.value;
    setSelectedSiteId(id);
    fetchAnalytics(id);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            Geospatial Analytics & Performance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deep-dive into site time-series trends, biomass density, and biodiversity health scores.
          </p>
        </div>

        {/* Site Selector Dropdown */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <select
            className="input-field py-2 px-3 text-xs w-64"
            value={selectedSiteId}
            onChange={handleSelectChange}
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name} ({site.habitat_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mr-2" />
          <span>Loading geospatial analytics...</span>
        </div>
      ) : (
        <AnalyticsDashboard analyticsData={analyticsData} />
      )}
    </div>
  );
};
