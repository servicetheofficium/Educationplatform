import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { getCourses, getStudents, getEnrollments, getApplications } from "@/lib/crud";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  const [{ data: courses }, { data: students }, { data: enrollments }, { data: applications }] =
    await Promise.all([getCourses(), getStudents(), getEnrollments(), getApplications()]);

  const approvedAppCount = (applications ?? []).filter((a: { status: string }) => a.status === "approved").length;

  return (
    <AdminDashboard
      user={adminUser}
      courses={courses || []}
      activeStudentCount={(students?.length ?? 0) + approvedAppCount}
      totalEnrollmentCount={(enrollments?.length ?? 0) + approvedAppCount}
    />
  );
}
