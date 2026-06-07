import { getStudents, getApplications } from "@/lib/crud";
import { StudentsPanel } from "@/components/admin/students-panel";
import type { StudentWithProfile, Application } from "@/lib/types";

export default async function ApplicationsPage() {
  const [s, a] = await Promise.all([getStudents(), getApplications()]);

  return (
    <StudentsPanel
      initialStudents={(s.data ?? []) as StudentWithProfile[]}
      initialApplications={(a.data ?? []) as Application[]}
    />
  );
}
