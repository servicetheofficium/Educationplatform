import { getCancelledStudents, getApplications } from "@/lib/crud";
import { CancelledStudentListPanel } from "@/components/admin/cancelled-student-list-panel";
import type { StudentWithProfile, Application } from "@/lib/types";

export default async function CancelledStudentsPage() {
  const [cs, a] = await Promise.all([getCancelledStudents(), getApplications()]);
  const cancelledApps = (a.data ?? [] as Application[]).filter(
    (app: Application) => app.status === "cancelled"
  );

  return (
    <CancelledStudentListPanel
      initialCancelledStudents={(cs.data ?? []) as StudentWithProfile[]}
      initialCancelledApps={cancelledApps}
    />
  );
}
