import React, { useState } from 'react';
import { X, Layers, Plus } from 'lucide-react';
import apiClient from '../api/client';

export const ProjectModal = ({ isOpen, onClose, onProjectCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'Carbon Offset',
    country: 'India',
    region: '',
    status: 'Active',
    target_carbon_tco2e: 100000,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/projects/', {
        ...formData,
        target_carbon_tco2e: parseFloat(formData.target_carbon_tco2e),
      });
      onProjectCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg p-6 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Create Carbon & Biodiversity Project</h3>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Project Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Western Ghats Rain Forest Restoration"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Project Type</label>
            <select
              className="input-field"
              value={formData.project_type}
              onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
            >
              <option value="Carbon Offset">Carbon Offset</option>
              <option value="Biodiversity Conservation">Biodiversity Conservation</option>
              <option value="Regenerative Agriculture">Regenerative Agriculture</option>
              <option value="Coastal Blue Carbon">Coastal Blue Carbon</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Country</label>
              <input
                type="text"
                className="input-field"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Region / State
              </label>
              <input
                type="text"
                placeholder="e.g. Kerala"
                className="input-field"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Target Carbon (tCO2e)
            </label>
            <input
              type="number"
              className="input-field"
              value={formData.target_carbon_tco2e}
              onChange={(e) => setFormData({ ...formData, target_carbon_tco2e: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Detailed description of conservation goals and impact..."
              className="input-field"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="btn-secondary text-xs">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs">
              <Plus className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
