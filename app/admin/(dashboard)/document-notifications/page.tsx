import { getDocumentCases, getApplications } from "@/lib/crud";
import { DocumentNotificationPanel } from "@/components/admin/document-notification-panel";
import type { StudentDocumentCaseWithStudent, Application } from "@/lib/types";

export default async function DocumentNotificationsPage() {
  const [cRes, aRes] = await Promise.all([getDocumentCases(), getApplications()]);
  const cases = (cRes.data ?? []) as StudentDocumentCaseWithStudent[];
  const approvedApps = ((aRes.data ?? []) as Application[]).filter(
    (a) => a.status === "approved"
  );

  return (
    <DocumentNotificationPanel
      initialCases={cases}
      initialApprovedApps={approvedApps}
    />
  );
}
