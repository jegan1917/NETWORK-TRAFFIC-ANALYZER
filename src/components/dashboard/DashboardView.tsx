import React, { useMemo } from 'react';
import {
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  HardDrive,
  Cpu,
  Layers,
  Clock,
  ExternalLink,
  Zap,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useTraffic } from '../../context/TrafficContext';
import { Packet, Protocol } from '../../types/traffic';

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: '#06b6d4',   // cyan-500
  UDP: '#3b82f6',   // blue-500
  HTTP: '#10b981',  // emerald-500
  HTTPS: '#8b5cf6', // purple-500
  DNS: '#f59e0b',   // amber-500
  ICMP: '#ec4899',  // pink-500
  SSH: '#6366f1',   // indigo-500
  ARP: '#64748b',   // slate-500
};

export const DashboardView: React.FC<{
  onNavigateTab: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const {
    packets,
    stats,
    alerts,
    setSelectedPacket,
    injectAttack,
  } = useTraffic();

  // 1. Time-series data for activity chart (grouped into 10 buckets or time slices)
  const activityData = useMemo(() => {
    if (packets.length === 0) return [];
    const reversed = [...packets].reverse();
    const bucketSize = Math.max(1, Math.floor(reversed.length / 14));
    const points: { time: string; packets: number; bytes: number; threats: number }[] = [];

    for (let i = 0; i < reversed.length; i += bucketSize) {
      const slice = reversed.slice(i, i + bucketSize);
      const totalBytes = slice.reduce((sum, p) => sum + p.packetSize, 0);
      const threats = slice.filter((p) => p.status !== 'normal').length;
      points.push({
        time: slice[0].timestamp.split('.')[0],
        packets: slice.length,
        bytes: Math.round(totalBytes / 1024),
        threats,
      });
    }

    return points.slice(-14);
  }, [packets]);

  // 2. Protocol Distribution for Donut Chart
  const protocolData = useMemo(() => {
    const counts: Record<string, number> = {};
    packets.forEach((p) => {
      counts[p.protocol] = (counts[p.protocol] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / (packets.length || 1)) * 100),
      color: PROTOCOL_COLORS[name] || '#94a3b8',
    }));
  }, [packets]);

  // 3. Traffic volume by protocol (Bytes)
  const protocolVolumeData = useMemo(() => {
    const bytesMap: Record<string, number> = {};
    packets.forEach((p) => {
      bytesMap[p.protocol] = (bytesMap[p.protocol] || 0) + p.packetSize;
    });

    return Object.entries(bytesMap)
      .map(([protocol, bytes]) => ({
        protocol,
        kbytes: Number((bytes / 1024).toFixed(1)),
        color: PROTOCOL_COLORS[protocol] || '#94a3b8',
      }))
      .sort((a, b) => b.kbytes - a.kbytes);
  }, [packets]);

  // 4. Top Source IP addresses
  const topSourceIps = useMemo(() => {
    const map = new Map<string, { count: number; bytes: number; anomalous: number }>();
    packets.forEach((p) => {
      const cur = map.get(p.sourceIp) || { count: 0, bytes: 0, anomalous: 0 };
      cur.count += 1;
      cur.bytes += p.packetSize;
      if (p.status !== 'normal') cur.anomalous += 1;
      map.set(p.sourceIp, cur);
    });

    return Array.from(map.entries())
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        bytesKb: (data.bytes / 1024).toFixed(1),
        anomalous: data.anomalous,
        role:
          ip.startsWith('192.168.1.1') && ip === '192.168.1.1'
            ? 'Gateway Router'
            : ip.startsWith('192.168.') || ip.startsWith('10.')
            ? 'Internal Host'
            : data.anomalous > 2
            ? 'Suspicious Actor'
            : 'External Cloud',
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [packets]);

  // 5. Recent Packets
  const recentPackets = useMemo(() => packets.slice(0, 8), [packets]);

  const activeAlerts = alerts.filter((a) => a.status === 'active');

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Packets */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 font-medium">TOTAL PACKETS ANALYZED</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{stats.totalPackets.toLocaleString()}</div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              {stats.activeProtocolsCount} protocols
            </span>
            <span>monitored live</span>
          </div>
        </div>

        {/* Card 2: Total Data Transferred */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 font-medium">DATA TRANSFERRED</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {(stats.totalBytes / 1024).toFixed(1)} <span className="text-sm font-normal text-slate-400">KB</span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span>Avg Packet:</span>
            <span className="font-mono text-cyan-300 font-semibold">{stats.avgPacketSize} Bytes</span>
          </div>
        </div>

        {/* Card 3: Ingress vs Egress */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-400 font-medium">TRAFFIC DIRECTION</span>
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
              <div>
                <div className="text-[10px] text-slate-400">INCOMING</div>
                <div className="font-mono text-xs font-semibold text-slate-200">
                  {(stats.incomingBytes / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
              <div>
                <div className="text-[10px] text-slate-400">OUTGOING</div>
                <div className="font-mono text-xs font-semibold text-slate-200">
                  {(stats.outgoingBytes / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2.5 flex">
            <div
              className="bg-emerald-400 h-full"
              style={{
                width: `${
                  stats.totalBytes > 0
                    ? Math.round((stats.incomingBytes / stats.totalBytes) * 100)
                    : 50
                }%`,
              }}
            ></div>
            <div
              className="bg-blue-400 h-full"
              style={{
                width: `${
                  stats.totalBytes > 0
                    ? Math.round((stats.outgoingBytes / stats.totalBytes) * 100)
                    : 50
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Card 4: Suspicious / Threat Count */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 font-medium">SECURITY THREATS</span>
            <div
              className={`p-2 rounded-lg border ${
                activeAlerts.length > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 flex items-center gap-2">
            <span className={activeAlerts.length > 0 ? 'text-rose-400' : 'text-slate-100'}>
              {stats.suspiciousCount + stats.maliciousCount}
            </span>
            <span className="text-xs font-normal text-slate-400">flagged pkts</span>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-rose-400 font-mono">{activeAlerts.length} active alerts</span>
            <button
              onClick={() => onNavigateTab('security')}
              className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5"
            >
              Review IDS <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line / Area Chart: Network Activity Over Time */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-mono text-sm font-semibold text-slate-200">
                NETWORK ACTIVITY OVER TIME
              </h2>
              <p className="text-xs text-slate-400">Packet throughput &amp; bandwidth volume trends</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> Packets
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400"></span> Volume (KB)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPackets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBytes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="packets"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPackets)"
                    name="Packets"
                  />
                  <Area
                    type="monotone"
                    dataKey="bytes"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBytes)"
                    name="Volume (KB)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                Awaiting telemetry packets...
              </div>
            )}
          </div>
        </div>

        {/* Protocol Distribution Donut Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-mono text-sm font-semibold text-slate-200">
                PROTOCOL DISTRIBUTION
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                L3 / L4 / L7
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Relative packet frequency by network protocol</p>
          </div>

          <div className="h-44 w-full">
            {protocolData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={protocolData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {protocolData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} packets`, `${name}`]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No data
              </div>
            )}
          </div>

          {/* Protocol Legend Pills */}
          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800">
            {protocolData.slice(0, 6).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[11px] font-mono px-2 py-1 rounded bg-slate-950/60">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300">{item.name}</span>
                </span>
                <span className="text-slate-400 font-semibold">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Split: Top Source IPs & Protocol Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Source IP Addresses Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-mono text-sm font-semibold text-slate-200">
                TOP SOURCE IP TALKERS
              </h2>
              <p className="text-xs text-slate-400">Hosts generating highest traffic density</p>
            </div>
            <button
              onClick={() => onNavigateTab('analysis')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-mono"
            >
              Full Analysis &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">SOURCE IP</th>
                  <th className="pb-2">HOST CLASSIFICATION</th>
                  <th className="pb-2 text-right">PACKETS</th>
                  <th className="pb-2 text-right">VOLUME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {topSourceIps.map((talker) => (
                  <tr key={talker.ip} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-medium flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          talker.anomalous > 0 ? 'bg-rose-400' : 'bg-emerald-400'
                        }`}
                      ></span>
                      <span className={talker.anomalous > 0 ? 'text-rose-300' : 'text-slate-200'}>
                        {talker.ip}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 text-[11px]">{talker.role}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-200">{talker.count}</td>
                    <td className="py-2.5 text-right text-cyan-400 font-semibold">{talker.bytesKb} KB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Protocol Traffic Volume Bar Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-mono text-sm font-semibold text-slate-200">
                BANDWIDTH BY PROTOCOL (KB)
              </h2>
              <p className="text-xs text-slate-400">Cumulative payload throughput distribution</p>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              Payload Metrics
            </span>
          </div>

          <div className="h-56 w-full">
            {protocolVolumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={protocolVolumeData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="protocol" stroke="#94a3b8" tick={{ fontSize: 11 }} width={50} />
                  <Tooltip
                    formatter={(val: any) => [`${val} KB`, 'Volume']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="kbytes" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                No telemetry available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Network Activity Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-mono text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>RECENT NETWORK PACKET ACTIVITY</span>
            </h2>
            <p className="text-xs text-slate-400">Latest packet captures with OSI dissection inspect option</p>
          </div>
          <button
            onClick={() => onNavigateTab('live')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
          >
            Open Live Monitor Stream &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2.5">TIMESTAMP</th>
                <th className="pb-2.5">SOURCE</th>
                <th className="pb-2.5">DESTINATION</th>
                <th className="pb-2.5">PROTO</th>
                <th className="pb-2.5">PORTS</th>
                <th className="pb-2.5 text-right">SIZE</th>
                <th className="pb-2.5 text-center">STATUS</th>
                <th className="pb-2.5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentPackets.map((pkt) => (
                <tr key={pkt.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-2 text-slate-400 text-[11px]">{pkt.timestamp}</td>
                  <td className="py-2 text-emerald-300 font-medium">{pkt.sourceIp}</td>
                  <td className="py-2 text-cyan-300 font-medium">{pkt.destinationIp}</td>
                  <td className="py-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        backgroundColor: `${PROTOCOL_COLORS[pkt.protocol] || '#64748b'}25`,
                        color: PROTOCOL_COLORS[pkt.protocol] || '#94a3b8',
                      }}
                    >
                      {pkt.protocol}
                    </span>
                  </td>
                  <td className="py-2 text-slate-400 text-[11px]">
                    {pkt.sourcePort} &rarr; {pkt.destinationPort}
                  </td>
                  <td className="py-2 text-right text-slate-300 font-mono">{pkt.packetSize} B</td>
                  <td className="py-2 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pkt.status === 'malicious'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                          : pkt.status === 'suspicious'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {pkt.status}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => setSelectedPacket(pkt)}
                      className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
