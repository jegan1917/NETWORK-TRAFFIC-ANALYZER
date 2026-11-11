import React from 'react';
import {
  LayoutDashboard,
  Radio,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
  FileText,
  Settings,
  Flame,
  Terminal,
  Zap,
} from 'lucide-react';
import { useTraffic } from '../../context/TrafficContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { alerts, injectAttack, isMonitoring } = useTraffic();
  const activeThreats = alerts.filter((a) => a.status === 'active').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Overview & metrics',
    },
    {
      id: 'live',
      label: 'Live Traffic Monitor',
      icon: Radio,
      badge: isMonitoring ? 'LIVE' : null,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      desc: 'Real-time packet stream',
    },
    {
      id: 'analysis',
      label: 'Traffic Analysis',
      icon: BarChart3,
      badge: null,
      desc: 'Deep packet statistics',
    },
    {
      id: 'security',
      label: 'Security & Threats',
      icon: ShieldAlert,
      badge: activeThreats > 0 ? String(activeThreats) : null,
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      desc: 'Rule-based IDS engine',
    },
    {
      id: 'csv',
      label: 'CSV Upload & Parser',
      icon: FileSpreadsheet,
      badge: null,
      desc: 'Import & inspect traces',
    },
    {
      id: 'reports',
      label: 'Reports & Viva Guide',
      icon: FileText,
      badge: null,
      desc: 'Print report & Viva Q&A',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
      desc: 'Thresholds & speed',
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 h-[calc(100vh-57px)]">
      {/* Navigation Links */}
      <div className="p-3 space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
          Navigation Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                  }`}
                />
                <span className="font-medium text-left">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-semibold ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Viva Demo Attack Scenario Injection Panel */}
      <div className="mx-3 mt-2 p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5" />
            <span>TEST THREAT INJECTORS</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500 bg-slate-800 px-1 rounded">VIVA DEMO</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-2.5 leading-relaxed">
          Inject simulated attack vectors to test IDS heuristic rules live:
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => injectAttack('portScan')}
            className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-amber-300 text-[10px] font-mono transition-colors text-left flex items-center gap-1"
            title="Inject Port Scan Reconnaissance"
          >
            <Zap className="w-3 h-3 shrink-0 text-amber-400" />
            <span className="truncate">Port Scan</span>
          </button>
          <button
            onClick={() => injectAttack('synFlood')}
            className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-500/10 text-rose-300 text-[10px] font-mono transition-colors text-left flex items-center gap-1"
            title="Inject TCP SYN Flood"
          >
            <Zap className="w-3 h-3 shrink-0 text-rose-400" />
            <span className="truncate">SYN Flood</span>
          </button>
          <button
            onClick={() => injectAttack('icmpSweep')}
            className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-300 text-[10px] font-mono transition-colors text-left flex items-center gap-1"
            title="Inject ICMP Subnet Ping Sweep"
          >
            <Zap className="w-3 h-3 shrink-0 text-cyan-400" />
            <span className="truncate">ICMP Sweep</span>
          </button>
          <button
            onClick={() => injectAttack('c2Beacon')}
            className="px-2 py-1.5 rounded bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-purple-500/10 text-purple-300 text-[10px] font-mono transition-colors text-left flex items-center gap-1"
            title="Inject Reverse Shell C2 Beaconing"
          >
            <Zap className="w-3 h-3 shrink-0 text-purple-400" />
            <span className="truncate">C2 Beacon</span>
          </button>
        </div>
      </div>

      {/* College Project Academic Information Footer */}
      <div className="mt-auto p-3 m-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-400 text-[11px]">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono font-semibold text-slate-300">CSE Mini Project</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          3rd Year Computer Science &amp; Engineering. Standalone client architecture with zero external APIs.
        </p>
      </div>
    </aside>
  );
};
