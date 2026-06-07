import { getAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSettingsPanel } from "@/components/admin/admin-settings-panel";

export default async function SettingsPage() {
  const adminUser = await getAdminUser();
  if (!adminUser) redirect("/admin/login");
  return <AdminSettingsPanel user={adminUser} />;
}
