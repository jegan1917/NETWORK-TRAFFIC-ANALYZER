import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  ShieldAlert,
  GraduationCap,
  HelpCircle,
  HardDrive,
  Activity,
  Layers,
} from 'lucide-react';
import { useTraffic } from '../../context/TrafficContext';
import {
  exportPacketsToCsv,
  exportAlertsToCsv,
  triggerFileDownload,
} from '../../services/csvParser';

export const ReportsView: React.FC = () => {
  const { packets, stats, alerts } = useTraffic();
  const [activeTab, setActiveTab] = useState<'summary' | 'viva'>('summary');

  // Generate printable HTML Report
  const generatePrintableHtmlReport = () => {
    const criticalAlerts = alerts.filter((a) => a.severity === 'Critical');
    const highAlerts = alerts.filter((a) => a.severity === 'High');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Network Traffic Analysis & Threat Audit Report</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 40px;
      color: #1e293b;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
    .badge {
      background: #0f172a;
      color: #fff;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 30px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      padding: 16px;
      border-radius: 8px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 11px;
      color: #64748b;
      font-weight: bold;
      text-transform: uppercase;
    }
    .kpi-val {
      font-size: 22px;
      font-weight: bold;
      color: #0f172a;
      margin-top: 4px;
    }
    h2 {
      font-size: 16px;
      border-left: 4px solid #0ea5e9;
      padding-left: 10px;
      color: #0f172a;
      margin-top: 28px;
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 24px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
    }
    .crit { color: #dc2626; font-weight: bold; }
    .high { color: #ea580c; font-weight: bold; }
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 16px;
      margin-top: 40px;
      font-size: 11px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { margin: 20px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Network Traffic Analyzer</h1>
      <div class="subtitle">Academic Mini Project Evaluation Report • Department of Computer Science & Engineering</div>
      <div class="subtitle">Generated on: ${new Date().toUTCString()}</div>
    </div>
    <div>
      <span class="badge">CONFIDENTIAL / AUDIT</span>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Packets</div>
      <div class="kpi-val">${stats.totalPackets}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Data Volume</div>
      <div class="kpi-val">${(stats.totalBytes / 1024).toFixed(1)} KB</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Ingress / Egress</div>
      <div class="kpi-val">${(stats.incomingBytes / 1024).toFixed(1)} / ${(stats.outgoingBytes / 1024).toFixed(1)} KB</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Active Threats Flagged</div>
      <div class="kpi-val" style="color: #dc2626;">${alerts.length}</div>
    </div>
  </div>

  <h2>1. Security Threat Audit Trail</h2>
  <table>
    <thead>
      <tr>
        <th>Severity</th>
        <th>Timestamp</th>
        <th>Rule Trigger</th>
        <th>Culprit Source IP</th>
        <th>Target IP:Port</th>
        <th>Heuristic Reason</th>
        <th>Remediation Action</th>
      </tr>
    </thead>
    <tbody>
      ${
        alerts.length > 0
          ? alerts
              .map(
                (a) => `
        <tr>
          <td class="${a.severity === 'Critical' ? 'crit' : 'high'}">${a.severity}</td>
          <td>${a.timestamp}</td>
          <td>${a.ruleName}</td>
          <td><b>${a.sourceIp}</b></td>
          <td>${a.destinationIp || 'Subnet'}${a.targetPort ? ':' + a.targetPort : ''}</td>
          <td>${a.reason}</td>
          <td><code>${a.recommendedAction}</code></td>
        </tr>
      `
              )
              .join('')
          : '<tr><td colspan="7">No security alerts detected in observation buffer.</td></tr>'
      }
    </tbody>
  </table>

  <h2>2. Recent Network Activity Trace (Sample)</h2>
  <table>
    <thead>
      <tr>
        <th>Timestamp</th>
        <th>Source</th>
        <th>Destination</th>
        <th>Protocol</th>
        <th>Ports</th>
        <th>Size</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${packets
        .slice(0, 15)
        .map(
          (p) => `
        <tr>
          <td>${p.timestamp}</td>
          <td>${p.sourceIp}</td>
          <td>${p.destinationIp}</td>
          <td><b>${p.protocol}</b></td>
          <td>${p.sourcePort} &rarr; ${p.destinationPort}</td>
          <td>${p.packetSize} B</td>
          <td>${p.status.toUpperCase()}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <div>Course: B.E. / B.Tech Computer Science & Engineering (3rd Year Mini Project)</div>
    <div>Project: Network Traffic Analyzer • Simulated Deterministic Heuristic Engine</div>
  </div>

  <script>
    window.onload = function() {
      // Auto-trigger print dialog for convenient saving to PDF
      setTimeout(() => { window.print(); }, 400);
    };
  </script>
</body>
</html>
    `;

    // Open print window safely or download HTML
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } else {
      triggerFileDownload(htmlContent, 'network_traffic_report.html', 'text/html');
    }
  };

  const handleExportPacketsCsv = () => {
    const csv = exportPacketsToCsv(packets);
    triggerFileDownload(csv, `traffic_packets_export_${Date.now()}.csv`);
  };

  const handleExportAlertsCsv = () => {
    const csv = exportAlertsToCsv(alerts);
    triggerFileDownload(csv, `security_threat_alerts_${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-base font-bold text-slate-100">
                AUDIT REPORTS &amp; COLLEGE REVIEW GUIDE
              </h2>
              <p className="text-xs text-slate-400">
                Export comprehensive summaries, printable evaluation sheets, and viva defense documentation
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
          <button
            onClick={generatePrintableHtmlReport}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Printer className="w-4 h-4" />
            <span>Printable HTML Report</span>
          </button>
          <button
            onClick={handleExportPacketsCsv}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <span>Export Packets CSV</span>
          </button>
          <button
            onClick={handleExportAlertsCsv}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-rose-400" />
            <span>Export Alerts CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs: Executive Summary vs Viva / CSE Academic Guide */}
      <div className="flex border-b border-slate-800 font-mono text-xs">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Executive Telemetry Summary</span>
        </button>
        <button
          onClick={() => setActiveTab('viva')}
          className={`px-4 py-2.5 font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'viva'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Academic Viva / Review Guide (Q&amp;A)</span>
        </button>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="font-mono text-sm font-semibold text-slate-200 mb-4">
              EXECUTIVE AUDIT SUMMARY
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs mb-6">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TOTAL SESSIONS / PACKETS</span>
                <span className="text-xl font-bold text-slate-200">{stats.totalPackets}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">TOTAL PAYLOAD BANDWIDTH</span>
                <span className="text-xl font-bold text-cyan-400">{(stats.totalBytes / 1024).toFixed(1)} KB</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">FLAGGED ANOMALIES</span>
                <span className="text-xl font-bold text-rose-400">
                  {stats.suspiciousCount + stats.maliciousCount}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px]">AVG FRAME SIZE</span>
                <span className="text-xl font-bold text-emerald-400">{stats.avgPacketSize} Bytes</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800/80 space-y-2 text-xs font-mono text-slate-300">
              <div className="text-cyan-400 font-bold">ANALYSIS ASSESSMENT:</div>
              <p className="leading-relaxed">
                Network traffic exhibits standard enterprise distribution with primary concentration across HTTPS (port 443) and DNS (port 53). {alerts.length} heuristic alert triggers were registered within the current observation window. Directional analysis indicates {((stats.incomingBytes / (stats.totalBytes || 1)) * 100).toFixed(1)}% inbound ingress and {((stats.outgoingBytes / (stats.totalBytes || 1)) * 100).toFixed(1)}% outbound egress.
              </p>
            </div>
          </div>

          {/* Triggered Security Rules in Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="font-mono text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>ACTIVE SECURITY INCIDENTS ({alerts.length})</span>
            </h3>

            {alerts.length > 0 ? (
              <div className="space-y-3 font-mono text-xs">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            alert.severity === 'Critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="font-bold text-slate-200">{alert.ruleName}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-1">{alert.reason}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-emerald-400 text-[11px] block">
                        Source: <span className="text-slate-200 font-bold">{alert.sourceIp}</span>
                      </span>
                      <span className="text-slate-500 text-[10px]">{alert.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-slate-400">No security incidents flagged in active buffer.</p>
            )}
          </div>
        </div>
      ) : (
        /* Academic Viva / Review Preparation Guide Tab */
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <GraduationCap className="w-5 h-5" />
              <span>THIRD-YEAR CSE MINI-PROJECT VIVA VOCE REFERENCE GUIDE</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Use these prepared technical answers to ace questions from university professors and project external examiners during your viva review:
            </p>

            <div className="space-y-3 pt-2">
              {/* Q1 */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-cyan-300 font-bold mb-1">
                  Q1: Why is simulated data used instead of capturing raw packets directly in the browser?
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Answer:</strong> Web browsers operate in an unprivileged, sandboxed runtime environment (W3C standard) that prevents low-level operating system raw socket access (<code className="text-cyan-400">AF_PACKET</code> / <code className="text-cyan-400">SOCK_RAW</code>) and network interface card (NIC) promiscuous mode for security reasons. Real-world tools like Wireshark require kernel-mode drivers like Npcap/libpcap with root/Administrator privileges. This project simulates realistic stochastic packet distribution and supports parsing real PCAP-to-CSV exports.
                </p>
              </div>

              {/* Q2 */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-cyan-300 font-bold mb-1">
                  Q2: How does the heuristic Intrusion Detection System (IDS) detect a Port Scan?
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Answer:</strong> The IDS maintains a sliding time-window histogram of destination ports mapped to each originating source IP. If a single source IP initiates connections to <code className="text-cyan-400">&ge; 4 distinct destination ports</code> within short succession without completing full application-layer data exchanges, the rule <code className="text-cyan-400">RULE_PORT_SCAN_RECONNAISSANCE</code> triggers.
                </p>
              </div>

              {/* Q3 */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-cyan-300 font-bold mb-1">
                  Q3: What constitutes a TCP SYN Flood in packet analysis?
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Answer:</strong> In standard TCP, the 3-way handshake comprises <code className="text-cyan-400">SYN &rarr; SYN-ACK &rarr; ACK</code>. In a SYN Flood attack, the attacker rapidly transmits TCP packets with the <code className="text-cyan-400">SYN</code> flag enabled while deliberately failing to send the final <code className="text-cyan-400">ACK</code>, exhausting the victim server's embryonic connection backlog (half-open sockets table).
                </p>
              </div>

              {/* Q4 */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-cyan-300 font-bold mb-1">
                  Q4: What is the difference between heuristic-based IDS and signature-based IDS?
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Answer:</strong> Signature-based IDS compares packet byte patterns directly against known exploit hashes (e.g. Snort rules matching known shellcode). Heuristic-based IDS evaluates behavioural patterns (e.g., rate spikes, port entropy, protocol deviations) and can flag novel anomalies, but requires careful threshold tuning to avoid false positives.
                </p>
              </div>

              {/* Q5 */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
                <h4 className="text-cyan-300 font-bold mb-1">
                  Q5: How does MTU size relate to packet size distribution?
                </h4>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  <strong>Answer:</strong> The standard Ethernet Maximum Transmission Unit (MTU) is 1500 bytes (plus 14 bytes Ethernet header = 1514B). Packets smaller than 128B represent transport/network control signaling (TCP SYN, ACK, FIN, ARP), while packets near 1500B represent full payload MTU transfers during file streaming or bulk downloads.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
