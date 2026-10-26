import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  GraduationCap,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Save,
  X,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile: authProfile, updateProfile } = useAuth();
  const context = useOutletContext() || {};
  const { refreshProfile } = context;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Profile fields
  const [fullName, setFullName] = useState(authProfile?.full_name || 'Student');
  const [educationLevel, setEducationLevel] = useState(authProfile?.education_level || 'Undergraduate');

  // Backup values for cancel action
  const [initialFullName, setInitialFullName] = useState(authProfile?.full_name || 'Student');
  const [initialEducationLevel, setInitialEducationLevel] = useState(
    authProfile?.education_level || 'Undergraduate'
  );

  // Feedback states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial profile from localStorage/context
  useEffect(() => {
    try {
      const stored = localStorage.getItem('neuramind.student_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        setFullName(parsed.full_name || 'Student');
        setEducationLevel(parsed.education_level || 'Undergraduate');
        setInitialFullName(parsed.full_name || 'Student');
        setInitialEducationLevel(parsed.education_level || 'Undergraduate');
      }
    } catch (err) {
      console.warn('Could not read profile from localStorage:', err);
    }
  }, []);

  const handleCancel = () => {
    setFullName(initialFullName);
    setEducationLevel(initialEducationLevel);
    setIsEditing(false);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const trimmedName = fullName.trim() || 'Student';
      const updatedData = {
        full_name: trimmedName,
        education_level: educationLevel,
      };

      if (typeof updateProfile === 'function') {
        updateProfile(updatedData);
      } else {
        localStorage.setItem('neuramind.student_profile', JSON.stringify(updatedData));
      }

      setInitialFullName(trimmedName);
      setInitialEducationLevel(educationLevel);
      setIsEditing(false);
      setSuccessMessage('Profile details updated successfully.');

      // Refresh parent shell layout immediately
      if (typeof refreshProfile === 'function') {
        refreshProfile();
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage(err.message || 'Failed to save profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset student profile and clear local conversation history?')) {
      const defaultData = {
        full_name: 'Student',
        education_level: 'Undergraduate',
        email: 'student@neuramind.app',
      };
      if (typeof updateProfile === 'function') {
        updateProfile(defaultData);
      }
      setFullName('Student');
      setEducationLevel('Undergraduate');
      setInitialFullName('Student');
      setInitialEducationLevel('Undergraduate');
      const userId = user?.id || 'local-student';
      localStorage.removeItem(`neuramind.chat_sessions.${userId}`);
      localStorage.removeItem(`neuramind.chat_messages.${userId}`);
      if (typeof refreshProfile === 'function') {
        refreshProfile();
      }
      setSuccessMessage('Workspace and profile reset to defaults.');
    }
  };

  const initials = (fullName || 'Student').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Student Profile
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Manage your academic preferences and personalize your learning experience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-primary-300 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/30 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Messages */}
      {successMessage && (
        <div
          role="status"
          className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 shadow-lg"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm flex items-center gap-3 shadow-lg"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* 2. Hero Profile Identity Card */}
      <section className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-dark-900 via-dark-900/90 to-primary-950/40 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-violet p-1 shadow-xl shadow-primary-500/20 shrink-0 flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{initials}</span>
          </div>

          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                {fullName || 'Student'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Student
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-primary-400" />
                <span>{educationLevel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>{user?.email || 'student@neuramind.app'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Editable Profile Form */}
      <section className="p-6 sm:p-8 rounded-3xl bg-dark-900/60 border border-white/10 shadow-xl backdrop-blur-xl">
        <h3 className="text-sm sm:text-base font-bold text-white mb-6 flex items-center gap-2">
          <User className="w-4 h-4 text-primary-400" />
          <span>Academic Information</span>
        </h3>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label htmlFor="full-name" className="block text-xs font-semibold text-slate-300 mb-2">
                Full Name
              </label>
              <input
                id="full-name"
                type="text"
                disabled={!isEditing || saving}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-xl bg-dark-950/60 border border-white/10 disabled:opacity-60 disabled:bg-dark-950/30 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
              />
            </div>

            {/* Education Level */}
            <div>
              <label
                htmlFor="education-level"
                className="block text-xs font-semibold text-slate-300 mb-2"
              >
                Education Level
              </label>
              <select
                id="education-level"
                disabled={!isEditing || saving}
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-950/60 border border-white/10 disabled:opacity-60 disabled:bg-dark-950/30 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all cursor-pointer"
              >
                <option value="Middle School" className="bg-dark-900 text-white">
                  Middle School
                </option>
                <option value="High School" className="bg-dark-900 text-white">
                  High School
                </option>
                <option value="Undergraduate" className="bg-dark-900 text-white">
                  Undergraduate
                </option>
                <option value="Graduate" className="bg-dark-900 text-white">
                  Graduate
                </option>
                <option value="Lifelong Learner" className="bg-dark-900 text-white">
                  Lifelong Learner
                </option>
              </select>
            </div>
          </div>

          {/* Action buttons during edit */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-primary-600 to-accent-violet hover:from-primary-500 hover:to-primary-600 disabled:opacity-50 rounded-xl shadow-lg shadow-primary-500/25 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </section>

      {/* 4. Security & Workspace Status */}
      <section className="p-6 rounded-3xl bg-dark-900/40 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Open Access & Local Storage</p>
            <p className="text-xs text-slate-400">
              No authentication required. All chat history is saved securely in your browser.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Workspace</span>
        </button>
      </section>
    </div>
  );
}
