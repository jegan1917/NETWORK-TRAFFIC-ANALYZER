import { Packet, Protocol, TrafficDirection } from '../types/traffic';

// Realistic IP pools
const INTERNAL_IPS = [
  '192.168.1.10', // Dev Workstation
  '192.168.1.15', // Admin Laptop
  '192.168.1.25', // Database Server
  '192.168.1.50', // Web App Server
  '192.168.1.100', // IoT Sensor Hub
  '192.168.1.1',   // Gateway Router
  '10.0.4.12',    // Internal API Node
];

const EXTERNAL_IPS = [
  '142.250.190.46', // Google Cloud Services
  '104.244.42.1',   // Cloudflare CDN
  '151.101.65.140', // Fastly Edge Cache
  '8.8.8.8',        // Google Public DNS
  '1.1.1.1',        // Cloudflare DNS
  '20.112.52.29',   // Azure US East
  '54.239.28.85',   // AWS EC2 Gateway
];

const SUSPICIOUS_IPS = [
  '185.220.101.5',  // Known Tor Exit Node
  '194.26.29.112',  // Bulletproof Host / Scanner
  '45.154.255.89',  // Scanning Botnet
  '91.240.118.23',  // C2 Beacon Server
];

const PROTOCOL_CONFIG: Record<Protocol, {
  defaultPorts: number[];
  baseSize: [number, number];
  flags: string[];
  infoTemplates: string[];
}> = {
  HTTP: {
    defaultPorts: [80, 8080],
    baseSize: [320, 1200],
    flags: ['ACK', 'PSH'],
    infoTemplates: ['GET /api/v1/telemetry HTTP/1.1', 'POST /auth/login HTTP/1.1', 'GET /static/bundle.js HTTP/1.1', 'GET /healthz HTTP/1.1'],
  },
  HTTPS: {
    defaultPorts: [443, 8443],
    baseSize: [500, 1480],
    flags: ['ACK', 'PSH'],
    infoTemplates: ['TLSv1.3 Application Data Encrypted', 'Client Hello (SNI: api.service.io)', 'Server Hello, Change Cipher Spec'],
  },
  TCP: {
    defaultPorts: [22, 3389, 21, 8080],
    baseSize: [54, 300],
    flags: ['SYN', 'ACK', 'FIN', 'RST'],
    infoTemplates: ['Seq=1024 Ack=1 Win=64240 Len=0', 'Connection Keep-Alive probe', 'TCP Window Update', 'Handshake SYN-ACK'],
  },
  UDP: {
    defaultPorts: [53, 123, 161, 5060],
    baseSize: [68, 512],
    flags: [],
    infoTemplates: ['Standard query A cloud.internal.net', 'NTP Version 4 client request', 'SNMP v2 GetRequest', 'Syslog Event Packet'],
  },
  DNS: {
    defaultPorts: [53],
    baseSize: [60, 220],
    flags: [],
    infoTemplates: ['Standard query 0x3f4a A repo.maven.apache.org', 'Standard query response A 104.21.32.1', 'Standard query AAAA ns1.dns.internal'],
  },
  ICMP: {
    defaultPorts: [0],
    baseSize: [64, 84],
    flags: [],
    infoTemplates: ['Echo (ping) request id=0x192a seq=1/256', 'Echo (ping) reply id=0x192a seq=1/256 ttl=56', 'Destination unreachable (Port unreachable)'],
  },
  SSH: {
    defaultPorts: [22],
    baseSize: [98, 750],
    flags: ['ACK', 'PSH'],
    infoTemplates: ['Encrypted packet Len=96 (SSH-2.0-OpenSSH_9.2)', 'Diffie-Hellman Key Exchange Init', 'New Keys Exchange Request'],
  },
  ARP: {
    defaultPorts: [0],
    baseSize: [42, 60],
    flags: [],
    infoTemplates: ['Who has 192.168.1.1? Tell 192.168.1.15', '192.168.1.1 is at 00:1a:2b:3c:4d:5e', 'Gratuitous ARP announce for 192.168.1.50'],
  },
};

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomPacket(forcedAttributes?: Partial<Packet>): Packet {
  const isSuspicious = Math.random() < 0.08;
  const isMalicious = Math.random() < 0.03;

  let protocol: Protocol = 'HTTPS';
  const protoRoll = Math.random();
  if (protoRoll < 0.35) protocol = 'HTTPS';
  else if (protoRoll < 0.55) protocol = 'TCP';
  else if (protoRoll < 0.70) protocol = 'UDP';
  else if (protoRoll < 0.82) protocol = 'DNS';
  else if (protoRoll < 0.90) protocol = 'HTTP';
  else if (protoRoll < 0.95) protocol = 'ICMP';
  else if (protoRoll < 0.98) protocol = 'SSH';
  else protocol = 'ARP';

  const isIncoming = Math.random() < 0.55;
  const direction: TrafficDirection = isIncoming ? 'incoming' : 'outgoing';

  let sourceIp: string;
  let destinationIp: string;

  if (isMalicious) {
    sourceIp = getRandomItem(SUSPICIOUS_IPS);
    destinationIp = getRandomItem(INTERNAL_IPS);
  } else if (isIncoming) {
    sourceIp = getRandomItem(EXTERNAL_IPS);
    destinationIp = getRandomItem(INTERNAL_IPS);
  } else {
    sourceIp = getRandomItem(INTERNAL_IPS);
    destinationIp = getRandomItem(EXTERNAL_IPS);
  }

  const protoConfig = PROTOCOL_CONFIG[protocol];
  const destPort = getRandomItem(protoConfig.defaultPorts);
  const srcPort = protocol === 'ARP' || protocol === 'ICMP' ? 0 : getRandomInt(49152, 65535);

  const packetSize = getRandomInt(protoConfig.baseSize[0], protoConfig.baseSize[1]);
  const flags = protoConfig.flags.length > 0 ? [getRandomItem(protoConfig.flags)] : [];

  let status: Packet['status'] = 'normal';
  let info = getRandomItem(protoConfig.infoTemplates);

  if (isMalicious) {
    status = 'malicious';
    info = `[FLAGGED] High anomaly heuristic match from ${sourceIp}`;
  } else if (isSuspicious) {
    status = 'suspicious';
    info = `[SUSPICIOUS] Uncommon port transaction (${destPort})`;
  }

  const date = new Date();
  const timestamp = date.toTimeString().split(' ')[0] + '.' + String(date.getMilliseconds()).padStart(3, '0');

  const hexBytes = Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(' ');

  return {
    id: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp,
    sourceIp,
    destinationIp,
    protocol,
    sourcePort: srcPort,
    destinationPort: destPort,
    packetSize,
    status,
    direction,
    info,
    flags,
    ttl: getRandomInt(48, 128),
    payloadPreview: `0000  ${hexBytes}  |${protocol.padEnd(8, '.')}|`,
    ...forcedAttributes,
  };
}

