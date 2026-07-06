import { getCourses, getStudents, getEnrollments, getApplications } from "@/lib/crud";
import { getAdminUser } from "@/lib/auth";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const [{ data: courses }, { data: students }, { data: enrollments }, { data: applications }, adminUser] =
    await Promise.all([getCourses(), getStudents(), getEnrollments(), getApplications(), getAdminUser()]);

  const approvedAppCount = (applications ?? []).filter((a: { status: string }) => a.status === "approved").length;

  return (
    <AdminDashboard
      courses={courses || []}
      activeStudentCount={(students?.length ?? 0) + approvedAppCount}
      totalEnrollmentCount={(enrollments?.length ?? 0) + approvedAppCount}
      adminName={adminUser?.full_name || adminUser?.email}
    />
  );
}
