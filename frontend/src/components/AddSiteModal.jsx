import React, { useState } from 'react';
import { X, MapPin, Plus } from 'lucide-react';
import apiClient from '../api/client';

export const AddSiteModal = ({ isOpen, onClose, drawnFeature, projects = [], onSiteCreated }) => {
  const [formData, setFormData] = useState({
    project_id: projects[0]?.id || '',
    name: '',
    description: '',
    habitat_type: 'Tropical Forest',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !drawnFeature) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/sites/', {
        project_id: parseInt(formData.project_id || projects[0]?.id),
        name: formData.name,
        description: formData.description,
        habitat_type: formData.habitat_type,
        boundary_geojson: drawnFeature,
      });
      onSiteCreated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add geospatial site polygon.');
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

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Save Drawn Polygon Site</h3>
            <p className="text-xs text-emerald-400 font-medium">
              ✨ Polygon geometry detected with automated area calculation
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Assign to Project *
            </label>
            <select
              required
              className="input-field"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Site Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Northern Reserve Canopy Zone"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Habitat Type</label>
            <select
              className="input-field"
              value={formData.habitat_type}
              onChange={(e) => setFormData({ ...formData, habitat_type: e.target.value })}
            >
              <option value="Tropical Forest">Tropical Forest</option>
              <option value="Mangrove Wetland">Mangrove Wetland</option>
              <option value="Grassland Savannah">Grassland Savannah</option>
              <option value="Montane Shola">Montane Shola</option>
              <option value="Agroforestry Belt">Agroforestry Belt</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Site specific ecological observations..."
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
              {loading ? 'Saving Site...' : 'Save Site Polygon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
