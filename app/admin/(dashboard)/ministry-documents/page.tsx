import { getMinistryDocuments } from "@/lib/crud";
import { MinistryDocumentsPanel } from "@/components/admin/ministry-documents-panel";
import type { MinistryDocument } from "@/lib/types";

export default async function MinistryDocumentsPage() {
  const res = await getMinistryDocuments();

  return <MinistryDocumentsPanel initialDocuments={(res.data ?? []) as MinistryDocument[]} />;
}
