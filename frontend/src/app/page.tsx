'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Building2,
  ShieldCheck,
  UserCheck,
  Plus,
  Trash2,
  LogOut,
  FolderPlus,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  Users,
  Zap,
  Lock,
  Mail,
  KeyRound,
  Sparkles,
  LayoutDashboard,
  ShieldAlert,
  ArrowRight,
  Sun,
  Moon,
  GripVertical,
  Menu,
  X,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  companyId: string;
  companyName: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  _count?: { tasks: number };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeId?: string;
  assignee?: { id: string; name: string; email: string };
}

interface CompanyMember {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
}

export default function SaaSApp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Theme Mode State - DEFAULT: 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Mobile Navigation Drawer Toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Auth Form State
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('ADMIN');
  const [isRegister, setIsRegister] = useState(false);
  const [authError, setAuthError] = useState('');

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([]);

  // Drag and Drop State
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | null>(null);

  // Modals / Form State
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);

  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    // Load theme from localStorage, DEFAULT to 'dark'
    const savedTheme = localStorage.getItem('saas_theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme('dark');
      localStorage.setItem('saas_theme', 'dark');
    }
    fetchProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchCompanyMembers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProject && user) {
      fetchTasks(selectedProject.id);
    }
  }, [selectedProject]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('saas_theme', nextTheme);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('saas_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.get('/api/v1/auth/me');
      setUser(res.data.data);
    } catch {
      localStorage.removeItem('saas_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.post('/api/v1/auth/login', { email, password });
      localStorage.setItem('saas_token', res.data.data.token);
      setUser(res.data.data.user);
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Login gagal. Pastikan email & password benar.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await api.post('/api/v1/auth/register', {
        email,
        password,
        name,
        companyName,
        role,
      });
      localStorage.setItem('saas_token', res.data.data.token);
      setUser(res.data.data.user);
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Registrasi gagal.');
    }
  };

  const handleQuickPresetLogin = async (presetEmail: string) => {
    setAuthError('');
    try {
      const res = await api.post('/api/v1/auth/login', {
        email: presetEmail,
        password: 'password123',
      });
      localStorage.setItem('saas_token', res.data.data.token);
      setUser(res.data.data.user);
    } catch (err: any) {
      setAuthError(err.response?.data?.message || 'Quick login gagal. Pastikan database sudah di-push & seed!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('saas_token');
    setUser(null);
    setProjects([]);
    setTasks([]);
    setSelectedProject(null);
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/api/v1/projects');
      const list = res.data.data;
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0]);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCompanyMembers = async () => {
    try {
      const res = await api.get('/api/v1/users');
      setCompanyMembers(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchTasks = async (projectId: string) => {
    try {
      const res = await api.get(`/api/v1/projects/${projectId}/tasks`);
      setTasks(res.data.data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      const res = await api.post('/api/v1/projects', {
        name: newProjectName,
        description: newProjectDesc,
      });
      setNewProjectName('');
      setNewProjectDesc('');
      setShowProjectModal(false);
      fetchProjects();
      setSelectedProject(res.data.data);
      setActionSuccess('Project berhasil dibuat!');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Gagal membuat project');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Yakin ingin menghapus project ini?')) return;
    setActionError('');
    try {
      await api.delete(`/api/v1/projects/${projectId}`);
      setSelectedProject(null);
      fetchProjects();
      setActionSuccess('Project berhasil dihapus');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Gagal menghapus project');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setActionError('');
    try {
      await api.post(`/api/v1/projects/${selectedProject.id}/tasks`, {
        title: newTaskTitle,
        description: newTaskDesc,
        assigneeId: newTaskAssignee || undefined,
      });
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignee('');
      setShowTaskModal(false);
      fetchTasks(selectedProject.id);
      setActionSuccess('Task dibuat & Async Notification Job dikirim ke Queue!');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Gagal membuat task');
    }
  };

  const handleUpdateTaskStatus = async (task: Task, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!selectedProject) return;
    setActionError('');

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await api.patch(`/api/v1/projects/${selectedProject.id}/tasks/${task.id}`, {
        status: newStatus,
      });
      fetchTasks(selectedProject.id);
      setActionSuccess(`Task dipindahkan ke ${newStatus}`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      // Revert on error
      fetchTasks(selectedProject.id);
      setActionError(err.response?.data?.message || 'Gagal menggeser task');
    }
  };

  const handleDropOnColumn = (targetStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    setDragOverColumn(null);
    if (!draggingTaskId) return;

    const task = tasks.find((t) => t.id === draggingTaskId);
    if (task && task.status !== targetStatus) {
      handleUpdateTaskStatus(task, targetStatus);
    }
    setDraggingTaskId(null);
  };

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-700'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
          <p className="text-xs font-semibold opacity-70">Loading SaaS Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}>
        {/* Background Mesh */}
        {isDark ? (
          <>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
          </>
        ) : (
          <>
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none"></div>
          </>
        )}

        {/* Theme Toggle Button Floating */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
          <button
            onClick={toggleTheme}
            className={`cursor-pointer p-2.5 rounded-full border transition-all duration-200 shadow-md ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5 text-indigo-600" />}
          </button>
        </div>

        <div className={`w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-xl border relative z-10 transition-colors duration-300 ${
          isDark
            ? 'glass-panel-dark'
            : 'bg-white/95 backdrop-blur-xl border-slate-200/80 shadow-slate-200/60'
        }`}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`p-2.5 sm:p-3 rounded-2xl border ${isDark ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
              <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">
                Multi-Tenant SaaS Portal
              </h1>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Mini Project Management Engine</p>
            </div>
          </div>

          {/* Quick Preset Evaluator Box */}
          <div className={`mb-6 p-3.5 sm:p-4 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Evaluator Presets</span>
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-white text-slate-500 border-slate-200'}`}>
                Seeded Fixtures
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPresetLogin('admin@acme.com')}
                className={`cursor-pointer text-left text-xs p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-indigo-500/50 text-slate-200'
                    : 'bg-white hover:bg-indigo-50/60 border-slate-200/80 hover:border-indigo-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold truncate">Acme Corp — Alice</p>
                    <p className="text-[10px] opacity-70 truncate">ADMIN (Full Access)</p>
                  </div>
                </div>
                <span className="text-indigo-500 font-mono text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center font-medium shrink-0 ml-2">
                  <span className="hidden sm:inline">admin@acme.com</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPresetLogin('member@acme.com')}
                className={`cursor-pointer text-left text-xs p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-cyan-500/50 text-slate-200'
                    : 'bg-white hover:bg-cyan-50/60 border-slate-200/80 hover:border-cyan-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-1.5 bg-cyan-500/10 text-cyan-500 rounded-lg shrink-0">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold truncate">Acme Corp — Bob</p>
                    <p className="text-[10px] opacity-70 truncate">MEMBER (Assigned Only)</p>
                  </div>
                </div>
                <span className="text-cyan-500 font-mono text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center font-medium shrink-0 ml-2">
                  <span className="hidden sm:inline">member@acme.com</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPresetLogin('admin@stark.com')}
                className={`cursor-pointer text-left text-xs p-2.5 sm:p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                  isDark
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50 text-slate-200'
                    : 'bg-white hover:bg-emerald-50/60 border-slate-200/80 hover:border-emerald-300 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold truncate">Stark Industries — Tony</p>
                    <p className="text-[10px] opacity-70 truncate">ADMIN (Tenant B)</p>
                  </div>
                </div>
                <span className="text-emerald-500 font-mono text-[11px] group-hover:translate-x-0.5 transition-transform flex items-center font-medium shrink-0 ml-2">
                  <span className="hidden sm:inline">admin@stark.com</span> <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </button>
            </div>
          </div>

          {authError && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-2xl flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-3.5 sm:space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Company / Tenant Name</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                      className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                        isDark
                          ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                  <div className="relative">
                    <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                        isDark
                          ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium ${
                      isDark
                        ? 'bg-slate-900 border border-slate-800 text-slate-100'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  >
                    <option value="ADMIN">ADMIN (Full Tenant Management)</option>
                    <option value="MEMBER">MEMBER (View Projects & Assigned Tasks Only)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                    isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                    isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
            >
              <span>{isRegister ? 'Register Account & Tenant' : 'Sign In to SaaS Workspace'}</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setAuthError('');
              }}
              className="cursor-pointer text-xs font-semibold text-indigo-500 hover:underline transition"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register new tenant"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Responsive Top Navigation Bar */}
      <header className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors duration-300 ${
        isDark ? 'bg-slate-900/90 border-slate-800/80 shadow-md' : 'bg-white/90 border-slate-200/80 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className={`lg:hidden p-2 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
              title="Toggle Navigation Menu"
            >
              {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className={`p-2 rounded-xl border hidden sm:block ${isDark ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base truncate max-w-[140px] sm:max-w-none">{user.companyName}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono hidden sm:flex items-center gap-1 border ${
                  isDark ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  <ShieldCheck className="w-3 h-3 text-indigo-500" />
                  Tenant Scoped
                </span>
              </div>
              <p className={`text-[11px] sm:text-xs flex items-center gap-2 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className="font-medium truncate max-w-[120px] sm:max-w-none">{user.name}</span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1 border ${
                    user.role === 'ADMIN'
                      ? isDark
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                      : isDark
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
                        : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                  }`}
                >
                  {user.role}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition active:scale-95 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
            </button>

            <button
              onClick={handleLogout}
              className={`cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl border transition active:scale-95 ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 opacity-70" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
        {/* Sidebar: Projects List (Desktop & Mobile Drawer) */}
        <div className={`lg:col-span-3 p-5 rounded-2xl border shadow-xs flex flex-col gap-4 transition-all duration-300 ${
          mobileSidebarOpen ? 'block' : 'hidden lg:flex'
        } ${
          isDark ? 'glass-panel-dark' : 'bg-white border-slate-200/80'
        }`}>
          <div className={`flex items-center justify-between pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h2 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2 opacity-70">
              <FolderPlus className="w-4 h-4 text-indigo-500" />
              <span>Projects ({projects.length})</span>
            </h2>
            {user.role === 'ADMIN' && (
              <button
                onClick={() => setShowProjectModal(true)}
                className="cursor-pointer p-1.5 text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition"
                title="Create Project (Admin Only)"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-2 flex-1 max-h-60 lg:max-h-none overflow-y-auto">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  setSelectedProject(proj);
                  setMobileSidebarOpen(false);
                }}
                className={`cursor-pointer p-3.5 rounded-xl transition-all duration-200 flex items-center justify-between border ${
                  selectedProject?.id === proj.id
                    ? isDark
                      ? 'bg-indigo-950/60 border-indigo-500 text-indigo-100 font-semibold'
                      : 'bg-indigo-50/80 border-indigo-500/80 text-indigo-950 font-semibold'
                    : isDark
                      ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="truncate pr-2">
                  <p className="font-semibold text-sm truncate">{proj.name}</p>
                  {proj.description && (
                    <p className="text-xs font-normal opacity-70 truncate mt-0.5">{proj.description}</p>
                  )}
                </div>

                {user.role === 'ADMIN' && selectedProject?.id === proj.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(proj.id);
                    }}
                    className="cursor-pointer text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition"
                    title="Delete Project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {projects.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-6">No projects yet in this tenant.</p>
            )}
          </div>

          {/* Company Members Info */}
          <div className={`border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 opacity-70">
              <Users className="w-3.5 h-3.5 text-cyan-500" />
              <span>Tenant Users ({companyMembers.length})</span>
            </h3>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {companyMembers.map((m) => (
                <div key={m.id} className={`text-xs flex items-center justify-between py-1 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-50'} last:border-0`}>
                  <span className="truncate font-medium">{m.name}</span>
                  <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md border ${
                    isDark ? 'bg-slate-900 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel: Task Kanban Board */}
        <div className={`lg:col-span-9 p-4 sm:p-6 rounded-2xl border shadow-xs flex flex-col gap-6 transition-colors duration-300 ${
          isDark ? 'glass-panel-dark' : 'bg-white border-slate-200/80'
        }`}>
          {actionError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-xs rounded-xl flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-semibold">{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs rounded-xl flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
          )}

          {selectedProject ? (
            <>
              <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <span>{selectedProject.name}</span>
                  </h2>
                  <p className="text-xs font-medium opacity-70 mt-1">{selectedProject.description || 'No description provided.'}</p>
                </div>

                {user.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowTaskModal(true)}
                    className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create & Assign Task</span>
                  </button>
                )}
              </div>

              {/* Trello-Style Drag & Drop Kanban Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 flex-1">
                {/* TODO Column */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColumn('TODO');
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={() => handleDropOnColumn('TODO')}
                  className={`p-4 rounded-2xl border flex flex-col transition-all duration-200 ${
                    dragOverColumn === 'TODO' ? 'drop-target-active' : ''
                  } ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-3.5 pb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200/60'}`}>
                    <Circle className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-xs uppercase tracking-wider">TODO</span>
                    <span className={`ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-2xs'
                    }`}>
                      {tasks.filter((t) => t.status === 'TODO').length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 min-h-[150px]">
                    {tasks
                      .filter((t) => t.status === 'TODO')
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          user={user}
                          isDark={isDark}
                          isDragging={draggingTaskId === task.id}
                          onDragStart={() => setDraggingTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverColumn(null);
                          }}
                        />
                      ))}
                  </div>
                </div>

                {/* IN_PROGRESS Column */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColumn('IN_PROGRESS');
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={() => handleDropOnColumn('IN_PROGRESS')}
                  className={`p-4 rounded-2xl border flex flex-col transition-all duration-200 ${
                    dragOverColumn === 'IN_PROGRESS' ? 'drop-target-active' : ''
                  } ${
                    isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50/40 border-amber-200/60'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-3.5 pb-2 border-b ${isDark ? 'border-amber-900/40' : 'border-amber-200/60'}`}>
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>In Progress</span>
                    <span className={`ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isDark ? 'bg-amber-950 border-amber-800 text-amber-400' : 'bg-white border-amber-200 text-amber-700 shadow-2xs'
                    }`}>
                      {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 min-h-[150px]">
                    {tasks
                      .filter((t) => t.status === 'IN_PROGRESS')
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          user={user}
                          isDark={isDark}
                          isDragging={draggingTaskId === task.id}
                          onDragStart={() => setDraggingTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverColumn(null);
                          }}
                        />
                      ))}
                  </div>
                </div>

                {/* DONE Column */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColumn('DONE');
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={() => handleDropOnColumn('DONE')}
                  className={`p-4 rounded-2xl border flex flex-col transition-all duration-200 ${
                    dragOverColumn === 'DONE' ? 'drop-target-active' : ''
                  } ${
                    isDark ? 'bg-emerald-950/20 border-emerald-900/40' : 'bg-emerald-50/40 border-emerald-200/60'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-3.5 pb-2 border-b ${isDark ? 'border-emerald-900/40' : 'border-emerald-200/60'}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className={`font-bold text-xs uppercase tracking-wider ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>Completed</span>
                    <span className={`ml-auto text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${
                      isDark ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-white border-emerald-200 text-emerald-700 shadow-2xs'
                    }`}>
                      {tasks.filter((t) => t.status === 'DONE').length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 min-h-[150px]">
                    {tasks
                      .filter((t) => t.status === 'DONE')
                      .map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          user={user}
                          isDark={isDark}
                          isDragging={draggingTaskId === task.id}
                          onDragStart={() => setDraggingTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverColumn(null);
                          }}
                        />
                      ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-500 py-16">
              <Building2 className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-semibold">Select or create a project to view tasks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Create Project */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border p-6 rounded-3xl w-full max-w-md shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-indigo-500" />
              <span>Create New Project</span>
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Project Name</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Next.js App Router Migration"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                    isDark ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Brief description of project goals..."
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                    isDark ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className={`cursor-pointer px-4 py-2.5 text-xs font-semibold rounded-xl transition ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md shadow-indigo-600/20"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Create Task */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`border p-6 rounded-3xl w-full max-w-md shadow-2xl ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Create Task & Queue Async Job</span>
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Task Title</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Implement JwtAuthGuard"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                    isDark ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Task scope details..."
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all ${
                    isDark ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  Assignee (Triggers Notification Async Queue)
                </label>
                <select
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium ${
                    isDark ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white'
                  }`}
                >
                  <option value="">-- Unassigned --</option>
                  {companyMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className={`cursor-pointer px-4 py-2.5 text-xs font-semibold rounded-xl transition ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition shadow-md shadow-indigo-600/20"
                >
                  Create & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  user,
  isDark,
  isDragging,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  user: User;
  isDark: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const isAssignedToMe = task.assigneeId === user.id;
  const canEdit = user.role === 'ADMIN' || isAssignedToMe;

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => {
        if (!canEdit) return;
        e.dataTransfer.setData('text/plain', task.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className={`p-4 rounded-2xl border text-xs flex flex-col gap-3 transition-all duration-200 ${
        isDragging ? 'opacity-40 scale-95 border-indigo-500' : ''
      } ${
        canEdit ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      } ${
        isDark
          ? 'glass-card border-slate-800/80 hover:border-slate-700 text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs hover:shadow-md hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold leading-snug flex-1">{task.title}</p>
        {canEdit ? (
          <GripVertical className="w-4 h-4 opacity-40 shrink-0 hover:opacity-100 transition text-slate-400" />
        ) : (
          <Lock className="w-3.5 h-3.5 opacity-40 shrink-0 text-slate-400" />
        )}
      </div>

      {task.description && <p className="opacity-70 text-[11px] line-clamp-2 leading-relaxed">{task.description}</p>}

      <div className={`pt-2.5 border-t flex items-center justify-between text-[10px] ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
        <span
          className={`px-2.5 py-1 rounded-lg font-mono flex items-center gap-1.5 font-medium ${
            task.assignee
              ? isAssignedToMe
                ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 font-bold'
                : isDark
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              : 'opacity-50 border border-transparent'
          }`}
        >
          <UserCheck className="w-3 h-3" />
          {task.assignee ? task.assignee.name : 'Unassigned'}
        </span>

        {!canEdit && (
          <span className="opacity-40 italic text-[10px] font-medium">
            Read-only
          </span>
        )}
      </div>
    </div>
  );
}
