export type Protocol = 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'HTTPS' | 'DNS' | 'SSH' | 'ARP';

export type PacketStatus = 'normal' | 'suspicious' | 'malicious';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type TrafficDirection = 'incoming' | 'outgoing' | 'internal';

export interface Packet {
  id: string;
  timestamp: string; // ISO string or HH:mm:ss
  sourceIp: string;
  destinationIp: string;
  protocol: Protocol;
  sourcePort: number;
  destinationPort: number;
  packetSize: number; // in bytes
  status: PacketStatus;
  direction: TrafficDirection;
  info?: string;
  flags?: string[]; // e.g., ['SYN'], ['ACK', 'PSH'], ['FIN']
  ttl?: number;
  payloadPreview?: string;
}

export interface SecurityAlert {
  id: string;
  timestamp: string;
  ruleName: string;
  severity: SeverityLevel;
  sourceIp: string;
  destinationIp?: string;
  targetPort?: number;
  reason: string;
  packetCount: number;
  status: 'active' | 'investigating' | 'resolved';
  recommendedAction: string;
  packetsInvolved?: string[]; // IDs of packets
}

export interface ProtocolStat {
  protocol: Protocol;
  count: number;
  bytes: number;
  percentage: number;
  color: string;
}

export interface TopIpStat {
  ip: string;
  packets: number;
  bytes: number;
  role: 'Internal Host' | 'Gateway' | 'External Server' | 'Suspicious Actor' | 'Cloud CDN';
  location?: string;
}

export interface PortStat {
  port: number;
  service: string;
  count: number;
  protocol: string;
  isKnownRisk?: boolean;
}

export interface TrafficStats {
  totalPackets: number;
  totalBytes: number;
  incomingBytes: number;
  outgoingBytes: number;
  internalBytes: number;
  suspiciousCount: number;
  maliciousCount: number;
  avgPacketSize: number;
  activeProtocolsCount: number;
}

export interface FilterOptions {
  searchQuery: string;
  protocol: string; // 'ALL' or specific protocol
  status: string; // 'ALL' | 'normal' | 'suspicious' | 'malicious'
  direction: string; // 'ALL' | 'incoming' | 'outgoing'
  port: string;
}

export interface UserSettings {
  simulationSpeed: number; // in milliseconds per packet (e.g., 1000 = 1 pkt/s)
  bufferLimit: number; // max packets kept in live buffer (default: 300)
  autoScroll: boolean;
  soundAlerts: boolean;
  portScanThreshold: number; // unique ports in time window
  synFloodThreshold: number; // syn packets without ack
  trafficSpikeThreshold: number; // packets per second
  themeAccent: 'emerald' | 'cyan' | 'blue' | 'amber';
}
