import { Packet, SecurityAlert, SeverityLevel } from '../types/traffic';

const DANGEROUS_PORTS: Record<number, { service: string; severity: SeverityLevel; desc: string }> = {
  4444: { service: 'Metasploit / Meterpreter default listener', severity: 'Critical', desc: 'Outbound or inbound connection to known reverse shell handler' },
  1337: { service: 'Backdoor / Hacker port', severity: 'High', desc: 'Access attempt to classic exploit backdoor port' },
  31337: { service: 'Back Orifice Trojan', severity: 'Critical', desc: 'Attempted communication with legacy Trojan backdoor' },
  6667: { service: 'IRC C2 Channel', severity: 'High', desc: 'Legacy Botnet Command & Control IRC channel traffic' },
  23: { service: 'Telnet (Unencrypted)', severity: 'Medium', desc: 'Cleartext remote administration protocol detected across boundary' },
  445: { service: 'SMB / EternalBlue target', severity: 'High', desc: 'Direct exposure of SMB port susceptible to remote code execution' },
};

/**
 * Analyzes a stream of recent packets and generates rule-based security alerts.
 */
export function evaluateThreats(recentPackets: Packet[], customSettings?: {
  portScanThreshold?: number;
  trafficSpikeThreshold?: number;
}): SecurityAlert[] {
  const alerts: SecurityAlert[] = [];
  const portScanThreshold = customSettings?.portScanThreshold || 4;
  const trafficSpikeThreshold = customSettings?.trafficSpikeThreshold || 12;

  // 1. Group packets by Source IP
  const ipMap = new Map<string, Packet[]>();
  recentPackets.forEach((p) => {
    const list = ipMap.get(p.sourceIp) || [];
    list.push(p);
    ipMap.set(p.sourceIp, list);
  });

  // Evaluate per-source IP heuristics
  ipMap.forEach((packets, sourceIp) => {
    // A. Port Scanning Heuristic:
    // Distinct ports probed by the same IP
    const distinctPorts = new Set<number>();
    packets.forEach((p) => {
      if (p.destinationPort > 0) distinctPorts.add(p.destinationPort);
    });

    if (distinctPorts.size >= portScanThreshold) {
      const targetIps = Array.from(new Set(packets.map((p) => p.destinationIp)));
      alerts.push({
        id: `alert-scan-${sourceIp.replace(/\./g, '-')}-${Date.now()}`,
        timestamp: packets[packets.length - 1].timestamp,
        ruleName: 'RULE_PORT_SCAN_RECONNAISSANCE',
        severity: distinctPorts.size >= 8 ? 'Critical' : 'High',
        sourceIp,
        destinationIp: targetIps[0] || 'Multiple internal hosts',
        targetPort: Array.from(distinctPorts)[0],
        reason: `Source IP initiated connection attempts against ${distinctPorts.size} distinct ports (${Array.from(distinctPorts).slice(0, 5).join(', ')}...) in short succession.`,
        packetCount: packets.length,
        status: 'active',
        recommendedAction: `Apply temporary firewall blacklist: 'iptables -A INPUT -s ${sourceIp} -j DROP'. Inspect port 80/443 web logs.`,
        packetsInvolved: packets.map((p) => p.id),
      });
    }

    // B. SYN Flood / DoS Heuristic:
    // High frequency of TCP SYN packets with few or no ACKs
    const synPackets = packets.filter((p) => p.protocol === 'TCP' && p.flags?.includes('SYN') && !p.flags?.includes('ACK'));
    if (synPackets.length >= 8) {
      const targetHost = synPackets[0].destinationIp;
      alerts.push({
        id: `alert-syn-${sourceIp.replace(/\./g, '-')}-${Date.now()}`,
        timestamp: synPackets[synPackets.length - 1].timestamp,
        ruleName: 'RULE_TCP_SYN_FLOOD_DOS',
        severity: synPackets.length >= 15 ? 'Critical' : 'High',
        sourceIp,
        destinationIp: targetHost,
        targetPort: synPackets[0].destinationPort,
        reason: `Potential SYN Flood DoS: Detected ${synPackets.length} unacknowledged SYN packets directed at ${targetHost}:${synPackets[0].destinationPort}.`,
        packetCount: synPackets.length,
        status: 'active',
        recommendedAction: `Enable SYN cookies on target host ('sysctl -w net.ipv4.tcp_syncookies=1') and throttle incoming SYN connections.`,
        packetsInvolved: synPackets.map((p) => p.id),
      });
    }

    // C. Traffic Spike / Single Host Flooding:
    if (packets.length >= trafficSpikeThreshold) {
      alerts.push({
        id: `alert-spike-${sourceIp.replace(/\./g, '-')}-${Date.now()}`,
        timestamp: packets[packets.length - 1].timestamp,
        ruleName: 'RULE_HIGH_RATE_TRAFFIC_SPIKE',
        severity: 'Medium',
        sourceIp,
        destinationIp: packets[0].destinationIp,
        reason: `Unusual traffic volume: ${packets.length} packets originated from single IP within observation window.`,
        packetCount: packets.length,
        status: 'investigating',
        recommendedAction: `Check whether ${sourceIp} is an internal backup job or unauthorized script. Rate-limit IP bandwidth via QoS.`,
        packetsInvolved: packets.map((p) => p.id),
      });
    }

    // D. ICMP Flood / Sweep:
    const icmpPackets = packets.filter((p) => p.protocol === 'ICMP');
    const icmpTargets = new Set(icmpPackets.map((p) => p.destinationIp));
    if (icmpPackets.length >= 7 || icmpTargets.size >= 4) {
      alerts.push({
        id: `alert-icmp-${sourceIp.replace(/\./g, '-')}-${Date.now()}`,
        timestamp: icmpPackets[icmpPackets.length - 1].timestamp,
        ruleName: 'RULE_ICMP_PING_SWEEP_SURVEILLANCE',
        severity: 'Medium',
        sourceIp,
        destinationIp: `${icmpTargets.size} subnet hosts`,
        reason: `Host surveillance: Generated ${icmpPackets.length} ICMP echo requests probing ${icmpTargets.size} distinct IP addresses.`,
        packetCount: icmpPackets.length,
        status: 'active',
        recommendedAction: `Filter external ICMP echo requests at the boundary router / border firewall.`,
        packetsInvolved: icmpPackets.map((p) => p.id),
      });
    }
  });

  // 2. Evaluate Individual High-Risk Port Connections across all packets
  recentPackets.forEach((p) => {
    if (DANGEROUS_PORTS[p.destinationPort]) {
      const risk = DANGEROUS_PORTS[p.destinationPort];
      const existing = alerts.find(
        (a) => a.ruleName === 'RULE_SUSPICIOUS_PORT_ACCESS' && a.sourceIp === p.sourceIp && a.targetPort === p.destinationPort
      );
      if (!existing) {
        alerts.push({
          id: `alert-port-${p.destinationPort}-${p.id}`,
          timestamp: p.timestamp,
          ruleName: 'RULE_SUSPICIOUS_PORT_ACCESS',
          severity: risk.severity,
          sourceIp: p.sourceIp,
          destinationIp: p.destinationIp,
          targetPort: p.destinationPort,
          reason: `Suspicious destination port ${p.destinationPort} accessed (${risk.service}): ${risk.desc}.`,
          packetCount: 1,
          status: 'active',
          recommendedAction: `Inspect process listening on port ${p.destinationPort}. Isolate host ${p.sourceIp} from VLAN if unauthorized.`,
          packetsInvolved: [p.id],
        });
      }
    }
  });

  return alerts;
}

