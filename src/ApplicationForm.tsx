import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { createApplication } from '../lib/crud.operations';
import { useCourses } from '../lib/hooks';

interface ApplicationFormProps {
  onSubmitSuccess?: () => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course_id: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { courses } = useCourses();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields (Name, Email, Message)');
      setLoading(false);
      return;
    }

    try {
      const result = await createApplication({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        course_id: formData.course_id || undefined,
        message: formData.message,
      });

      if (result.success) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          course_id: '',
          message: '',
        });

        // Send email notification to admin
        await sendAdminNotification(result.data);

        // Call success callback
        onSubmitSuccess?.();

        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || 'Failed to submit application');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Send email notification to admin
  const sendAdminNotification = async (application: any) => {
    try {
      // Call your email function here
      // This will be implemented with Supabase edge functions
      console.log('Email notification would be sent for application:', application.id);
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-green-900 mb-2">Application Submitted!</h3>
          <p className="text-green-700 mb-4">
            Thank you for your interest! We'll review your application and contact you soon.
          </p>
          <p className="text-green-600 text-sm">
            A confirmation has been sent to {formData.email}
          </p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
            >
              <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={loading}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              disabled={loading}
              required
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 (555) 123-4567"
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Course Interest Field */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Course Interest
            </label>
            <select
              name="course_id"
              value={formData.course_id}
              onChange={handleChange}
              disabled={loading || !courses?.length}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all disabled:opacity-50"
            >
              <option value="">-- Select a course --</option>
              {courses?.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.level})
                </option>
              ))}
            </select>
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us about your language learning goals and why you're interested in our school..."
              disabled={loading}
              required
              rows={5}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all disabled:opacity-50"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-brand-600/20 hover:shadow-xl hover:shadow-brand-600/30 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit Application
              </>
            )}
          </button>

          <p className="text-sm text-slate-500 text-center">
            <span className="text-red-500">*</span> Required fields
          </p>
        </form>
      )}
    </div>
  );
};
