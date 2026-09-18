import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, LogIn, Lock, Mail } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@darukaa.earth');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md p-8 relative">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-3">
            <Leaf className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Welcome to Darukaa<span className="text-emerald-400">.Earth</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to manage geospatial carbon & biodiversity projects
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                className="input-field pl-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                className="input-field pl-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 mt-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError(null);
              try {
                await login('admin@darukaa.earth', 'password123');
                navigate('/');
              } catch (err) {
                setError(err.response?.data?.detail || 'Demo login failed');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
          >
            <span>🚀 1-Click Instant Demo Login (Administrator)</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
            Create an Administrator Account
          </Link>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
          🔑 <strong>Demo Admin Credentials:</strong>
          <br />
          Email: <code className="text-emerald-300">admin@darukaa.earth</code>
          <br />
          Password: <code className="text-emerald-300">password123</code>
        </div>
      </div>
    </div>
  );
};
