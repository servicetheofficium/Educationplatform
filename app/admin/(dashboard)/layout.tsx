import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { AdminThemeProvider } from "@/components/admin/admin-theme-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminUser = await getAdminUser();
  if (!adminUser) redirect("/admin/login");

  return (
    <AdminThemeProvider>
      <div className="h-screen overflow-hidden bg-slate-50 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex">
        <AdminSidebar user={adminUser} />
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </AdminThemeProvider>
  );
}
