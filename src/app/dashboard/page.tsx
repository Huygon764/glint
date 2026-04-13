import { Dashboard } from "@/components/creator/dashboard";
import { PageShell } from "@/components/layout/PageShell";

export default function DashboardPage() {
  return (
    <PageShell>
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
        Manage your profile and see your tips.
      </p>

      <Dashboard />
    </PageShell>
  );
}
