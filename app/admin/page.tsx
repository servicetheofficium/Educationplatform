import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { getCourses, getStudents, getEnrollments } from "@/lib/crud";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  const [{ data: courses }, { data: students }, { data: enrollments }] =
    await Promise.all([getCourses(), getStudents(), getEnrollments()]);

  return (
    <AdminDashboard
      user={adminUser}
      courses={courses || []}
      activeStudentCount={students?.length ?? 0}
      totalEnrollmentCount={enrollments?.length ?? 0}
    />
  );
}
