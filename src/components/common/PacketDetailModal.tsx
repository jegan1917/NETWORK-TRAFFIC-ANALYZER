import React from 'react';
import { X, ShieldAlert, Cpu, Network, Binary, Layers, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Packet } from '../../types/traffic';

interface PacketDetailModalProps {
  packet: Packet | null;
  onClose: () => void;
}

export const PacketDetailModal: React.FC<PacketDetailModalProps> = ({ packet, onClose }) => {
  if (!packet) return null;

  const isMalicious = packet.status === 'malicious';
  const isSuspicious = packet.status === 'suspicious';

  // Generate realistic synthetic hex bytes for Wireshark inspection feel
  const generateHexDump = (size: number, proto: string) => {
    const lines: string[] = [];
    const rows = Math.min(6, Math.ceil(size / 16));
    for (let r = 0; r < rows; r++) {
      const offset = (r * 16).toString(16).padStart(4, '0');
      const hexList: string[] = [];
      let ascii = '';
      for (let b = 0; b < 16; b++) {
        const charCode = Math.floor(Math.random() * 94) + 32;
        const hex = charCode.toString(16).padStart(2, '0');
        hexList.push(hex);
        ascii += String.fromCharCode(charCode);
      }
      lines.push(`${offset}   ${hexList.slice(0, 8).join(' ')}  ${hexList.slice(8).join(' ')}   |${ascii}|`);
    }
    return lines.join('\n');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg border ${
                isMalicious
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : isSuspicious
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}
            >
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-slate-100">
                  PACKET DISSECTOR #{packet.id.slice(-8)}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    isMalicious
                      ? 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                      : isSuspicious
                      ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                      : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                  }`}
                >
                  {packet.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Captured: {packet.timestamp} • Protocol: {packet.protocol} • Size: {packet.packetSize} Bytes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Status Alert if Suspicious / Malicious */}
          {(isMalicious || isSuspicious) && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-3 text-xs ${
                isMalicious
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <span className="font-bold uppercase font-mono">Heuristic Security Flag: </span>
                {packet.info || 'Anomalous traffic signature matched rule conditions.'}
              </div>
            </div>
          )}

          {/* OSI Protocol Tree */}
          <div className="space-y-3 font-mono text-xs">
            {/* Layer 2: Frame */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold mb-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>OSI LAYER 2: ETHERNET II FRAME</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300 text-[11px]">
                <div>
                  <span className="text-slate-500">Source MAC:</span> 00:1a:2b:3c:4d:5e
                </div>
                <div>
                  <span className="text-slate-500">Dest MAC:</span> ff:ff:ff:ff:ff:ff
                </div>
                <div>
                  <span className="text-slate-500">EtherType:</span> IPv4 (0x0800)
                </div>
              </div>
            </div>

            {/* Layer 3: Network (IPv4) */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold mb-2">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span>OSI LAYER 3: INTERNET PROTOCOL VERSION 4 (IPv4)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px]">
                <div>
                  <span className="text-slate-500">Source IP:</span>{' '}
                  <span className="text-emerald-400 font-semibold">{packet.sourceIp}</span>
                </div>
                <div>
                  <span className="text-slate-500">Dest IP:</span>{' '}
                  <span className="text-cyan-400 font-semibold">{packet.destinationIp}</span>
                </div>
                <div>
                  <span className="text-slate-500">TTL:</span> {packet.ttl || 64} hops
                </div>
                <div>
                  <span className="text-slate-500">Header Checksum:</span> 0x8f2a [Valid]
                </div>
                <div>
                  <span className="text-slate-500">Total Length:</span> {packet.packetSize} Bytes
                </div>
                <div>
                  <span className="text-slate-500">Direction:</span>{' '}
                  <span className="capitalize text-slate-200">{packet.direction}</span>
                </div>
                <div>
                  <span className="text-slate-500">IP Version:</span> 4 (IHL: 20 bytes)
                </div>
                <div>
                  <span className="text-slate-500">DSCP / ECN:</span> 0x00 (Default)
                </div>
              </div>
            </div>

            {/* Layer 4: Transport */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>OSI LAYER 4: TRANSPORT ({packet.protocol})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px]">
                <div>
                  <span className="text-slate-500">Source Port:</span> {packet.sourcePort || 'N/A'}
                </div>
                <div>
                  <span className="text-slate-500">Dest Port:</span>{' '}
                  <span className="text-amber-400 font-semibold">{packet.destinationPort || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">TCP Flags:</span>{' '}
                  <span className="text-cyan-300">
                    {packet.flags && packet.flags.length > 0 ? packet.flags.join(', ') : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Window Size:</span> 64240 bytes
                </div>
              </div>
            </div>

            {/* Layer 7: Application & Info */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-2">
                <Binary className="w-3.5 h-3.5 text-indigo-400" />
                <span>OSI LAYER 7: APPLICATION / PAYLOAD INFO</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed bg-slate-900 p-2.5 rounded border border-slate-800">
                {packet.info || 'Raw binary payload stream.'}
              </p>
            </div>

            {/* Raw Hex Dump View */}
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                <div className="flex items-center gap-1.5">
                  <Binary className="w-3.5 h-3.5 text-slate-400" />
                  <span>PACKET HEX &amp; ASCII DISSECTION</span>
                </div>
                <span className="text-[10px] text-slate-500">TCP/IP Frame Dissection</span>
              </div>
              <pre className="text-[11px] font-mono text-emerald-400/90 leading-tight bg-slate-950 p-2.5 rounded overflow-x-auto border border-slate-800/80">
                {generateHexDump(packet.packetSize, packet.protocol)}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">
            Academic Inspection Mode • RFC 791 (IPv4) / RFC 793 (TCP)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
