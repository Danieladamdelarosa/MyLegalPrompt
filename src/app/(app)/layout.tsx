import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={session.user.name}
          email={session.user.email}
          plan={session.user.plan}
        />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-6">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
