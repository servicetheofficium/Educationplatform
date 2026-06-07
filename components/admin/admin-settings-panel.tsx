"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logout } from "@/lib/auth";
import type { AdminUser } from "@/lib/types";
import { LogOut } from "lucide-react";
import { useState } from "react";

export function AdminSettingsPanel({ user }: { user: AdminUser }) {
  const [loggingOut, setLoggingOut] = useState(false);

  return (
    <main className="px-8 py-10">
      <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-8">Settings</h2>
      <Card className="bg-white dark:bg-slate-800/50 backdrop-blur-md border-slate-200 dark:border-slate-700/50 max-w-md">
        <CardContent className="p-6">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Account</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Signed in as {user.full_name}</p>
          <Button
            onClick={async () => { setLoggingOut(true); await logout(); }}
            disabled={loggingOut}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut size={16} />
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
