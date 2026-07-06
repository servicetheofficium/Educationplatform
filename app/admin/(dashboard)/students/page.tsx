import { getStudents, getCourses } from "@/lib/crud";
import { StudentListPanel } from "@/components/admin/student-list-panel";
import type { StudentWithProfile, Course } from "@/lib/types";

export default async function StudentsPage() {
  const [s, c] = await Promise.all([getStudents(), getCourses()]);

  return (
    <StudentListPanel
      initialStudents={(s.data ?? []) as StudentWithProfile[]}
      initialCourses={(c.data ?? []) as Course[]}
    />
  );
}
