import { Sidebar, BottomNav } from "@/components/Nav";
import { TopBar } from "@/components/TopBar";
import { CashflowEntryProvider } from "@/components/tabs/CashflowEntryModal";
import { CashflowFab } from "@/components/tabs/CashflowFab";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <CashflowEntryProvider>
      <div style={{ display: "flex", minHeight: "100%" }}>
        <Sidebar />
        <div style={{ flex: 1, padding: "32px 42px", maxWidth: 1000, paddingBottom: "88px" }} className="fp-main">
          <TopBar />
          {children}
        </div>
        <BottomNav />
      </div>
      <CashflowFab />
    </CashflowEntryProvider>
  );
}
