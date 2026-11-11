import React, { useState } from 'react';
import { ShieldAlert, Info, X, ExternalLink } from 'lucide-react';

export const SimulatedBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) {
    return (
      <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-1.5 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-mono text-cyan-400 font-semibold">[DEMO MODE]</span> Generated traffic records modeled for academic simulation.
        </span>
        <button
          onClick={() => setDismissed(false)}
          className="text-cyan-400 hover:underline text-xs flex items-center gap-1"
        >
          View Sandbox Notice
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-blue-950/60 border-b border-cyan-500/30 px-4 py-2.5 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-start md:items-center gap-2.5">
          <div className="p-1 rounded bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5 md:mt-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-cyan-300 bg-cyan-900/60 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[11px]">
                SIMULATED DEMO DATA
              </span>
              <span className="text-slate-300">
                Browsers operate inside a strict sandbox without raw socket permissions (<code className="font-mono text-cyan-200">AF_PACKET</code> / <code className="font-mono text-cyan-200">libpcap</code>).
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                {expanded ? 'Show less' : 'Read technical context for project review'}
              </button>
            </div>
            {expanded && (
              <p className="mt-2 text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 rounded border border-slate-800 text-[11px]">
                <strong className="text-white">Academic Notice for CSE Reviewers:</strong> Real-world packet sniffers like Wireshark or tcpdump require kernel-level network interface drivers in promiscuous mode. To evaluate network behavior, IDS heuristics, and CSV telemetry safely within client-side React without third-party native binaries or security privilege escalations, this application employs a stochastic stochastic packet generator alongside a real-time CSV trace parser.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          <span className="font-mono text-[11px] text-slate-400">
            Environment: <span className="text-emerald-400">Safe Sandbox (No Root Required)</span>
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Minimize notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
