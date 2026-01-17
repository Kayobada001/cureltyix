import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { Moon, Sun, Activity, Clock, CheckCircle, AlertCircle, UserCheck, Bell } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { DoctorDropdown } from '../components/DoctorDropdown';
import { SettingsModal } from '../components/SettingsModal';
import { EditProfileModal } from '../components/EditProfileModal';
import { DoctorScheduleModal } from '../components/DoctorScheduleModal';
import { DoctorNotificationsPanel } from '../components/DoctorNotificationsPanel';
import toast from 'react-hot-toast';

interface User {
  id: string;
  full_name: string;
  email: string;
}

interface Patient {
  id: string;
  user_id: string;
  user?: User;
}

interface Doctor {
  id: string;
  user_id: string;
  specialty?: string;
  is_verified: boolean;
}

interface Consultation {
  id: string;
  patient_id: string;
  doctor_id?: string;
  symptoms: string[];
  description: string;
  ai_recommendation?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  doctor_notes?: string;
}

interface ConsultationWithPatient extends Consultation {
  patient: Patient & { user: User };
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationWithPatient | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data: doctorData } = await supabase
      .from('doctors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setDoctor(doctorData);

    if (doctorData) {
      const { data: assignedConsultations } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(
            *,
            user:users(*)
          )
        `)
        .eq('doctor_id', doctorData.id)
        .order('created_at', { ascending: false });

      const { data: pendingConsultations } = await supabase
        .from('consultations')
        .select(`
          *,
          patient:patients(
            *,
            user:users(*)
          )
        `)
        .is('doctor_id', null)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const allConsultations = [
        ...(assignedConsultations || []),
        ...(pendingConsultations || [])
      ];

      setConsultations(allConsultations as ConsultationWithPatient[]);
    }
  };

  const handleAcceptConsultation = async (consultationId: string) => {
    if (!doctor) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ 
          doctor_id: doctor.id,
          status: 'assigned'
        })
        .eq('id', consultationId);

      if (error) throw error;

      toast.success('Consultation accepted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error accepting consultation:', error);
      toast.error('Failed to accept consultation');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsultation = async () => {
    if (!selectedConsultation || !doctorNotes.trim()) {
      toast.error('Please provide notes before completing');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ 
          doctor_notes: doctorNotes,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedConsultation.id);

      if (error) throw error;

      toast.success('Consultation completed successfully!');
      setSelectedConsultation(null);
      setDoctorNotes('');
      fetchData();
    } catch (error) {
      console.error('Error updating consultation:', error);
      toast.error('Failed to complete consultation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="text-yellow-400" size={20} />;
      case 'assigned': return <Activity className="text-blue-400" size={20} />;
      case 'completed': return <CheckCircle className="text-green-400" size={20} />;
      default: return <AlertCircle className="text-gray-400" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  const pendingCount = consultations.filter(c => c.status === 'pending' && !c.doctor_id).length;
  const assignedCount = consultations.filter(c => c.status === 'assigned' && c.doctor_id === doctor?.id).length;
  const completedCount = consultations.filter(c => c.status === 'completed' && c.doctor_id === doctor?.id).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0e1a]">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setShowNotifications(true)}
              className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <div className="text-sm font-medium">Dr. {user?.full_name?.split(' ')[0] || 'Doctor'}</div>
                <div className="text-xs text-teal-600 dark:text-teal-400">
                  {doctor?.specialty || 'General Practice'}
                </div>
              </div>
              <DoctorDropdown
                onViewSettings={() => setShowSettings(true)}
                onViewProfile={() => setShowEditProfile(true)}
                onViewSchedule={() => setShowSchedule(true)}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your consultations and patient care
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Requests</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Activity className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assigned</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{assignedCount}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{completedCount}</p>
          </div>
        </div>

        {/* Consultations List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Consultations</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consultations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 dark:text-gray-400">No consultations available</p>
              </div>
            ) : (
              consultations.map((consultation) => (
                <div key={consultation.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(consultation.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {consultation.patient?.user?.full_name || 'Unknown Patient'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(consultation.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityColor(consultation.priority)}`}>
                        {consultation.priority}
                      </span>
                      {!consultation.doctor_id && consultation.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleAcceptConsultation(consultation.id)}
                          disabled={loading}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <UserCheck size={16} className="mr-1" />
                          Accept
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                      {consultation.symptoms.map((symptom, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{consultation.description}</p>

                  {consultation.ai_recommendation && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">AI Recommendation</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{consultation.ai_recommendation}</p>
                    </div>
                  )}

                  {consultation.doctor_notes && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">Doctor's Notes</p>
                      <p className="text-sm text-green-700 dark:text-green-300">{consultation.doctor_notes}</p>
                    </div>
                  )}

                  {consultation.doctor_id === doctor?.id && consultation.status === 'assigned' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedConsultation(consultation);
                        setDoctorNotes(consultation.doctor_notes || '');
                      }}
                      className="mt-3"
                    >
                      Add Notes & Complete
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Notes Modal */}
      {selectedConsultation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Complete Consultation</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Doctor's Notes
              </label>
              <textarea
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                placeholder="Enter your diagnosis, treatment recommendations, and follow-up instructions..."
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedConsultation(null);
                  setDoctorNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateConsultation}
                disabled={loading || !doctorNotes.trim()}
              >
                Complete Consultation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showEditProfile && <EditProfileModal onClose={() => setShowEditProfile(false)} />}
      {showSchedule && <DoctorScheduleModal onClose={() => setShowSchedule(false)} />}
      {showNotifications && <DoctorNotificationsPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
