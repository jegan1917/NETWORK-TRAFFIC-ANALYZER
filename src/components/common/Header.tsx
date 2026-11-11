import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Square,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  ShieldAlert,
  Wifi,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { useTraffic } from '../../context/TrafficContext';

interface HeaderProps {
  onNavigateTab: (tab: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigateTab, activeTab }) => {
  const {
    isMonitoring,
    isPaused,
    startMonitoring,
    stopMonitoring,
    togglePause,
    stats,
    alerts,
    settings,
    updateSettings,
    clearPackets,
  } = useTraffic();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString());
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeAlertsCount = alerts.filter((a) => a.status === 'active').length;

  return (
    <header className="bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-30 backdrop-blur-md">
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Mini Project Identification */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-blue-600/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Activity className="w-5 h-5 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm md:text-base font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
                <span>NETRAFFIC</span>
                <span className="text-emerald-400 font-extrabold">ANALYZER</span>
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                v2.4-CSE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Packet Inspection &amp; Heuristic Threat Detection Engine
            </p>
          </div>
        </div>

        {/* Real-time System Status Telemetry */}
        <div className="hidden lg:flex items-center gap-5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                !isMonitoring
                  ? 'bg-red-500'
                  : isPaused
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-emerald-400 animate-ping'
              }`}
            ></span>
            <span className="text-slate-400">STATUS:</span>
            <span
              className={`font-semibold ${
                !isMonitoring
                  ? 'text-red-400'
                  : isPaused
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {!isMonitoring ? 'HALTED' : isPaused ? 'PAUSED' : 'STREAMING'}
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800"></div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">BUFFER:</span>
            <span className="text-cyan-300 font-semibold">{stats.totalPackets} pkts</span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800"></div>

          <div className="flex items-center gap-1.5 text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">DATA:</span>
            <span className="text-blue-300 font-semibold">
              {(stats.totalBytes / 1024).toFixed(1)} KB
            </span>
          </div>

          <div className="h-3 w-[1px] bg-slate-800"></div>

          <div className="text-slate-400">
            SYS CLK: <span className="text-slate-200">{currentTime || '--:--:--'}</span>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              settings.soundAlerts
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
            }`}
            title={settings.soundAlerts ? 'Alert Audio: ON' : 'Alert Audio: MUTED'}
          >
            {settings.soundAlerts ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Alert Badge Indicator */}
          <button
            onClick={() => onNavigateTab('security')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              activeAlertsCount > 0
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/40 animate-pulse'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
            }`}
            title="View Security Alerts"
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${activeAlertsCount > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
            <span className="hidden md:inline font-medium">THREATS:</span>
            <span className={`font-bold ${activeAlertsCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {activeAlertsCount}
            </span>
          </button>

          {/* Stream Controls */}
          {isMonitoring ? (
            <>
              <button
                onClick={togglePause}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium font-mono transition-colors ${
                  isPaused
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title={isPaused ? 'Resume stream' : 'Pause stream'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              <button
                onClick={stopMonitoring}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 hover:bg-red-900/40 text-xs font-mono font-medium transition-colors"
                title="Stop packet generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            </>
          ) : (
            <button
              onClick={startMonitoring}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-mono font-medium transition-colors"
              title="Start simulated capture"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Monitor</span>
            </button>
          )}

          {/* Quick Clear Buffer */}
          <button
            onClick={clearPackets}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Clear current packet buffer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
