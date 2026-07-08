import { getCourses, getStudents, getEnrollments, getApplications } from "@/lib/crud";
import { getAdminUser } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const [{ data: courses }, { data: students }, { data: enrollments }, { data: applications }, adminUser] =
    await Promise.all([getCourses(), getStudents(), getEnrollments(), getApplications(), getAdminUser()]);

  const approvedAppCount = (applications ?? []).filter((a: { status: string }) => a.status === "approved").length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyAppliedCount = (students ?? []).filter(
    (s: { enrollment_date: string }) => new Date(s.enrollment_date) >= monthStart
  ).length;

  return (
    <AdminDashboard
      courses={courses || []}
      activeStudentCount={(students?.length ?? 0) + approvedAppCount}
      totalEnrollmentCount={(enrollments?.length ?? 0) + approvedAppCount}
      monthlyAppliedCount={monthlyAppliedCount}
      adminName={adminUser?.full_name || adminUser?.email}
    />
  );
}
