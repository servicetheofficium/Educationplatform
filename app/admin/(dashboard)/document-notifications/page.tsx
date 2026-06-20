import { getStudents, getApplications } from "@/lib/crud";
import { DocumentNotificationPanel } from "@/components/admin/document-notification-panel";
import type { StudentWithProfile, Application } from "@/lib/types";

export default async function DocumentNotificationsPage() {
  const [sRes, aRes] = await Promise.all([getStudents(), getApplications()]);
  const students = (sRes.data ?? []) as StudentWithProfile[];
  const approvedApps = ((aRes.data ?? []) as Application[]).filter(
    (a) => a.status === "approved"
  );

  return (
    <DocumentNotificationPanel
      initialStudents={students}
      initialApprovedApps={approvedApps}
    />
  );
}
