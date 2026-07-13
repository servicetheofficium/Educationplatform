"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/utils/supabase/client";
import type { AdminActivityLog } from "@/lib/types";

const PER_PAGE = 15;

const ACTION_STYLES: Record<AdminActivityLog["action"], string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  delete: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

type FieldChange = { field: string; from: unknown; to: unknown };
type ChangeDetails = { student_name?: string | null; changes: FieldChange[] };

function isChangeDetails(details: Record<string, unknown>): details is ChangeDetails {
  return Array.isArray((details as { changes?: unknown }).changes);
}

function formatValue(v: unknown) {
  if (v === null || v === undefined || v === "") return "empty";
  return String(v);
}

function summarizeChanges(details: Record<string, unknown> | null): string | null {
  if (!details || !isChangeDetails(details)) return null;
  const name = details.student_name;
  if (details.changes.length === 0) return name ? `${name}: no changes` : "No changes";
  const parts = details.changes.map((c) => `${c.field} ${formatValue(c.from)} → ${formatValue(c.to)}`).join(", ");
  return name ? `${name}: ${parts}` : parts;
}

const columnHelper = createColumnHelper<AdminActivityLog>();

export function ActivityLogPanel({ initialLogs }: { initialLogs: AdminActivityLog[] }) {
  const [logs, setLogs] = useState<AdminActivityLog[]>(initialLogs);
  const [search, setSearch] = useState("");
  const [detailsLog, setDetailsLog] = useState<AdminActivityLog | null>(null);

  const refreshData = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data) setLogs(data as AdminActivityLog[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-activity-log-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_activity_log" }, refreshData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshData]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      (l.admin_name ?? "").toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.target_table.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const columns = useMemo(() => [
    columnHelper.accessor("created_at", {
      header: "When",
      cell: ({ getValue }) => (
        <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDateTime(getValue())}</span>
      ),
    }),
    columnHelper.accessor("admin_name", {
      header: "Admin",
      cell: ({ getValue }) => (
        <span className="font-medium text-slate-900 dark:text-white">{getValue() ?? "Unknown"}</span>
      ),
    }),
    columnHelper.accessor("action", {
      header: "Action",
      cell: ({ getValue }) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${ACTION_STYLES[getValue()]}`}>
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("target_table", {
      header: "Table",
      cell: ({ getValue }) => (
        <span className="text-slate-600 dark:text-slate-300 font-mono text-xs">{getValue()}</span>
      ),
    }),
    columnHelper.accessor("details", {
      header: "Details",
      cell: ({ getValue, row }) => {
        const details = getValue();
        if (!details) return <span className="text-slate-500 dark:text-slate-400 text-xs">—</span>;
        const summary = summarizeChanges(details);
        return (
          <button
            type="button"
            onClick={() => setDetailsLog(row.original)}
            className="text-slate-500 dark:text-slate-400 text-xs truncate block max-w-xs text-left hover:text-brand-500 dark:hover:text-brand-400 hover:underline"
          >
            {summary ?? JSON.stringify(details)}
          </button>
        );
      },
    }),
  ], []);

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PER_PAGE, pageIndex: 0 } },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { table.setPageIndex(0); }, [search]);

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
            <div className="p-2 bg-brand-500/20 rounded-lg">
              <History size={24} className="text-brand-400" />
            </div>
            <div>
              <CardTitle className="text-2xl text-slate-900 dark:text-white">Activity Log</CardTitle>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Recent admin actions (last 500)</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search admin, action, table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9 bg-white dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {logs.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-16">No activity recorded yet.</p>
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

      <Dialog open={detailsLog !== null} onOpenChange={(open) => { if (!open) setDetailsLog(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {detailsLog && (
            <div className="space-y-2 text-sm">
              <p className="text-slate-500 dark:text-slate-400">
                {formatDateTime(detailsLog.created_at)} · {detailsLog.admin_name ?? "Unknown"} ·{" "}
                <span className="capitalize">{detailsLog.action}</span> · {detailsLog.target_table}
                {detailsLog.details && isChangeDetails(detailsLog.details) && detailsLog.details.student_name
                  ? ` · ${detailsLog.details.student_name}`
                  : ""}
              </p>
              {detailsLog.details && isChangeDetails(detailsLog.details) ? (
                detailsLog.details.changes.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-xs">No field changes.</p>
                ) : (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400">
                          <th className="text-left px-3 py-2 font-medium">Field</th>
                          <th className="text-left px-3 py-2 font-medium">From</th>
                          <th className="text-left px-3 py-2 font-medium">To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailsLog.details.changes.map((c, i) => (
                          <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                            <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-300">{c.field}</td>
                            <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{formatValue(c.from)}</td>
                            <td className="px-3 py-2 text-slate-800 dark:text-white">{formatValue(c.to)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <pre className="whitespace-pre-wrap break-words rounded-lg bg-slate-100 dark:bg-slate-900 p-3 text-xs text-slate-700 dark:text-slate-300 max-h-96 overflow-y-auto">
                  {JSON.stringify(detailsLog.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
