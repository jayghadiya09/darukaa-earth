import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '../api/client';
import { ProjectModal } from '../components/ProjectModal';
import { Layers, Plus, MapPin, Search, Loader2 } from 'lucide-react';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/projects/');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.project_type && p.project_type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="glass-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-emerald-400" />
            Carbon & Biodiversity Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage project portfolios, target emissions offsets, and spatial sites.
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs py-2 px-4">
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Filter projects by title, country, or type..."
          className="input-field pl-10 py-3"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mr-2" />
          <span>Loading project portfolios...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="glass-panel p-12 text-center text-slate-400">
          <p className="text-base text-slate-300 font-medium">No projects found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try another search query or create a new project above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="glass-panel p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="badge badge-active">{project.status}</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {project.region ? `${project.region}, ${project.country}` : project.country}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
                <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Project Type:</span>
                  <span className="text-emerald-400 font-medium">{project.project_type}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Sites:</span>
                  <span className="text-white font-semibold">{project.sites_count} sites</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Total Protected Area:</span>
                  <span className="text-white font-semibold">{project.total_area_ha} ha</span>
                </div>

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Target Offset:</span>
                  <span className="text-white font-semibold">
                    {project.target_carbon_tco2e?.toLocaleString()} tCO2e
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onProjectCreated={(newP) => setProjects([newP, ...projects])}
      />
    </div>
  );
};
