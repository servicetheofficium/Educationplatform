"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, UserX, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateStudent, updateApplication } from "@/lib/crud";
import { createClient } from "@/utils/supabase/client";
import type { StudentWithProfile, Application } from "@/lib/types";

const PER_PAGE = 10;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type Row = {
  id: string;
  source: "student" | "app";
  name: string;
  email: string | null;
  phone: string | null;
  passport_number: string | null;
  course: string | null;
  cancelledAt: string;
};

function buildRows(students: StudentWithProfile[], apps: Application[]): Row[] {
  return [
    ...students.map((s) => ({
      id: s.id,
      source: "student" as const,
      name: s.profiles?.full_name ?? s.name ?? "—",
      email: s.profiles?.email ?? s.email ?? null,
      phone: s.phone ?? null,
      passport_number: s.passport_number ?? null,
      course: s.student_courses?.[0]?.courses?.name ?? s.language_level ?? null,
      cancelledAt: s.cancelled_at!,
    })),
    ...apps.map((a) => ({
      id: a.id,
      source: "app" as const,
      name: a.name,
      email: a.email,
      phone: a.phone ?? null,
      passport_number: a.passport_number ?? null,
      course: a.courses?.name ?? null,
      cancelledAt: a.updated_at,
    })),
  ].sort((a, b) => new Date(a.cancelledAt).getTime() - new Date(b.cancelledAt).getTime());
}

const columnHelper = createColumnHelper<Row>();

export function CancelledStudentListPanel({
  initialCancelledStudents,
  initialCancelledApps,
}: {
  initialCancelledStudents: StudentWithProfile[];
  initialCancelledApps: Application[];
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    buildRows(initialCancelledStudents, initialCancelledApps)
  );
  const [search, setSearch] = useState("");
  const [reenrollingId, setReenrollingId] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    const supabase = createClient();
    const [{ data: s }, { data: a }] = await Promise.all([
      supabase.from("students").select("*, profiles(email, full_name), student_courses(status, created_at, courses(name))").not("cancelled_at", "is", null).order("cancelled_at", { ascending: false }),
      supabase.from("applications").select("*, courses(name)").eq("status", "cancelled").order("updated_at", { ascending: false }),
    ]);
    if (s && a) setRows(buildRows(s as StudentWithProfile[], a as Application[]));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-cancelled-students-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, refreshData)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, refreshData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  function exportCSV() {
    const headers = ["Student Name", "Email", "Phone", "Passport No.", "Course / Level", "Cancelled On"];
    const escape = (v: string | null | undefined) => {
      if (v == null) return "";
      const s = String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvRows = [
      headers.join(","),
      ...rows.map((r) => [
        escape(r.name),
        escape(r.email),
        escape(r.phone),
        escape(r.passport_number),
        escape(r.course),
        formatDate(r.cancelledAt),
      ].join(",")),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cancelled_students_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleReenroll(row: Row) {
    setReenrollingId(row.id);
    if (row.source === "student") {
      await updateStudent(row.id, { cancelled_at: null });
    } else {
      await updateApplication(row.id, { status: "approved" });
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setReenrollingId(null);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q) ||
        (r.phone ?? "").includes(q) ||
        (r.course ?? "").toLowerCase().includes(q) ||
        (r.passport_number ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Student Name",
        cell: ({ getValue }) => (
          <span className="font-medium text-slate-900 dark:text-white">{getValue()}</span>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: ({ getValue }) => (
          <span className="text-slate-600 dark:text-slate-300 text-xs">{getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: ({ getValue }) => (
          <span className="text-slate-600 dark:text-slate-300">{getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("passport_number", {
        header: "Passport No.",
        cell: ({ getValue }) => (
          <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">{getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("course", {
        header: "Course / Level",
        cell: ({ getValue }) => (
          <span className="text-slate-600 dark:text-slate-300 capitalize">{getValue() ?? "—"}</span>
        ),
      }),
      columnHelper.accessor("cancelledAt", {
        header: "Cancelled On",
        cell: ({ getValue }) => (
          <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">
            {formatDate(getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "action",
        header: "Action",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            disabled={reenrollingId === row.original.id}
            onClick={() => handleReenroll(row.original)}
            className="text-green-500 hover:text-green-400 h-auto p-0 text-xs"
          >
            {reenrollingId === row.original.id ? "Re-enrolling..." : "Re-enroll"}
          </Button>
        ),
      }),
    ],
    [reenrollingId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PER_PAGE, pageIndex: 0 } },
  });

  const { pageIndex } = table.getState().pagination;
  const pageCount = Math.max(1, table.getPageCount());
  const total = filtered.length;
  const from = total === 0 ? 0 : pageIndex * PER_PAGE + 1;
  const to = Math.min((pageIndex + 1) * PER_PAGE, total);

  return (
    <main className="px-6 py-12">
      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50">
        <CardHeader className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <UserX size={24} className="text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">Student Cancel List</CardTitle>
              <p className="text-slate-500 dark:text-slate-400 text-sm">All cancelled enrollments</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, email, phone, course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <Button
              onClick={exportCSV}
              className="h-9 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0"
            >
              <Download size={16} /> Export CSV
            </Button>
          </div>

          {rows.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-16">No cancelled students.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
                <table className="w-full table-auto border-collapse text-sm">
                  <thead>
                    {table.getHeaderGroups().map((hg) => (
                      <tr key={hg.id} className="border-b border-slate-200 dark:border-slate-700">
                        {hg.headers.map((header) => (
                          <th
                            key={header.id}
                            className="h-11 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap bg-slate-50 dark:bg-slate-800/80 align-middle"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="text-center py-12 text-slate-500 dark:text-slate-400">
                          No results found.
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id} className="px-4 py-3 align-middle">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {total > 0 ? `Showing ${from}–${to} of ${total}` : "No results"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                  >
                    <ChevronLeft size={16} /> Prev
                  </Button>
                  <span className="text-sm text-slate-500 dark:text-slate-400 px-2">{pageIndex + 1} / {pageCount}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                  >
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
