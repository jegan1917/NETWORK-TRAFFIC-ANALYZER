import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ShieldCheck,
  Terminal,
  Zap,
  Info,
  Clock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useTraffic } from '../../context/TrafficContext';
import { SecurityAlert, SeverityLevel } from '../../types/traffic';
import { IDS_EDUCATIONAL_NOTES } from '../../services/threatDetector';

export const SecurityThreatsView: React.FC = () => {
  const {
    alerts,
    updateAlertStatus,
    dismissAlert,
    injectAttack,
  } = useTraffic();

  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlert | null>(null);

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const criticalCount = alerts.filter((a) => a.severity === 'Critical').length;
  const highCount = alerts.filter((a) => a.severity === 'High').length;
  const mediumCount = alerts.filter((a) => a.severity === 'Medium').length;
  const resolvedCount = alerts.filter((a) => a.status === 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Educational Heuristics Disclaimer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-base font-bold text-slate-100">
                  INTRUSION DETECTION SYSTEM (IDS)
                </h2>
                <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  Rule-Based Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Deterministic heuristic rules continuously correlate network packets to surface reconnaissance scans, embryonic SYN floods, and unauthorized port bindings.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch lg:self-auto">
            <button
              onClick={() => injectAttack('portScan')}
              className="flex-1 lg:flex-none px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Port Scan</span>
            </button>
            <button
              onClick={() => injectAttack('synFlood')}
              className="flex-1 lg:flex-none px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>Simulate SYN Flood</span>
            </button>
          </div>
        </div>

        {/* Academic Disclaimer Box */}
        <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-amber-500/30 text-xs text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong className="text-amber-300 font-mono">Academic Project Clarification:</strong> Heuristic detection rules identify behavioral traffic anomalies (e.g. repeated connection attempts across multiple ports, asymmetric SYN/ACK ratios). In accordance with network security best practices, heuristic alerts represent indicators for SOC investigation, not definitive proof of an active external cyberattack.
          </div>
        </div>
      </div>

      {/* Threat Severity Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
        <div className="bg-slate-900/80 border border-rose-900/40 rounded-xl p-4">
          <div className="text-[11px] text-rose-400 font-semibold mb-1">CRITICAL ALERTS</div>
          <div className="text-2xl font-bold text-rose-300">{criticalCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Exploit / C2 / SYN Flood</div>
        </div>

        <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-4">
          <div className="text-[11px] text-amber-400 font-semibold mb-1">HIGH SEVERITY</div>
          <div className="text-2xl font-bold text-amber-300">{highCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Port Scans &amp; Recon</div>
        </div>

        <div className="bg-slate-900/80 border border-blue-900/40 rounded-xl p-4">
          <div className="text-[11px] text-blue-400 font-semibold mb-1">MEDIUM SEVERITY</div>
          <div className="text-2xl font-bold text-blue-300">{mediumCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Traffic Spikes &amp; ICMP</div>
        </div>

        <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-4">
          <div className="text-[11px] text-emerald-400 font-semibold mb-1">RESOLVED THREATS</div>
          <div className="text-2xl font-bold text-emerald-300">{resolvedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Acknowledged by Admin</div>
        </div>
      </div>

      {/* Alerts Table with Severity & Status Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <h3 className="font-mono text-sm font-semibold text-slate-200">
              SECURITY ALERTS LOG ({filteredAlerts.length})
            </h3>
            <p className="text-xs text-slate-400">Triggered heuristic rules and remediation status</p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredAlerts.length > 0 ? (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">TIMESTAMP</th>
                  <th className="py-2.5 px-2">SEVERITY</th>
                  <th className="py-2.5 px-3">RULE TRIGGER</th>
                  <th className="py-2.5 px-3">SOURCE IP</th>
                  <th className="py-2.5 px-3">TARGET</th>
                  <th className="py-2.5 px-3">DETECTION REASON</th>
                  <th className="py-2.5 px-2 text-center">STATUS</th>
                  <th className="py-2.5 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredAlerts.map((alert) => {
                  const isCrit = alert.severity === 'Critical';
                  const isHigh = alert.severity === 'High';

                  return (
                    <tr
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                        isCrit ? 'bg-rose-950/20' : isHigh ? 'bg-amber-950/15' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {alert.timestamp}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            alert.severity === 'Critical'
                              ? 'bg-rose-900/60 text-rose-300 border border-rose-500/50'
                              : alert.severity === 'High'
                              ? 'bg-amber-900/60 text-amber-300 border border-amber-500/50'
                              : alert.severity === 'Medium'
                              ? 'bg-blue-900/60 text-blue-300 border border-blue-500/50'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {alert.ruleName.replace('RULE_', '')}
                      </td>
                      <td className="py-3 px-3 text-rose-400 font-semibold whitespace-nowrap">
                        {alert.sourceIp}
                      </td>
                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {alert.destinationIp || 'Subnet'}
                        {alert.targetPort ? `:${alert.targetPort}` : ''}
                      </td>
                      <td className="py-3 px-3 text-slate-300 text-[11px] max-w-sm truncate" title={alert.reason}>
                        {alert.reason}
                      </td>
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold capitalize ${
                            alert.status === 'resolved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : alert.status === 'investigating'
                              ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {alert.status !== 'resolved' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(alert.id, 'resolved');
                              }}
                              className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[10px]"
                              title="Mark as Resolved"
                            >
                              Resolve
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateAlertStatus(alert.id, 'active');
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                              title="Reopen Alert"
                            >
                              Reopen
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissAlert(alert.id);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                            title="Dismiss Alert"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-mono text-sm font-semibold text-slate-200">
                No active threats matching current filters
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No security alerts found. You can simulate attack scenarios using the test buttons above to trigger live rule evaluation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected Alert Remediation Drawer / Modal */}
      {selectedAlert && (
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-rose-500/20 text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="font-mono text-sm font-bold text-slate-100">
                INVESTIGATION &amp; REMEDIATION: {selectedAlert.ruleName}
              </h4>
            </div>
            <button
              onClick={() => setSelectedAlert(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block mb-1">DETECTION REASON:</span>
              <p className="text-slate-200 bg-slate-950 p-2.5 rounded border border-slate-800 leading-relaxed">
                {selectedAlert.reason}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">RECOMMENDED REMEDIATION ACTION:</span>
              <div className="text-emerald-400 bg-slate-950 p-2.5 rounded border border-emerald-500/30 leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>SysAdmin / Firewall Action</span>
                </div>
                <code className="text-[11px] block text-emerald-300">
                  {selectedAlert.recommendedAction}
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heuristic Rules Encyclopedia for Academic Review */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="font-mono text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>TRANSPARENT DETECTION RULE MATRIX (CSE VIVA REFERENCE)</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Heuristic definitions explaining how this application detects network anomalies without external black-box models
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {IDS_EDUCATIONAL_NOTES.detectionRules.map((rule) => (
            <div
              key={rule.code}
              className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1.5 text-xs font-mono"
            >
              <div className="text-cyan-400 font-bold text-[11px]">{rule.code}</div>
              <p className="text-slate-300 text-[11px] leading-tight">{rule.description}</p>
              <div className="pt-1.5 border-t border-slate-800/60 text-[10px] text-emerald-400">
                <span className="text-slate-500">Mitigation:</span> {rule.mitigation}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
