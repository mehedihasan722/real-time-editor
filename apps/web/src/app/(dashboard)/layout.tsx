import { DashboardFooter } from "./_components/dashboard-footer";
import { Navbar } from "./_components/navbar";
import { OrgSidebar } from "./_components/org-sidebar";
import Sidebar from "./_components/sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <main className="min-h-screen future-dashboard">
      <Sidebar />
      <div className="min-h-screen pl-[60px]">
        <div className="flex min-h-screen gap-x-3">
          <OrgSidebar />
          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <Navbar />
            <div className="flex-1">{children}</div>
            <DashboardFooter />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;
