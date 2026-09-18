import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Layers, BarChart3, LogOut, Leaf, Database } from 'lucide-react';
import apiClient from '../api/client';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Dashboard', icon: Globe },
    { path: '/projects', label: 'Projects', icon: Layers },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  ];

  const handleSeed = async () => {
    try {
      await apiClient.post('/seed/');
      window.location.reload();
    } catch (err) {
      console.error('Seed failed:', err);
    }
  };

  return (
    <header className="glass-nav sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white decoration-none"
        >
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Leaf className="w-5 h-5 text-emerald-400" />
          </div>
          <span>
            Darukaa<span className="text-emerald-400">.Earth</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all decoration-none ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSeed}
          className="btn-secondary text-xs py-1.5 px-3 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-white"
          title="Seed initial carbon dataset"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          Seed Data
        </button>

        {user ? (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-semibold text-xs">
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-slate-200">
                  {user.full_name || user.email}
                </p>
                <p className="text-[10px] text-emerald-400 capitalize">{user.role}</p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary text-xs py-2 px-4 decoration-none">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
