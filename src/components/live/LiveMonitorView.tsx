import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Search,
  Filter,
  Eye,
  Zap,
  Flame,
  ArrowDown,
  ArrowUp,
  SlidersHorizontal,
  Info,
  Radio,
} from 'lucide-react';
import { useTraffic } from '../../context/TrafficContext';
import { Packet, Protocol } from '../../types/traffic';

const PROTOCOLS: (Protocol | 'ALL')[] = ['ALL', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP', 'SSH', 'ARP'];

export const LiveMonitorView: React.FC = () => {
  const {
    filteredPackets,
    packets,
    isMonitoring,
    isPaused,
    startMonitoring,
    stopMonitoring,
    togglePause,
    clearPackets,
    injectAttack,
    filters,
    setFilters,
    settings,
    updateSettings,
    setSelectedPacket,
  } = useTraffic();

  const [searchLocal, setSearchLocal] = useState(filters.searchQuery);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchLocal(e.target.value);
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleProtocolFilter = (proto: string) => {
    setFilters((prev) => ({ ...prev, protocol: proto }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters((prev) => ({ ...prev, status }));
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Deck */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h2 className="font-mono text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>LIVE TRAFFIC MONITOR</span>
                  <span className="text-[10px] bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                    SIMULATED DEMO STREAM
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Continuous packet stream inspection with rule-based flag matching
                </p>
              </div>
            </div>
          </div>

          {/* Primary Stream Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isMonitoring ? (
              <>
                <button
                  onClick={togglePause}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-colors ${
                    isPaused
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
                </button>
                <button
                  onClick={stopMonitoring}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 text-xs font-mono font-medium transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Stream</span>
                </button>
              </>
            ) : (
              <button
                onClick={startMonitoring}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-mono font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Stream</span>
              </button>
            )}

            <button
              onClick={clearPackets}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 text-xs font-mono transition-colors"
              title="Clear packet buffer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            {/* Stream Speed Selector */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-[11px] font-mono">
              <span className="text-slate-400">Rate:</span>
              <button
                onClick={() => updateSettings({ simulationSpeed: 2000 })}
                className={`px-1.5 py-0.5 rounded ${
                  settings.simulationSpeed === 2000 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                0.5x
              </button>
              <button
                onClick={() => updateSettings({ simulationSpeed: 1200 })}
                className={`px-1.5 py-0.5 rounded ${
                  settings.simulationSpeed === 1200 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => updateSettings({ simulationSpeed: 400 })}
                className={`px-1.5 py-0.5 rounded ${
                  settings.simulationSpeed === 400 ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'
                }`}
              >
                3x
              </button>
            </div>
          </div>
        </div>

        {/* Live Attack Injection Toolbar */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Anomaly Vectors:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => injectAttack('portScan')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-mono text-[11px] transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Nmap Port Scan</span>
            </button>
            <button
              onClick={() => injectAttack('synFlood')}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-mono text-[11px] transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-rose-400" />
              <span>SYN Flood Burst</span>
            </button>
            <button
              onClick={() => injectAttack('icmpSweep')}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-mono text-[11px] transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>ICMP Ping Sweep</span>
            </button>
            <button
              onClick={() => injectAttack('c2Beacon')}
              className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 font-mono text-[11px] transition-colors flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-purple-400" />
              <span>Metasploit C2 Beacon</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search IP (e.g. 192.168.1.15) or protocol..."
            value={searchLocal}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Protocol Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none font-mono text-[11px]">
          {PROTOCOLS.map((p) => (
            <button
              key={p}
              onClick={() => handleProtocolFilter(p)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filters.protocol === p
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-2 self-end md:self-center font-mono text-[11px]">
          <span className="text-slate-400">Status:</span>
          <select
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="normal">Normal</option>
            <option value="suspicious">Suspicious</option>
            <option value="malicious">Malicious</option>
          </select>
        </div>
      </div>

      {/* Streaming Packet Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">BUFFER PACKETS:</span>
            <span className="text-cyan-400 font-bold">{filteredPackets.length}</span>
            {filteredPackets.length !== packets.length && (
              <span className="text-slate-500">(Filtered from {packets.length})</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Click row or <span className="text-cyan-400">Inspect</span> for OSI Layer 2-7 Dissection
          </div>
        </div>

        <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
          {filteredPackets.length > 0 ? (
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px] z-10">
                <tr>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-3">SOURCE IP : PORT</th>
                  <th className="py-2.5 px-3">DESTINATION IP : PORT</th>
                  <th className="py-2.5 px-2">PROTO</th>
                  <th className="py-2.5 px-2">FLAGS</th>
                  <th className="py-2.5 px-2 text-right">SIZE</th>
                  <th className="py-2.5 px-2 text-center">STATUS</th>
                  <th className="py-2.5 px-3">PACKET INFO / PAYLOAD</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredPackets.map((pkt) => {
                  const isMalicious = pkt.status === 'malicious';
                  const isSuspicious = pkt.status === 'suspicious';

                  return (
                    <tr
                      key={pkt.id}
                      onClick={() => setSelectedPacket(pkt)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isMalicious
                          ? 'bg-rose-950/20'
                          : isSuspicious
                          ? 'bg-amber-950/15'
                          : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {pkt.timestamp}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-emerald-400 font-semibold">{pkt.sourceIp}</span>
                        {pkt.sourcePort > 0 && (
                          <span className="text-slate-500 text-[11px]">:{pkt.sourcePort}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="text-cyan-400 font-semibold">{pkt.destinationIp}</span>
                        {pkt.destinationPort > 0 && (
                          <span className="text-slate-500 text-[11px]">:{pkt.destinationPort}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap text-slate-400 text-[11px]">
                        {pkt.flags && pkt.flags.length > 0 ? (
                          <span className="text-cyan-300 font-medium">{pkt.flags.join(', ')}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right whitespace-nowrap text-slate-300">
                        {pkt.packetSize} B
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isMalicious
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
                              : isSuspicious
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {pkt.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300 text-[11px] max-w-xs truncate" title={pkt.info}>
                        {pkt.info || 'Standard network segment traffic'}
                      </td>
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPacket(pkt);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                <Filter className="w-6 h-6" />
              </div>
              <h3 className="font-mono text-sm font-semibold text-slate-300">
                No matching network packets in buffer
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No packets matched your active query. Clear search filters or click "Start Stream" to resume simulated capture.
              </p>
              <button
                onClick={() => setFilters({ searchQuery: '', protocol: 'ALL', status: 'ALL', direction: 'ALL', port: '' })}
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
