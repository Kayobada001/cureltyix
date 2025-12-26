import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Consultation, Doctor, Patient, User } from '../lib/supabase';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { Moon, Sun, LogOut, Activity, Clock, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ConsultationWithPatient extends Consultation {
  patient: Patient & { user: User };
}

export function DoctorDashboard() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [consultations, setConsultations] = useState<ConsultationWithPatient[]>([]);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationWithPatient | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [loading, setLoading] = useState(false);

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
        .eq('status', 'pending')
        .is('doctor_id', null)
        .order('priority', { ascending: false });

      const allConsultations = [
        ...(assignedConsultations || []),
        ...(pendingConsultations || []),
      ];

      setConsultations(allConsultations as ConsultationWithPatient[]);
    }
  };

  const handleAssignConsultation = async (consultationId: string) => {
    if (!doctor) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({
          doctor_id: doctor.id,
          status: 'assigned',
          updated_at: new Date().toISOString(),
        })
        .eq('id', consultationId);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error assigning consultation:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsultation = async () => {
    if (!selectedConsultation) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('consultations')
        .update({
          doctor_notes: doctorNotes,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedConsultation.id);

      if (error) throw error;

      setSelectedConsultation(null);
      setDoctorNotes('');
      fetchData();
    } catch (error) {
      console.error('Error updating consultation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={20} />;
      case 'assigned':
        return <Activity className="text-blue-500" size={20} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'cancelled':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const assignedConsultations = consultations.filter((c) => c.doctor_id === doctor?.id);
  const pendingConsultations = consultations.filter((c) => c.status === 'pending' && !c.doctor_id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Dr. <span className="font-semibold">{user?.full_name}</span>
            </span>
            {doctor && !doctor.is_verified && (
              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-semibold rounded-full">
                Pending Verification
              </span>
            )}
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and manage patient consultations</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <UserCheck className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assigned Cases</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{assignedConsultations.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Cases</h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{pendingConsultations.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {assignedConsultations.filter((c) => c.status === 'completed').length}
            </p>
          </div>
        </div>

        {pendingConsultations.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Available Consultations</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review and assign consultations to yourself</p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingConsultations.map((consultation) => (
                <div key={consultation.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(consultation.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {consultation.patient.user.full_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(consultation.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityColor(consultation.priority)}`}>
                      {consultation.priority}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                      {consultation.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{consultation.description}</p>
                  {consultation.ai_recommendation && (
                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-teal-900 dark:text-teal-200 mb-1">AI Recommendation</p>
                      <p className="text-sm text-teal-700 dark:text-teal-300">{consultation.ai_recommendation}</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleAssignConsultation(consultation.id)}
                    isLoading={loading}
                  >
                    <UserCheck size={16} className="mr-2" />
                    Assign to Me
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">My Consultations</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {assignedConsultations.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Activity className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 dark:text-gray-400">No assigned consultations</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Assign consultations from the available list above</p>
              </div>
            ) : (
              assignedConsultations.map((consultation) => (
                <div key={consultation.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(consultation.status)}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {consultation.patient.user.full_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(consultation.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getPriorityColor(consultation.priority)}`}>
                      {consultation.priority}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms:</p>
                    <div className="flex flex-wrap gap-2">
                      {consultation.symptoms.map((symptom, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{consultation.description}</p>
                  {consultation.ai_recommendation && (
                    <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-teal-900 dark:text-teal-200 mb-1">AI Recommendation</p>
                      <p className="text-sm text-teal-700 dark:text-teal-300">{consultation.ai_recommendation}</p>
                    </div>
                  )}
                  {consultation.doctor_notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Your Notes</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{consultation.doctor_notes}</p>
                    </div>
                  )}
                  {consultation.status !== 'completed' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedConsultation(consultation);
                        setDoctorNotes(consultation.doctor_notes || '');
                      }}
                    >
                      {consultation.doctor_notes ? 'Update Notes' : 'Add Notes & Complete'}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Complete Consultation
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Patient</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {selectedConsultation.patient.user.full_name}
                </p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {selectedConsultation.symptoms.map((symptom, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                    >
                      {symptom}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Doctor's Notes
                </label>
                <textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Enter your diagnosis and treatment recommendations..."
                  rows={6}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <Button
                onClick={handleUpdateConsultation}
                disabled={!doctorNotes.trim()}
                isLoading={loading}
              >
                Complete Consultation
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSelectedConsultation(null);
                  setDoctorNotes('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
