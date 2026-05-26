"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { LogOut, BarChart3, Users, BookOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logout } from "@/lib/auth";
import type { AdminUser, Course } from "@/lib/types";

interface AdminDashboardProps {
  user: AdminUser;
  courses: Course[];
}

export function AdminDashboard({ user, courses }: AdminDashboardProps) {
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const stats = [
    {
      label: "Total Courses",
      value: courses.length,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      label: "Active Students",
      value: "24",
      icon: Users,
      color: "bg-green-100 text-green-600",
    },
    {
      label: "Total Enrollments",
      value: "156",
      icon: BarChart3,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navbar */}
      <nav className="bg-slate-900/50 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-white">
              KNC Admin Panel
            </h1>
            <p className="text-slate-400 text-sm">
              Welcome back, {user.full_name}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            disabled={loggingOut}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
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
              >
                <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:border-slate-600 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-400 text-sm font-medium">
                          {stat.label}
                        </p>
                        <p className="text-4xl font-bold text-white mt-2">
                          {stat.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${stat.color}`}>
                        <Icon size={24} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Courses Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 mb-12">
            <CardHeader className="flex flex-row items-center justify-between p-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BookOpen size={24} className="text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    Manage Courses
                  </CardTitle>
                  <p className="text-slate-400 text-sm">
                    View and manage all language courses
                  </p>
                </div>
              </div>
              <Button className="bg-brand-600 hover:bg-brand-700">
                + Add Course
              </Button>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Course Name</TableHead>
                    <TableHead className="text-slate-300">Language</TableHead>
                    <TableHead className="text-slate-300">Level</TableHead>
                    <TableHead className="text-slate-300">Students</TableHead>
                    <TableHead className="text-slate-300">Price</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow
                      key={course.id}
                      className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                    >
                      <TableCell className="font-medium text-white">
                        {course.name}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {course.language}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500/20 text-blue-300 border-0 capitalize">
                          {course.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {course.max_students}
                      </TableCell>
                      <TableCell className="font-semibold text-white">
                        ${course.price}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 h-auto p-0"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 h-auto p-0"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6"
        >
          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all">
                  <Users size={24} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Manage Students
                  </h3>
                  <p className="text-slate-400 text-sm">
                    View student profiles and enrollment status
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-md border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
                  <Settings size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Settings</h3>
                  <p className="text-slate-400 text-sm">
                    Configure school information and policies
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