/**
 * Generates an initial historical seed dataset so the dashboard has rich, populated graphs immediately.
 */
export function generateSeedPackets(count = 60): Packet[] {
  const packets: Packet[] = [];
  const now = Date.now();

  for (let i = count; i >= 1; i--) {
    const timeOffsetMs = i * 2500;
    const packetDate = new Date(now - timeOffsetMs);
    const timestamp = packetDate.toTimeString().split(' ')[0] + '.' + String(packetDate.getMilliseconds()).padStart(3, '0');

    // Occasional simulated attack pattern in history
    let packet: Packet;
    if (i === 12 || i === 13 || i === 14) {
      packet = generateRandomPacket({
        timestamp,
        sourceIp: '185.220.101.5',
        destinationIp: '192.168.1.50',
        protocol: 'TCP',
        destinationPort: 80,
        flags: ['SYN'],
        status: 'suspicious',
        info: 'TCP SYN flood test probe',
      });
    } else if (i === 28 || i === 29) {
      packet = generateRandomPacket({
        timestamp,
        sourceIp: '45.154.255.89',
        destinationIp: '192.168.1.25',
        protocol: 'TCP',
        destinationPort: 4444,
        status: 'malicious',
        info: 'Unusual Metasploit port attempt (4444)',
      });
    } else {
      packet = generateRandomPacket({ timestamp });
    }

    packets.push(packet);
  }

  return packets;
}

/**
 * Attack injection helpers for student demonstration
 */
