import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Leaf, ShieldCheck, TreePine, TrendingUp, Award } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const AnalyticsDashboard = ({ analyticsData }) => {
  const [activeTab, setActiveTab] = useState('carbon');

  if (!analyticsData || !analyticsData.records || analyticsData.records.length === 0) {
    return (
      <div className="glass-panel p-8 text-center text-slate-400">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
        <p className="text-lg font-medium text-slate-300">
          Select a project site to view analytics
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Detailed time-series carbon and biodiversity metrics will display here.
        </p>
      </div>
    );
  }

  const { site_name, area_hectares, records, latest_metrics } = analyticsData;

  const labels = records.map((r) =>
    new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  );

  // Chart datasets
  const carbonChartData = {
    labels,
    datasets: [
      {
        label: 'Carbon Stock (tCO2e)',
        data: records.map((r) => r.carbon_stock_tco2e),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10B981',
        pointRadius: 4,
      },
    ],
  };

  const biodiversityChartData = {
    labels,
    datasets: [
      {
        label: 'Biodiversity Health Index (0-100)',
        data: records.map((r) => r.biodiversity_index),
        borderColor: '#06B6D4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#06B6D4',
        pointRadius: 4,
        yAxisID: 'y',
      },
      {
        label: 'NDVI Vegetation Index (0-1)',
        data: records.map((r) => r.ndvi_index * 100), // Scaled to % for dual line overlay
        borderColor: '#F59E0B',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.35,
        pointRadius: 3,
        yAxisID: 'y',
      },
    ],
  };

  const biomassChartData = {
    labels,
    datasets: [
      {
        label: 'Biomass Density (t/ha)',
        data: records.map((r) => r.biomass_density_t_ha),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderRadius: 6,
      },
      {
        label: 'Canopy Cover (%)',
        data: records.map((r) => r.canopy_cover_pct),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94A3B8',
          font: { family: 'Inter', size: 12 },
        },
      },
      tooltip: {
        backgroundColor: '#0F172A',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 } },
      },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Site Header & Metrics Ribbon */}
      <div className="glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">{site_name}</h2>
              <span className="badge badge-active">Site Analytics</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Total Boundary Area:{' '}
              <span className="text-emerald-400 font-semibold">{area_hectares} Hectares</span>
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('carbon')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'carbon'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Carbon Stock
            </button>
            <button
              onClick={() => setActiveTab('biodiversity')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'biodiversity'
                  ? 'bg-cyan-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Biodiversity & NDVI
            </button>
            <button
              onClick={() => setActiveTab('biomass')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'biomass'
                  ? 'bg-amber-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Biomass & Canopy
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Carbon Sequestration</span>
              <Leaf className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">
              {latest_metrics?.carbon_stock_tco2e.toLocaleString() || '0'}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5">tCO2e total accumulated</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Biodiversity Index</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xl font-bold text-white">
              {latest_metrics?.biodiversity_index || '0'}{' '}
              <span className="text-xs font-normal text-slate-400">/ 100</span>
            </p>
            <p className="text-[11px] text-cyan-400 mt-0.5">Eco-Health Score</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">NDVI Vegetation</span>
              <TreePine className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-bold text-white">{latest_metrics?.ndvi_index || '0'}</p>
            <p className="text-[11px] text-amber-400 mt-0.5">
              Canopy Density {latest_metrics?.canopy_cover_pct}%
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">Key Species Count</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white">
              {latest_metrics?.species_observed_count || '0'}
            </p>
            <p className="text-[11px] text-purple-400 mt-0.5">Observed flora & fauna</p>
          </div>
        </div>
      </div>

      {/* Main Interactive Chart View */}
      <div className="glass-panel p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 capitalize">
          {activeTab} Performance Trend Over Time
        </h3>
        <div className="h-80 w-full">
          {activeTab === 'carbon' && <Line data={carbonChartData} options={chartOptions} />}
          {activeTab === 'biodiversity' && (
            <Line data={biodiversityChartData} options={chartOptions} />
          )}
          {activeTab === 'biomass' && <Bar data={biomassChartData} options={chartOptions} />}
        </div>
      </div>
    </div>
  );
};
