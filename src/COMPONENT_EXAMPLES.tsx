// ============================================================
// React Component Examples - Using Supabase Database
// ============================================================

// ============================================================
// Example 1: Display All Courses
// ============================================================

import React from 'react';
import { useCourses } from '../lib/hooks';

export function CoursesPage() {
  const { courses, loading, error } = useCourses();

  if (loading) return <div className="p-4">Loading courses...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Available Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="border rounded-lg p-4 shadow">
            <h2 className="text-xl font-semibold">{course.name}</h2>
            <p className="text-gray-600">{course.description}</p>
            <div className="mt-4 flex justify-between text-sm">
              <span className="badge">{course.language}</span>
              <span className="badge">{course.level}</span>
            </div>
            <p className="mt-2 text-lg font-bold">${course.price}</p>
            <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded">
              Enroll Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Example 2: Courses Filtered by Language
// ============================================================

import React, { useState } from 'react';
import { useCoursesByLanguage } from '../lib/hooks';

export function LanguageCourses() {
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const { courses, loading, error } = useCoursesByLanguage(selectedLanguage);

  return (
    <div className="p-6">
      <div className="mb-6">
        <label className="block mb-2 font-semibold">Select Language:</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="border rounded px-4 py-2"
        >
          <option>English</option>
          <option>Spanish</option>
          <option>French</option>
          <option>German</option>
        </select>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {courses.map((course) => (
          <div key={course.id} className="border p-4 rounded">
            <h3 className="font-bold">{course.name}</h3>
            <p className="text-gray-600 text-sm">{course.description}</p>
            <p className="mt-2">Level: {course.level}</p>
            <p>Duration: {course.duration_weeks} weeks</p>
            <p className="text-lg font-bold">${course.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Example 3: Student Enrollment Management
// ============================================================

import React, { useState } from 'react';
import { useEnrollStudent } from '../lib/hooks';

interface EnrollmentProps {
  studentId: string;
  courseId: string;
}

export function EnrollmentButton({ studentId, courseId }: EnrollmentProps) {
  const { enroll, loading, error } = useEnrollStudent();
  const [enrolled, setEnrolled] = useState(false);

  const handleEnroll = async () => {
    const result = await enroll(studentId, courseId);
    if (result.success) {
      setEnrolled(true);
      alert('Successfully enrolled in course!');
    } else {
      alert(`Enrollment failed: ${result.error}`);
    }
  };

  if (enrolled) {
    return (
      <button disabled className="bg-green-500 text-white px-4 py-2 rounded">
        ✓ Enrolled
      </button>
    );
  }

  return (
    <button
      onClick={handleEnroll}
      disabled={loading}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
    >
      {loading ? 'Enrolling...' : 'Enroll in Course'}
    </button>
  );
}

// ============================================================
// Example 4: Student Dashboard
// ============================================================

import React from 'react';
import { useStudentEnrollments } from '../lib/hooks';

interface StudentDashboardProps {
  studentId: string;
}

export function StudentDashboard({ studentId }: StudentDashboardProps) {
  const { enrollments, loading, error } = useStudentEnrollments(studentId);

  if (loading) return <div className="p-4">Loading your courses...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  const activeEnrollments = enrollments.filter((e) => e.status === 'active');
  const completedEnrollments = enrollments.filter((e) => e.status === 'completed');

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Courses</h1>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Active Courses ({activeEnrollments.length})</h2>
        {activeEnrollments.length === 0 ? (
          <p className="text-gray-500">You have no active courses</p>
        ) : (
          <div className="space-y-4">
            {activeEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded p-4 bg-blue-50">
                <h3 className="font-bold text-lg">{enrollment.course_id}</h3>
                <p className="text-sm text-gray-600">
                  Enrolled on: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                </p>
                <button className="mt-2 text-red-500 hover:text-red-700">Drop Course</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Completed Courses ({completedEnrollments.length})</h2>
        {completedEnrollments.length === 0 ? (
          <p className="text-gray-500">You have no completed courses</p>
        ) : (
          <div className="space-y-4">
            {completedEnrollments.map((enrollment) => (
              <div key={enrollment.id} className="border rounded p-4 bg-green-50">
                <h3 className="font-bold text-lg">{enrollment.course_id}</h3>
                <p className="text-sm text-gray-600">✓ Completed</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Example 5: Course Registration Form
// ============================================================

import React, { useState } from 'react';
import { useCourses } from '../lib/hooks';
import { useEnrollStudent, useUpdateEnrollmentStatus } from '../lib/hooks';

interface RegistrationFormProps {
  studentId: string;
}

export function CourseRegistrationForm({ studentId }: RegistrationFormProps) {
  const { courses, loading: coursesLoading } = useCourses();
  const { enroll, loading: enrollLoading } = useEnrollStudent();
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId) {
      setMessage('Please select a course');
      return;
    }

    const result = await enroll(studentId, selectedCourseId);
    if (result.success) {
      setMessage('✓ Successfully enrolled!');
      setSelectedCourseId('');
    } else {
      setMessage(`✗ ${result.error}`);
    }
  };

  return (
    <form onSubmit={handleRegister} className="border rounded p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-4">Register for a Course</h2>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Select Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          disabled={coursesLoading}
          className="w-full border rounded px-3 py-2"
        >
          <option value="">-- Choose a course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} - ${course.price}
            </option>
          ))}
        </select>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.includes('✓') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={enrollLoading || coursesLoading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {enrollLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

// ============================================================
// Example 6: Admin Course Management (Simple)
// ============================================================

import React, { useState } from 'react';
import { useCourses } from '../lib/hooks';
import * as db from '../lib/database.operations';

export function AdminCoursesPage() {
  const { courses, loading } = useCourses();
  const [newCourse, setNewCourse] = useState({
    name: '',
    description: '',
    language: '',
    level: 'beginner' as const,
    max_students: 30,
    duration_weeks: 8,
    price: 99.99,
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.createCourse(newCourse);
      alert('Course created successfully!');
      setNewCourse({
        name: '',
        description: '',
        language: '',
        level: 'beginner',
        max_students: 30,
        duration_weeks: 8,
        price: 99.99,
      });
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin - Course Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Course Form */}
        <form onSubmit={handleCreateCourse} className="border rounded p-4">
          <h2 className="text-xl font-bold mb-4">Create New Course</h2>

          <input
            type="text"
            placeholder="Course Name"
            value={newCourse.name}
            onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          <textarea
            placeholder="Description"
            value={newCourse.description}
            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          <input
            type="text"
            placeholder="Language"
            value={newCourse.language}
            onChange={(e) => setNewCourse({ ...newCourse, language: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          <select
            value={newCourse.level}
            onChange={(e) =>
              setNewCourse({
                ...newCourse,
                level: e.target.value as 'beginner' | 'intermediate' | 'advanced',
              })
            }
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <input
            type="number"
            placeholder="Price"
            value={newCourse.price}
            onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })}
            className="w-full border rounded px-3 py-2 mb-3"
            required
          />

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            Create Course
          </button>
        </form>

        {/* Courses List */}
        <div>
          <h2 className="text-xl font-bold mb-4">Existing Courses</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {courses.map((course) => (
                <div key={course.id} className="border rounded p-3 bg-gray-50">
                  <h3 className="font-bold">{course.name}</h3>
                  <p className="text-sm text-gray-600">{course.language} - {course.level}</p>
                  <p className="text-sm font-semibold">${course.price}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Usage Instructions
// ============================================================

/*
To use these components in your app:

1. Import the component you want to use
2. Pass required props (studentId, courseId, etc.)
3. Make sure your Supabase credentials are set in .env.local
4. Make sure you've installed @supabase/supabase-js

Example in your App.tsx:
```
import { CoursesPage } from './components/examples';

function App() {
  return <CoursesPage />;
}
```

Each example demonstrates:
- Loading states
- Error handling
- Data fetching with hooks
- User interactions
- Form submission
- Conditional rendering

Customize these examples to match your UI library and styling preferences.
*/