export function createPortScanBurst(attackerIp = '194.26.29.112', targetIp = '192.168.1.50'): Packet[] {
  const targetPorts = [21, 22, 23, 25, 80, 110, 443, 3306, 3389, 8080, 4444];
  const now = new Date();

  return targetPorts.map((port, idx) => {
    const time = new Date(now.getTime() + idx * 40);
    const timestamp = time.toTimeString().split(' ')[0] + '.' + String(time.getMilliseconds()).padStart(3, '0');

    return {
      id: `attack-scan-${Date.now()}-${idx}`,
      timestamp,
      sourceIp: attackerIp,
      destinationIp: targetIp,
      protocol: 'TCP',
      sourcePort: 54100 + idx,
      destinationPort: port,
      packetSize: 60,
      status: 'malicious',
      direction: 'incoming',
      info: `[PORT SCAN] SYN stealth scan to port ${port}`,
      flags: ['SYN'],
      ttl: 52,
      payloadPreview: '0000  02 04 05 b4 04 02 08 0a  1a 2b 3c 4d 00 00 00 00  |SCAN............|',
    };
  });
}

export function createSynFloodBurst(attackerIp = '185.220.101.5', targetIp = '192.168.1.50'): Packet[] {
  const count = 12;
  const now = new Date();

  return Array.from({ length: count }, (_, idx) => {
    const time = new Date(now.getTime() + idx * 25);
    const timestamp = time.toTimeString().split(' ')[0] + '.' + String(time.getMilliseconds()).padStart(3, '0');

    return {
      id: `attack-syn-${Date.now()}-${idx}`,
      timestamp,
      sourceIp: attackerIp,
      destinationIp: targetIp,
      protocol: 'TCP',
      sourcePort: 40000 + idx * 13,
      destinationPort: 80,
      packetSize: 64,
      status: 'malicious',
      direction: 'incoming',
      info: `[SYN FLOOD] High volume TCP SYN without handshake completion`,
      flags: ['SYN'],
      ttl: 48,
      payloadPreview: '0000  00 50 c0 a8 01 32 00 00  00 00 00 00 50 02 20 00  |.P...2......P. .|',
    };
  });
}

export function createIcmpPingSweep(attackerIp = '192.168.1.15'): Packet[] {
  const hosts = [1, 2, 5, 10, 15, 25, 50, 75, 100, 150];
  const now = new Date();

  return hosts.map((host, idx) => {
    const time = new Date(now.getTime() + idx * 50);
    const timestamp = time.toTimeString().split(' ')[0] + '.' + String(time.getMilliseconds()).padStart(3, '0');

    return {
      id: `attack-icmp-${Date.now()}-${idx}`,
      timestamp,
      sourceIp: attackerIp,
      destinationIp: `192.168.1.${host}`,
      protocol: 'ICMP',
      sourcePort: 0,
      destinationPort: 0,
      packetSize: 84,
      status: 'suspicious',
      direction: 'internal',
      info: `[ICMP SWEEP] Echo Request sweeping subnet target .${host}`,
      flags: [],
      ttl: 64,
      payloadPreview: '0000  08 00 4d 5a 00 01 00 01  61 62 63 64 65 66 67 68  |..MZ....abcdefgh|',
    };
  });
}

export function createC2BeaconBurst(internalCompromised = '192.168.1.100', c2Server = '91.240.118.23'): Packet[] {
  const count = 4;
  const now = new Date();

  return Array.from({ length: count }, (_, idx) => {
    const time = new Date(now.getTime() + idx * 120);
    const timestamp = time.toTimeString().split(' ')[0] + '.' + String(time.getMilliseconds()).padStart(3, '0');

    return {
      id: `attack-c2-${Date.now()}-${idx}`,
      timestamp,
      sourceIp: internalCompromised,
      destinationIp: c2Server,
      protocol: 'TCP',
      sourcePort: 51234,
      destinationPort: 4444,
      packetSize: 240,
      status: 'malicious',
      direction: 'outgoing',
      info: `[C2 BEACON] Suspect outbound reverse shell communication to port 4444`,
      flags: ['ACK', 'PSH'],
      ttl: 64,
      payloadPreview: '0000  4d 45 54 41 53 50 4c 4f  49 54 20 53 48 45 4c 4c  |METASPLOIT SHELL|',
    };
  });
}
