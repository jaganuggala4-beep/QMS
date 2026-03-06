/**
 * Role-specific Login Page
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../store/auth';
import { Shield, UserCheck, Phone, Eye, EyeOff, ArrowLeft, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const roleConfig = {
  admin: {
    title: 'Administrator',
    subtitle: 'System Control Center',
    icon: <Shield size={28} />,
    gradient: 'from-blue-600 to-blue-800',
    bg: 'from-blue-950 to-slate-900',
    hint: 'Use assigned enterprise credentials.',
    color: 'blue',
  },
  qc: {
    title: 'QC Officer',
    subtitle: 'Quality Controller Portal',
    icon: <UserCheck size={28} />,
    gradient: 'from-indigo-600 to-indigo-800',
    bg: 'from-indigo-950 to-slate-900',
    hint: 'Use credentials created by Admin.',
    color: 'indigo',
  },
  agent: {
    title: 'Agent',
    subtitle: 'Agent Portal',
    icon: <Phone size={28} />,
    gradient: 'from-slate-600 to-slate-800',
    bg: 'from-slate-900 to-gray-900',
    hint: 'Use credentials created by Admin.',
    color: 'slate',
  },
};

export default function Login() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const config = roleConfig[role as keyof typeof roleConfig];

  useEffect(() => {
    // Redirect if already logged in
    if (currentUser) {
      navigate(`/${currentUser.role}`, { replace: true });
    }
  }, [currentUser, navigate]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white">Invalid role. <Link to="/" className="text-blue-400">Go back</Link></p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 400)); // simulate network delay

    const user = await login(username.trim(), password);
    setLoading(false);

    if (!user) {
      setError('Invalid username or password. Please try again.');
      return;
    }

    if (user.role !== role) {
      setError(`This account does not have ${role} access. Please use the correct login portal.`);
      return;
    }

    toast.success(`Welcome back, ${user.fullName}!`);
    navigate(`/${user.role}`, { replace: true });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bg} flex`}>
      {/* Left Panel */}
      <div className={`hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br ${config.gradient} relative overflow-hidden`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white"
              style={{
                width: `${(i + 1) * 80}px`,
                height: `${(i + 1) * 80}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>

        <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm">Back to Home</span>
        </Link>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl">
            {config.icon}
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">{config.title}</h1>
          <p className="text-white/70 text-lg">{config.subtitle}</p>
          <div className="mt-8 space-y-3">
            {['Secure access to your workspace', 'Real-time data & analytics', 'Permanent data persistence'].map(f => (
              <div key={f} className="flex items-center gap-3 text-white/80">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">✓</span>
                </div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs">QMS Portal v2.0 — Enterprise Quality Management</p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile back button */}
          <Link to="/" className="lg:hidden flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft size={18} />
            <span className="text-sm">Back to Home</span>
          </Link>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className={`w-14 h-14 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center text-white mb-5 shadow-lg`}>
              {config.icon}
            </div>

            <h2 className="text-2xl font-bold text-white mb-1">Sign In</h2>
            <p className="text-slate-400 text-sm mb-6">
              Access your {config.title} workspace
            </p>

            {/* Demo credentials hint */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-5 flex items-start gap-2">
              <AlertCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300/80 text-xs">{config.hint}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-slate-500 text-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 pr-11 text-white placeholder-slate-500 text-sm
                      focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r ${config.gradient} text-white py-3 rounded-lg font-medium text-sm
                  flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2`}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={16} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-600 text-xs mt-6">
            © 2026 QMS Portal — All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