/**
 * Technical explanation of heuristic vs machine learning IDS for student viva defense
 */
export const IDS_EDUCATIONAL_NOTES = {
  philosophy: 'Deterministic Rule-Based Heuristics vs Statistical Anomaly Detection',
  explanation:
    'In production network defense (e.g., Snort, Zeek, Suricata), transparent heuristics examine deterministic protocol states (e.g., TCP flags, port entropy, packet arrival delta). While an alert flags high-probability suspicious behavior, network engineers treat it as an investigative lead rather than conclusive proof of malice, because legitimate tasks like vulnerability scanning or network discovery generate identical signatures.',
  detectionRules: [
    {
      code: 'RULE_PORT_SCAN_RECONNAISSANCE',
      description: 'Flags single source IP contacting 4+ distinct ports within a short observation window.',
      mitigation: 'Block IP via perimeter firewall; analyze host for automated Nmap probes.',
    },
    {
      code: 'RULE_TCP_SYN_FLOOD_DOS',
      description: 'Flags uncompleted TCP handshakes (excessive SYN without subsequent ACK), exhausting half-open sockets.',
      mitigation: 'Deploy TCP SYN cookies, limit embryonic connections in firewall.',
    },
    {
      code: 'RULE_SUSPICIOUS_PORT_ACCESS',
      description: 'Matches connection attempts against known malware, Trojan, and C2 ports (e.g., 4444, 1337, 31337).',
      mitigation: 'Isolate endpoint; perform memory dump and host forensic audit.',
    },
    {
      code: 'RULE_HIGH_RATE_TRAFFIC_SPIKE',
      description: 'Identifies sudden volumetric bursts from a single host that deviate significantly from average baseline.',
      mitigation: 'Implement Quality of Service (QoS) throttling and check for runaway background processes.',
    },
    {
      code: 'RULE_ICMP_PING_SWEEP_SURVEILLANCE',
      description: 'Detects sequential subnet host discovery via ICMP Echo Request flooding.',
      mitigation: 'Disable ICMP Echo Reply on internal endpoint firewalls.',
    },
  ],
};
