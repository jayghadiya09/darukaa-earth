import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { InteractiveMap } from '../components/InteractiveMap';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { ProjectModal } from '../components/ProjectModal';
import { AddSiteModal } from '../components/AddSiteModal';
import { Layers, MapPin, Globe, Leaf, Plus, Search, TreePine, Loader2 } from 'lucide-react';

export const DashboardPage = () => {
  const [projects, setProjects] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [siteAnalytics, setSiteAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Map Draw
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [drawnFeature, setDrawnFeature] = useState(null);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapControlsRef = React.useRef(null);

  const fetchSiteAnalytics = useCallback(async (siteId) => {
    try {
      const res = await apiClient.get(`/analytics/site/${siteId}`);
      setSiteAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch site analytics:', err);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        apiClient.get('/projects/'),
        apiClient.get('/sites/'),
      ]);
      setProjects(pRes.data);
      setSites(sRes.data);

      if (sRes.data.length > 0) {
        setSelectedSite(sRes.data[0]);
        await fetchSiteAnalytics(sRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchSiteAnalytics]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    fetchSiteAnalytics(site.id);
  };

  const handlePolygonDrawn = (feature) => {
    setIsDrawingActive(false);
    setDrawnFeature(feature);
  };

  const handleStartDrawing = () => {
    setIsDrawingActive(true);
    if (mapControlsRef.current?.startDrawing) {
      mapControlsRef.current.startDrawing();
    }
  };

  const handleSiteCreated = (newSite) => {
    setSites((prev) => [...prev, newSite]);
    setSelectedSite(newSite);
    fetchSiteAnalytics(newSite.id);
    setDrawnFeature(null);
    setIsDrawingActive(false);
  };

  const handleProjectCreated = (newProject) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  // Stats
  const totalProjects = projects.length;
  const totalSites = sites.length;
  const totalAreaHa = sites.reduce((sum, s) => sum + (s.area_hectares || 0), 0).toFixed(1);
  const totalCarbonSequestration = sites
    .reduce((sum, s) => sum + (s.latest_carbon_stock || 0), 0)
    .toLocaleString();

  const filteredSites = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.habitat_type && s.habitat_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Overview Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Projects
            </p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalProjects}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Geospatial Sites
            </p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalSites}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <TreePine className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Area (ha)
            </p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalAreaHa}</h3>
          </div>
        </div>

        <div className="glass-panel p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Carbon (tCO2e)
            </p>
            <h3 className="text-2xl font-bold text-white mt-0.5">{totalCarbonSequestration}</h3>
          </div>
        </div>
      </div>

      {/* Main Map & Sites Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Map (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Interactive Geospatial Map</h2>
              {loading && <Loader2 className="w-4 h-4 animate-spin text-emerald-400 ml-1" />}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartDrawing}
                className={`text-xs py-1.5 px-3 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDrawingActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse'
                    : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                }`}
                title="Click on the map to draw a new polygon site"
              >
                <span>✏️ Draw Site Polygon</span>
              </button>

              <button
                onClick={() => setIsProjectModalOpen(true)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
            </div>
          </div>

          {isDrawingActive && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs flex items-center justify-between shadow-lg">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <strong>Draw Mode Active:</strong> Click points on the map to place polygon
                vertices. Double-click to finish.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsDrawingActive(false);
                  mapControlsRef.current?.deleteAll?.();
                }}
                className="text-[11px] underline text-slate-300 hover:text-white ml-3 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="h-[460px]">
            <InteractiveMap
              sites={sites}
              selectedSite={selectedSite}
              onSiteSelect={handleSiteSelect}
              onPolygonDrawn={handlePolygonDrawn}
              onInitDraw={(ctrls) => {
                mapControlsRef.current = ctrls;
              }}
            />
          </div>
        </div>

        {/* Sites Sidebar Listing (1 Col) */}
        <div className="glass-panel p-5 flex flex-col h-[530px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Project Sites ({filteredSites.length})
            </h3>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search site or habitat..."
              className="input-field pl-9 py-2 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Site List */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {filteredSites.map((site) => {
              const isSelected = selectedSite && selectedSite.id === site.id;
              return (
                <div
                  key={site.id}
                  onClick={() => handleSiteSelect(site)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{site.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-medium border border-slate-700">
                      {site.area_hectares} ha
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {site.habitat_type || 'Tropical Forest'}
                  </p>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">
                      Carbon:{' '}
                      <strong className="text-slate-200">{site.latest_carbon_stock} tCO2e</strong>
                    </span>
                    <span className="text-slate-400">
                      Score:{' '}
                      <strong className="text-cyan-400">
                        {site.latest_biodiversity_index}/100
                      </strong>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Analytics Visualization */}
      <AnalyticsDashboard analyticsData={siteAnalytics} />

      {/* Modals */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />

      <AddSiteModal
        isOpen={!!drawnFeature}
        onClose={() => setDrawnFeature(null)}
        drawnFeature={drawnFeature}
        projects={projects}
        onSiteCreated={handleSiteCreated}
      />
    </div>
  );
};
