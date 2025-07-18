import BottomNav from "@/components/bottom-nav";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full py-8 pb-24 md:container md:mx-auto md:px-6 lg:px-8 md:pb-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
