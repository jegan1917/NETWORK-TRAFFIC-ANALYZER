import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  HardDrive,
  Layers,
  Cpu,
  Hash,
  Server,
  Network,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useTraffic } from '../../context/TrafficContext';
import { Packet, Protocol } from '../../types/traffic';

const PROTOCOL_COLORS: Record<string, string> = {
  TCP: '#06b6d4',
  UDP: '#3b82f6',
  HTTP: '#10b981',
  HTTPS: '#8b5cf6',
  DNS: '#f59e0b',
  ICMP: '#ec4899',
  SSH: '#6366f1',
  ARP: '#64748b',
};

const COMMON_PORTS: Record<number, string> = {
  80: 'HTTP (Web)',
  443: 'HTTPS (TLS)',
  53: 'DNS (Name Resolution)',
  22: 'SSH (Secure Shell)',
  21: 'FTP (File Transfer)',
  23: 'Telnet (Unencrypted)',
  3389: 'RDP (Remote Desktop)',
  3306: 'MySQL Database',
  8080: 'HTTP Alternate / Proxy',
  4444: 'Metasploit Listener',
  1337: 'Hacker Backdoor',
  31337: 'Back Orifice Trojan',
};

export const AnalysisView: React.FC = () => {
  const { packets, stats } = useTraffic();
  const [timeWindow, setTimeWindow] = useState<'all' | 'recent'>('all');

  // Filtered packets based on time selection
  const analyzedPackets = useMemo(() => {
    if (timeWindow === 'recent') {
      return packets.slice(0, 50);
    }
    return packets;
  }, [packets, timeWindow]);

  // 1. Packet Size Distribution Histogram (Buckets)
  const sizeDistributionData = useMemo(() => {
    const buckets = [
      { range: '< 128 B', label: 'Small Control Frames (ACK/SYN/ARP)', count: 0, bytes: 0 },
      { range: '128-512 B', label: 'Medium Payloads (DNS/SSH/Headers)', count: 0, bytes: 0 },
      { range: '512-1024 B', label: 'Large Packets (HTTP/TLS Payloads)', count: 0, bytes: 0 },
      { range: '> 1024 B', label: 'MTU / Jumbo Frames (Bulk Transfers)', count: 0, bytes: 0 },
    ];

    analyzedPackets.forEach((p) => {
      if (p.packetSize < 128) {
        buckets[0].count++;
        buckets[0].bytes += p.packetSize;
      } else if (p.packetSize <= 512) {
        buckets[1].count++;
        buckets[1].bytes += p.packetSize;
      } else if (p.packetSize <= 1024) {
        buckets[2].count++;
        buckets[2].bytes += p.packetSize;
      } else {
        buckets[3].count++;
        buckets[3].bytes += p.packetSize;
      }
    });

    return buckets;
  }, [analyzedPackets]);

  // 2. Protocol Frequency & Ranking
  const protocolRankData = useMemo(() => {
    const map: Record<string, { count: number; bytes: number }> = {};
    analyzedPackets.forEach((p) => {
      const cur = map[p.protocol] || { count: 0, bytes: 0 };
      cur.count++;
      cur.bytes += p.packetSize;
      map[p.protocol] = cur;
    });

    return Object.entries(map)
      .map(([protocol, data]) => ({
        protocol,
        count: data.count,
        bytesKb: (data.bytes / 1024).toFixed(1),
        percentage: ((data.count / (analyzedPackets.length || 1)) * 100).toFixed(1),
        color: PROTOCOL_COLORS[protocol] || '#94a3b8',
      }))
      .sort((a, b) => b.count - a.count);
  }, [analyzedPackets]);

  // 3. Top Destination IPs
  const topDestinationIps = useMemo(() => {
    const map = new Map<string, { count: number; bytes: number; ports: Set<number> }>();
    analyzedPackets.forEach((p) => {
      const cur = map.get(p.destinationIp) || { count: 0, bytes: 0, ports: new Set() };
      cur.count++;
      cur.bytes += p.packetSize;
      if (p.destinationPort > 0) cur.ports.add(p.destinationPort);
      map.set(p.destinationIp, cur);
    });

    return Array.from(map.entries())
      .map(([ip, data]) => ({
        ip,
        count: data.count,
        bytesKb: (data.bytes / 1024).toFixed(1),
        distinctPorts: data.ports.size,
        commonPortList: Array.from(data.ports).slice(0, 3).join(', '),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [analyzedPackets]);

  // 4. Most active Destination Ports
  const topPortsData = useMemo(() => {
    const portMap = new Map<number, { count: number; proto: string }>();
    analyzedPackets.forEach((p) => {
      if (p.destinationPort > 0) {
        const cur = portMap.get(p.destinationPort) || { count: 0, proto: p.protocol };
        cur.count++;
        portMap.set(p.destinationPort, cur);
      }
    });

    return Array.from(portMap.entries())
      .map(([port, data]) => ({
        port,
        service: COMMON_PORTS[port] || (port > 49152 ? 'Dynamic / Ephemeral' : 'Unregistered Port'),
        count: data.count,
        proto: data.proto,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [analyzedPackets]);

  // 5. Direction calculation
  const totalAnalyzedBytes = analyzedPackets.reduce((sum, p) => sum + p.packetSize, 0);
  const incomingBytes = analyzedPackets.filter((p) => p.direction === 'incoming').reduce((sum, p) => sum + p.packetSize, 0);
  const outgoingBytes = analyzedPackets.filter((p) => p.direction === 'outgoing').reduce((sum, p) => sum + p.packetSize, 0);
  const internalBytes = analyzedPackets.filter((p) => p.direction === 'internal').reduce((sum, p) => sum + p.packetSize, 0);

  return (
    <div className="space-y-6">
      {/* Title & Filter Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-mono text-base font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>TRAFFIC TELEMETRY &amp; STATISTICAL ANALYSIS</span>
          </h2>
          <p className="text-xs text-slate-400">
            Deep algorithmic dissection of packet sizes, port entropy, and directional flow metrics
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">Time Window:</span>
          <button
            onClick={() => setTimeWindow('all')}
            className={`px-3 py-1 rounded-lg border transition-colors ${
              timeWindow === 'all'
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            All Buffer ({packets.length})
          </button>
          <button
            onClick={() => setTimeWindow('recent')}
            className={`px-3 py-1 rounded-lg border transition-colors ${
              timeWindow === 'recent'
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            Last 50 Packets
          </button>
        </div>
      </div>

      {/* Analytical KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs mb-1">TOTAL ANALYZED</div>
          <div className="text-2xl font-bold text-slate-100">{analyzedPackets.length} Packets</div>
          <div className="text-xs text-cyan-400 mt-2">{(totalAnalyzedBytes / 1024).toFixed(1)} KB Total Volume</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs mb-1">MEAN PACKET SIZE</div>
          <div className="text-2xl font-bold text-emerald-400">
            {analyzedPackets.length > 0 ? Math.round(totalAnalyzedBytes / analyzedPackets.length) : 0} Bytes
          </div>
          <div className="text-xs text-slate-400 mt-2">Std Ethernet MTU: 1500 B</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs mb-1">INGRESS / EGRESS RATIO</div>
          <div className="text-2xl font-bold text-blue-400">
            {outgoingBytes > 0 ? (incomingBytes / outgoingBytes).toFixed(2) : '1.0'} : 1
          </div>
          <div className="text-xs text-slate-400 mt-2">
            In: {(incomingBytes / 1024).toFixed(1)}K | Out: {(outgoingBytes / 1024).toFixed(1)}K
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="text-slate-400 text-xs mb-1">DOMINANT PROTOCOL</div>
          <div className="text-2xl font-bold text-purple-400">
            {protocolRankData[0]?.protocol || 'TCP'}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {protocolRankData[0]?.percentage || '0'}% of all traffic
          </div>
        </div>
      </div>

      {/* Packet Size Histogram & Ingress/Egress Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packet Size Distribution Chart */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-mono text-sm font-semibold text-slate-200">
                PACKET SIZE DISTRIBUTION HISTOGRAM
              </h3>
              <p className="text-xs text-slate-400">Frequency by MTU payload classification tiers</p>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
              L3 Payload Sizing
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sizeDistributionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} packets`, 'Frequency']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400">
            <div>
              <span className="text-emerald-400 font-semibold">&lt; 128B:</span> TCP Handshakes / ACK / Keepalive
            </div>
            <div>
              <span className="text-cyan-400 font-semibold">&gt; 1024B:</span> Encrypted TLS records / Video streams
            </div>
          </div>
        </div>

        {/* Directional Volume Ingress vs Egress Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-mono text-sm font-semibold text-slate-200">
                DIRECTIONAL TRAFFIC BREAKDOWN
              </h3>
              <p className="text-xs text-slate-400">Inbound (Ingress), Outbound (Egress) &amp; LAN Internal</p>
            </div>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
              Flow Topology
            </span>
          </div>

          <div className="space-y-4">
            {/* Incoming */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Incoming Ingress (External &rarr; LAN)</span>
                </span>
                <span className="text-slate-300 font-bold">
                  {(incomingBytes / 1024).toFixed(1)} KB (
                  {totalAnalyzedBytes > 0 ? Math.round((incomingBytes / totalAnalyzedBytes) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${
                      totalAnalyzedBytes > 0 ? Math.round((incomingBytes / totalAnalyzedBytes) * 100) : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Outgoing */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Outgoing Egress (LAN &rarr; External)</span>
                </span>
                <span className="text-slate-300 font-bold">
                  {(outgoingBytes / 1024).toFixed(1)} KB (
                  {totalAnalyzedBytes > 0 ? Math.round((outgoingBytes / totalAnalyzedBytes) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${
                      totalAnalyzedBytes > 0 ? Math.round((outgoingBytes / totalAnalyzedBytes) * 100) : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Internal */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="flex items-center gap-1.5 text-purple-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Internal East-West (LAN &rarr; LAN)</span>
                </span>
                <span className="text-slate-300 font-bold">
                  {(internalBytes / 1024).toFixed(1)} KB (
                  {totalAnalyzedBytes > 0 ? Math.round((internalBytes / totalAnalyzedBytes) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-purple-500 h-full rounded-full"
                  style={{
                    width: `${
                      totalAnalyzedBytes > 0 ? Math.round((internalBytes / totalAnalyzedBytes) * 100) : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed">
            <span className="text-cyan-400 font-bold">Security Observation:</span> Symmetrical or high outbound-to-inbound volume can signal unauthorized data exfiltration, database dumps, or reverse-shell C2 communication channels.
          </div>
        </div>
      </div>

      {/* Protocol Hierarchy Rank & Top Destination Ports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Protocol Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-slate-200 mb-1">
            PROTOCOL TELEMETRY HIERARCHY
          </h3>
          <p className="text-xs text-slate-400 mb-4">Ranked breakdown of network protocols observed</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">PROTOCOL</th>
                  <th className="pb-2 text-right">PACKETS</th>
                  <th className="pb-2 text-right">TOTAL VOLUME</th>
                  <th className="pb-2 text-right">TRAFFIC SHARE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {protocolRankData.map((item) => (
                  <tr key={item.protocol} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                      <span className="text-slate-200">{item.protocol}</span>
                    </td>
                    <td className="py-2.5 text-right font-medium">{item.count}</td>
                    <td className="py-2.5 text-right text-cyan-400 font-medium">{item.bytesKb} KB</td>
                    <td className="py-2.5 text-right text-emerald-400 font-semibold">{item.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Active Destination Ports */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h3 className="font-mono text-sm font-semibold text-slate-200 mb-1">
            TOP TARGET DESTINATION PORTS
          </h3>
          <p className="text-xs text-slate-400 mb-4">Well-known services and destination port distribution</p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">PORT</th>
                  <th className="pb-2">ASSOCIATED SERVICE</th>
                  <th className="pb-2 text-right">PROTO</th>
                  <th className="pb-2 text-right">HITS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {topPortsData.map((pt) => (
                  <tr key={pt.port} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-bold text-cyan-300">{pt.port}</td>
                    <td className="py-2.5 text-slate-300 text-[11px]">{pt.service}</td>
                    <td className="py-2.5 text-right text-slate-400">{pt.proto}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-200">{pt.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
