import { Nav } from "@/components/nav";
import { AdminConsole } from "@/components/admin-console";
import { listRepos } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const repos = await listRepos("all");
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="aurora-bg opacity-60" />
      <div className="absolute inset-0 grid-bg z-0" />
      <Nav />
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-14 pb-24">
        <AdminConsole initial={repos} />
      </section>
    </main>
  );
}
