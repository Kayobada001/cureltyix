import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, User, Doctor, Patient, Consultation } from '../lib/supabase';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { Moon, Sun, LogOut, Users, UserCheck, Activity, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface DoctorWithUser extends Doctor {
  user: User;
}

export function AdminDashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<DoctorWithUser[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'doctors' | 'statistics'>('statistics');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: usersData } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(usersData || []);

    const { data: doctorsData } = await supabase
      .from('doctors')
      .select(`
        *,
        user:users(*)
      `)
      .order('created_at', { ascending: false });

    setDoctors(doctorsData as DoctorWithUser[] || []);

    const { data: patientsData } = await supabase
      .from('patients')
      .select('*');

    setPatients(patientsData || []);

    const { data: consultationsData } = await supabase
      .from('consultations')
      .select('*');

    setConsultations(consultationsData || []);
  };

  const handleVerifyDoctor = async (doctorId: string, isVerified: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('doctors')
        .update({ is_verified: isVerified })
        .eq('id', doctorId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error updating doctor verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="text-teal-600 dark:text-teal-400" size={20} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Admin: <span className="font-semibold">{user?.full_name}</span>
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, doctors, and system settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Users</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{users.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <UserCheck className="text-teal-600 dark:text-teal-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doctors</h3>
            </div>
            <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{doctors.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {doctors.filter(d => d.is_verified).length} verified
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Users className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Patients</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{patients.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Activity className="text-orange-600 dark:text-orange-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Consultations</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{consultations.length}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('statistics')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'statistics'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'users'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                All Users
              </button>
              <button
                onClick={() => setActiveTab('doctors')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'doctors'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Doctor Management
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Consultation Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {consultations.filter(c => c.status === 'pending').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Assigned</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {consultations.filter(c => c.status === 'assigned').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {consultations.filter(c => c.status === 'completed').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {consultations.filter(c => c.status === 'cancelled').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Priority Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Urgent</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {consultations.filter(c => c.priority === 'urgent').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">High</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {consultations.filter(c => c.priority === 'high').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Medium</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {consultations.filter(c => c.priority === 'medium').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {consultations.filter(c => c.priority === 'low').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : user.role === 'doctor'
                            ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Doctor Management</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Verify and manage doctor accounts</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {doctors.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 dark:text-gray-400">No doctors registered yet</p>
                </div>
              ) : (
                doctors.map((doctor) => (
                  <div key={doctor.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            Dr. {doctor.user.full_name}
                          </h3>
                          {doctor.is_verified ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-semibold rounded-full">
                              Verified
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{doctor.user.email}</p>
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Specialization</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{doctor.specialization}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Experience</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{doctor.years_of_experience} years</p>
                          </div>
                        </div>
                        {doctor.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{doctor.bio}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <Button
                          size="sm"
                          variant={doctor.is_verified ? 'danger' : 'primary'}
                          onClick={() => handleVerifyDoctor(doctor.id, !doctor.is_verified)}
                          isLoading={loading}
                        >
                          {doctor.is_verified ? 'Revoke' : 'Verify'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
