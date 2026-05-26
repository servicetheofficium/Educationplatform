import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { getCourses } from "@/lib/crud";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default async function AdminPage() {
  const adminUser = await getAdminUser();

  if (!adminUser) {
    redirect("/admin/login");
  }

  const { data: courses } = await getCourses();

  return <AdminDashboard user={adminUser} courses={courses || []} />;
}
