import { getStudents, getApplications, getCourses } from "@/lib/crud";
import { StudentListPanel } from "@/components/admin/student-list-panel";
import type { StudentWithProfile, Application, Course } from "@/lib/types";

export default async function StudentsPage() {
  const [s, a, c] = await Promise.all([getStudents(), getApplications(), getCourses()]);

  return (
    <StudentListPanel
      initialStudents={(s.data ?? []) as StudentWithProfile[]}
      initialApplications={(a.data ?? []) as Application[]}
      initialCourses={(c.data ?? []) as Course[]}
    />
  );
}
