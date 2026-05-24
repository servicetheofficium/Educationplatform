import React from 'react';
import { motion } from 'motion/react';
import { LogOut, BarChart3, Users, BookOpen, Settings } from 'lucide-react';
import { logout } from './auth';
import { useCourses } from './hooks';

interface AdminDashboardProps {
  userName: string;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ userName, onLogout }) => {
  const { courses } = useCourses();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    onLogout();
  };

  const stats = [
    {
      label: 'Total Courses',
      value: courses.length,
      icon: BookOpen,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Active Students',
      value: '24',
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Enrollments',
      value: '156',
      icon: BarChart3,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">KNC Admin Panel</h1>
            <p className="text-slate-400 text-sm">Welcome back, {userName}</p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            <LogOut size={18} />
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
                    <p className="text-4xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <Icon size={24} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <BookOpen size={24} className="text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Manage Courses</h2>
                <p className="text-slate-400 text-sm">View and manage all language courses</p>
              </div>
            </div>
            <button className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2 rounded-lg font-semibold transition-all">
              + Add Course
            </button>
          </div>

          {/* Courses Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-6 py-3 text-sm font-semibold text-slate-300">Course Name</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-300">Language</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-300">Level</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-300">Students</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-300">Price</th>
                  <th className="px-6 py-3 text-sm font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => (
                  <motion.tr
                    key={course.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-700 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">{course.name}</td>
                    <td className="px-6 py-4 text-slate-300">{course.language}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                        {course.level}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{course.max_students}</td>
                    <td className="px-6 py-4 font-semibold text-white">${course.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">Edit</button>
                        <button className="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6 mt-12"
        >
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all">
                <Users size={24} className="text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Manage Students</h3>
                <p className="text-slate-400 text-sm">View student profiles and enrollment status</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
                <Settings size={24} className="text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Settings</h3>
                <p className="text-slate-400 text-sm">Configure school information and policies</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};
