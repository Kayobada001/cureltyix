import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../contexts/RoleContext';
import { supabase } from '../lib/supabase';
import { Logo } from '../components/Logo';
import { Bell, Users, Activity, Calendar, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { AdminDropdown } from '../components/AdminDropdown';
import { SettingsModal } from '../components/SettingsModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { NotificationsPanel } from '../components/NotificationsPanel';
import { UserManagementModal } from '../components/UserManagementModal';
import { SystemHealthModal } from '../components/SystemHealthModal';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const { user } = useAuth();
  const { switchRole } = useRole();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    verifiedDoctors: 0,
    pendingDoctors: 0,
    totalConsultations: 0,
    consultationsToday: 0,
    pendingConsultations: 0,
    completedConsultations: 0,
    urgentConsultations: 0,
    highPriorityConsultations: 0,
    mediumPriorityConsultations: 0,
    scheduledAppointments: 0,
    satisfactionRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount] = useState(3);

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showSystemHealth, setShowSystemHealth] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get patients count
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Get doctors stats
      const { data: doctors } = await supabase
        .from('doctors')
        .select('is_verified');
      
      const totalDoctors = doctors?.length || 0;
      const verifiedDoctors = doctors?.filter(d => d.is_verified).length || 0;
      const pendingDoctors = totalDoctors - verifiedDoctors;

      // Get consultations stats
      const { data: consultations } = await supabase
        .from('consultations')
        .select('status, priority, created_at');

      const totalConsultations = consultations?.length || 0;
      const today = new Date().toDateString();
      const consultationsToday = consultations?.filter(c => 
        new Date(c.created_at).toDateString() === today
      ).length || 0;

      const pendingConsultations = consultations?.filter(c => c.status === 'pending').length || 0;
      const completedConsultations = consultations?.filter(c => c.status === 'completed').length || 0;
      
      const urgentConsultations = consultations?.filter(c => c.priority === 'urgent').length || 0;
      const highPriorityConsultations = consultations?.filter(c => c.priority === 'high').length || 0;
      const mediumPriorityConsultations = consultations?.filter(c => c.priority === 'medium').length || 0;

      // Get appointments count
      const { count: scheduledCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled');

      // Get recent consultations for activity
      const { data: recentConsultations } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(
            user:users(full_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalPatients: patientsCount || 0,
        totalDoctors,
        verifiedDoctors,
        pendingDoctors,
        totalConsultations,
        consultationsToday,
        pendingConsultations,
        completedConsultations,
        urgentConsultations,
        highPriorityConsultations,
        mediumPriorityConsultations,
        scheduledAppointments: scheduledCount || 0,
        satisfactionRate: 94
      });

      setRecentActivity(recentConsultations || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (role: 'admin' | 'doctor' | 'patient') => {
    switchRole(role);
    if (role === 'doctor') {
      toast.success('Switched to Doctor view');
    } else if (role === 'patient') {
      toast.success('Switched to Patient view');
    } else {
      toast.success('Admin view');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/10';
      case 'high': return 'text-orange-400 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10';
      default: return 'text-green-400 bg-green-500/10';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white">
      {/* Navigation */}
      <nav className="bg-[#0f1420] border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="md" />
            <div className="text-xs text-gray-400 ml-2">AI Healthcare Platform</div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
              onClick={() => setShowNotifications(true)}
            >
              <Bell size={20} className="text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
              <div className="text-right">
                <div className="text-sm font-medium">Welcome, {user?.full_name?.split(' ')[0] || 'Admin'}</div>
                <div className="text-xs text-purple-400">Admin</div>
              </div>
              <AdminDropdown
                onViewSettings={() => setShowSettings(true)}
                onViewProfile={() => setShowEditProfile(true)}
                onViewUserManagement={() => setShowUserManagement(true)}
                onViewSystemHealth={() => setShowSystemHealth(true)}
                onSwitchRole={handleRoleSwitch}
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Overview of all patients and system metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0f1420] border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="text-purple-400" size={24} />
              </div>
              <h3 className="text-gray-400 text-sm">Total Patients</h3>
            </div>
            <p className="text-3xl font-bold text-purple-400">{stats.totalPatients}</p>
          </div>

          <div className="bg-[#0f1420] border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Activity className="text-blue-400" size={24} />
              </div>
              <div>
                <h3 className="text-gray-400 text-sm">Consultations</h3>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-400">{stats.consultationsToday}</p>
          </div>

          <div className="bg-[#0f1420] border border-teal-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-teal-500/10 rounded-lg">
                <Calendar className="text-teal-400" size={24} />
              </div>
              <h3 className="text-gray-400 text-sm">Scheduled</h3>
            </div>
            <p className="text-3xl font-bold text-teal-400">{stats.scheduledAppointments}</p>
          </div>

          <div className="bg-[#0f1420] border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="text-green-400" size={24} />
              </div>
              <h3 className="text-gray-400 text-sm">Satisfaction</h3>
            </div>
            <p className="text-3xl font-bold text-green-400">{stats.satisfactionRate}%</p>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#0f1420] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">System Overview</h2>
            <div className="grid grid-cols-3 gap-6">
              {/* Doctors */}
              <div>
                <h3 className="text-sm text-gray-400 mb-4">Doctors</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Total</span>
                    <span className="text-lg font-bold">{stats.totalDoctors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Verified</span>
                    <span className="text-lg font-bold text-teal-400">{stats.verifiedDoctors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Pending</span>
                    <span className="text-lg font-bold text-yellow-400">{stats.pendingDoctors}</span>
                  </div>
                </div>
              </div>

              {/* Consultations */}
              <div>
                <h3 className="text-sm text-gray-400 mb-4">Consultations</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Total</span>
                    <span className="text-lg font-bold">{stats.totalConsultations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Pending</span>
                    <span className="text-lg font-bold text-yellow-400">{stats.pendingConsultations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Completed</span>
                    <span className="text-lg font-bold text-green-400">{stats.completedConsultations}</span>
                  </div>
                </div>
              </div>

              {/* Priority */}
              <div>
                <h3 className="text-sm text-gray-400 mb-4">Priority</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Urgent</span>
                    <span className="text-lg font-bold text-red-400">{stats.urgentConsultations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">High</span>
                    <span className="text-lg font-bold text-orange-400">{stats.highPriorityConsultations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Medium</span>
                    <span className="text-lg font-bold text-yellow-400">{stats.mediumPriorityConsultations}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#0f1420] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Activity</h2>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500 mx-auto"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-800 last:border-0">
                    <div className={`p-1.5 rounded-lg ${getPriorityColor(activity.priority)}`}>
                      {activity.priority === 'urgent' ? (
                        <AlertCircle size={16} />
                      ) : activity.status === 'completed' ? (
                        <CheckCircle size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">
                        {activity.patient?.user?.full_name || 'Unknown Patient'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Consultation • {activity.priority}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTimeAgo(activity.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showUserManagement && <UserManagementModal onClose={() => setShowUserManagement(false)} />}
      {showSystemHealth && <SystemHealthModal onClose={() => setShowSystemHealth(false)} />}
    </div>
  );
}
