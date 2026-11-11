import React, { useState } from 'react';
import { TrafficProvider, useTraffic } from './context/TrafficContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { SimulatedBanner } from './components/common/SimulatedBanner';
import { PacketDetailModal } from './components/common/PacketDetailModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { LiveMonitorView } from './components/live/LiveMonitorView';
import { AnalysisView } from './components/analysis/AnalysisView';
import { SecurityThreatsView } from './components/security/SecurityThreatsView';
import { CsvUploadView } from './components/csv/CsvUploadView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Settings,
  Menu,
  X,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedPacket, setSelectedPacket, alerts } = useTraffic();

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;

  const mobileNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live', icon: Radio },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'security', label: 'Security', icon: ShieldAlert, badge: activeAlertsCount },
    { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header onNavigateTab={setActiveTab} activeTab={activeTab} />

      {/* Prominent Simulated Sandbox Notice */}
      <SimulatedBanner />

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-slate-950/95 p-4 flex flex-col space-y-2 border-r border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-mono text-sm font-bold text-emerald-400">NAVIGATION MENU</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                    activeTab === item.id
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-rose-500/20 text-rose-300 font-mono">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView onNavigateTab={setActiveTab} />}
            {activeTab === 'live' && <LiveMonitorView />}
            {activeTab === 'analysis' && <AnalysisView />}
            {activeTab === 'security' && <SecurityThreatsView />}
            {activeTab === 'csv' && <CsvUploadView onNavigateTab={setActiveTab} />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Quick Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 border-t border-slate-800 px-3 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dash</span>
        </button>
        <button
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'live' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Live</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex flex-col items-center gap-1 text-[10px] relative ${
            activeTab === 'security' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Threats</span>
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`flex flex-col items-center gap-1 text-[10px] ${
            activeTab === 'csv' ? 'text-purple-400 font-bold' : 'text-slate-400'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>CSV</span>
        </button>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 text-[10px] text-slate-400"
        >
          <Menu className="w-4 h-4" />
          <span>More</span>
        </button>
      </div>

      {/* OSI Packet Dissection Modal */}
      <PacketDetailModal packet={selectedPacket} onClose={() => setSelectedPacket(null)} />
    </div>
  );
};

export default function App() {
  return (
    <TrafficProvider>
      <MainLayout />
    </TrafficProvider>
  );
}
