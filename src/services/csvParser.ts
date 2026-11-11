import { Packet, Protocol, SecurityAlert } from '../types/traffic';

export interface ParseResult {
  success: boolean;
  packets: Packet[];
  errors: string[];
  totalRows: number;
  validRows: number;
}

const REQUIRED_COLUMNS = [
  'timestamp',
  'source_ip',
  'destination_ip',
  'protocol',
  'source_port',
  'destination_port',
  'packet_size',
];

const VALID_PROTOCOLS: Protocol[] = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'ARP'];

/**
 * Validates an IPv4 address string format.
 */
function isValidIp(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    const num = Number(p);
    return !isNaN(num) && num >= 0 && num <= 255 && p === String(num);
  });
}

/**
 * Parses raw CSV text into Packet records.
 */
export function parseNetworkTrafficCsv(csvText: string): ParseResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      packets: [],
      errors: ['The CSV file is empty or does not contain any data rows below the header.'],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Parse header line
  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const rawHeaders = lines[0]
    .split(delimiter)
    .map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase().replace(/[\s-]/g, '_'));

  // Validate required columns
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !rawHeaders.includes(col));
  if (missingColumns.length > 0) {
    return {
      success: false,
      packets: [],
      errors: [
        `Missing required columns: [${missingColumns.join(', ')}].`,
        `Expected header format: ${REQUIRED_COLUMNS.join(',')}`,
      ],
      totalRows: lines.length - 1,
      validRows: 0,
    };
  }

  const colIdx = {
    timestamp: rawHeaders.indexOf('timestamp'),
    source_ip: rawHeaders.indexOf('source_ip'),
    destination_ip: rawHeaders.indexOf('destination_ip'),
    protocol: rawHeaders.indexOf('protocol'),
    source_port: rawHeaders.indexOf('source_port'),
    destination_port: rawHeaders.indexOf('destination_port'),
    packet_size: rawHeaders.indexOf('packet_size'),
    status: rawHeaders.indexOf('status'), // optional
    info: rawHeaders.indexOf('info'), // optional
  };

  const packets: Packet[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const row = lines[i].split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));

    if (row.length < REQUIRED_COLUMNS.length) {
      errors.push(`Row ${lineNum}: Column count mismatch (found ${row.length}, expected >= ${REQUIRED_COLUMNS.length}).`);
      continue;
    }

    const timestamp = row[colIdx.timestamp] || new Date().toISOString();
    const sourceIp = row[colIdx.source_ip];
    const destinationIp = row[colIdx.destination_ip];
    const rawProtocol = (row[colIdx.protocol] || '').toUpperCase();
    const sourcePort = parseInt(row[colIdx.source_port], 10);
    const destinationPort = parseInt(row[colIdx.destination_port], 10);
    const packetSize = parseInt(row[colIdx.packet_size], 10);

    // Validate IP
    if (!isValidIp(sourceIp) && sourceIp !== 'localhost' && !sourceIp.startsWith('192.168.') && !sourceIp.startsWith('10.')) {
      errors.push(`Row ${lineNum}: Invalid Source IP address "${sourceIp}".`);
      continue;
    }
    if (!isValidIp(destinationIp) && destinationIp !== 'localhost' && !destinationIp.startsWith('192.168.') && !destinationIp.startsWith('10.')) {
      errors.push(`Row ${lineNum}: Invalid Destination IP address "${destinationIp}".`);
      continue;
    }

    // Validate Ports
    if (isNaN(sourcePort) || sourcePort < 0 || sourcePort > 65535) {
      errors.push(`Row ${lineNum}: Invalid Source Port "${row[colIdx.source_port]}". Must be between 0 and 65535.`);
      continue;
    }
    if (isNaN(destinationPort) || destinationPort < 0 || destinationPort > 65535) {
      errors.push(`Row ${lineNum}: Invalid Destination Port "${row[colIdx.destination_port]}". Must be between 0 and 65535.`);
      continue;
    }

    // Validate Packet Size
    if (isNaN(packetSize) || packetSize < 20 || packetSize > 65535) {
      errors.push(`Row ${lineNum}: Invalid Packet Size "${row[colIdx.packet_size]}". Must be a realistic size in bytes (20-65535).`);
      continue;
    }

    const protocol: Protocol = VALID_PROTOCOLS.includes(rawProtocol as Protocol) ? (rawProtocol as Protocol) : 'TCP';

    // Infer status & direction
    let status: Packet['status'] = 'normal';
    if (colIdx.status >= 0 && row[colIdx.status]) {
      const s = row[colIdx.status].toLowerCase();
      if (s === 'suspicious' || s === 'malicious') status = s;
    } else {
      if (destinationPort === 4444 || destinationPort === 1337 || destinationPort === 31337) {
        status = 'malicious';
      } else if (destinationPort === 23 || destinationPort === 6667) {
        status = 'suspicious';
      }
    }

    const isInternalSrc = sourceIp.startsWith('192.168.') || sourceIp.startsWith('10.') || sourceIp.startsWith('172.16.');
    const isInternalDst = destinationIp.startsWith('192.168.') || destinationIp.startsWith('10.') || destinationIp.startsWith('172.16.');
    const direction = isInternalSrc && isInternalDst ? 'internal' : isInternalSrc ? 'outgoing' : 'incoming';

    packets.push({
      id: `csv-${Date.now()}-${i}`,
      timestamp,
      sourceIp,
      destinationIp,
      protocol,
      sourcePort,
      destinationPort,
      packetSize,
      status,
      direction,
      info: colIdx.info >= 0 && row[colIdx.info] ? row[colIdx.info] : `Imported ${protocol} traffic [${sourceIp}:${sourcePort} -> ${destinationIp}:${destinationPort}]`,
      ttl: 64,
    });
  }

  return {
    success: packets.length > 0,
    packets,
    errors: errors.slice(0, 15), // cap displayed errors to prevent UI overflow
    totalRows: lines.length - 1,
    validRows: packets.length,
  };
}

/**
 * Converts packet array to downloadable CSV string.
 */
export function exportPacketsToCsv(packets: Packet[]): string {
  const header = ['timestamp', 'source_ip', 'destination_ip', 'protocol', 'source_port', 'destination_port', 'packet_size', 'status', 'direction', 'info'];
  const rows = packets.map((p) => [
    `"${p.timestamp}"`,
    `"${p.sourceIp}"`,
    `"${p.destinationIp}"`,
    `"${p.protocol}"`,
    p.sourcePort,
    p.destinationPort,
    p.packetSize,
    `"${p.status}"`,
    `"${p.direction}"`,
    `"${(p.info || '').replace(/"/g, '""')}"`,
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Converts security alerts to downloadable CSV.
 */
export function exportAlertsToCsv(alerts: SecurityAlert[]): string {
  const header = ['id', 'timestamp', 'severity', 'rule_name', 'source_ip', 'destination_ip', 'target_port', 'reason', 'recommended_action'];
  const rows = alerts.map((a) => [
    `"${a.id}"`,
    `"${a.timestamp}"`,
    `"${a.severity}"`,
    `"${a.ruleName}"`,
    `"${a.sourceIp}"`,
    `"${a.destinationIp || 'N/A'}"`,
    a.targetPort || 'N/A',
    `"${a.reason.replace(/"/g, '""')}"`,
    `"${a.recommendedAction.replace(/"/g, '""')}"`,
  ]);

  return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates ready-to-download sample CSV content with both benign and anomalous packets.
 */
export function getSampleCsvContent(type: 'standard' | 'attack' = 'standard'): string {
  if (type === 'attack') {
    return [
      'timestamp,source_ip,destination_ip,protocol,source_port,destination_port,packet_size,status,info',
      '2026-11-10T10:00:01.100Z,194.26.29.112,192.168.1.50,TCP,49201,21,60,suspicious,"[SCAN] FTP probe"',
      '2026-11-10T10:00:01.120Z,194.26.29.112,192.168.1.50,TCP,49202,22,60,suspicious,"[SCAN] SSH probe"',
      '2026-11-10T10:00:01.140Z,194.26.29.112,192.168.1.50,TCP,49203,80,60,suspicious,"[SCAN] HTTP probe"',
      '2026-11-10T10:00:01.160Z,194.26.29.112,192.168.1.50,TCP,49204,443,60,suspicious,"[SCAN] HTTPS probe"',
      '2026-11-10T10:00:01.180Z,194.26.29.112,192.168.1.50,TCP,49205,3389,60,suspicious,"[SCAN] RDP probe"',
      '2026-11-10T10:00:01.200Z,194.26.29.112,192.168.1.50,TCP,49206,4444,60,malicious,"[SCAN] Metasploit port attempt"',
      '2026-11-10T10:00:02.050Z,185.220.101.5,192.168.1.50,TCP,51000,80,64,malicious,"[SYN FLOOD] High volume SYN 1/10"',
      '2026-11-10T10:00:02.070Z,185.220.101.5,192.168.1.50,TCP,51001,80,64,malicious,"[SYN FLOOD] High volume SYN 2/10"',
      '2026-11-10T10:00:02.090Z,185.220.101.5,192.168.1.50,TCP,51002,80,64,malicious,"[SYN FLOOD] High volume SYN 3/10"',
      '2026-11-10T10:00:02.110Z,185.220.101.5,192.168.1.50,TCP,51003,80,64,malicious,"[SYN FLOOD] High volume SYN 4/10"',
      '2026-11-10T10:00:02.130Z,185.220.101.5,192.168.1.50,TCP,51004,80,64,malicious,"[SYN FLOOD] High volume SYN 5/10"',
      '2026-11-10T10:00:02.150Z,185.220.101.5,192.168.1.50,TCP,51005,80,64,malicious,"[SYN FLOOD] High volume SYN 6/10"',
      '2026-11-10T10:00:02.170Z,185.220.101.5,192.168.1.50,TCP,51006,80,64,malicious,"[SYN FLOOD] High volume SYN 7/10"',
      '2026-11-10T10:00:02.190Z,185.220.101.5,192.168.1.50,TCP,51007,80,64,malicious,"[SYN FLOOD] High volume SYN 8/10"',
      '2026-11-10T10:00:03.010Z,192.168.1.100,91.240.118.23,TCP,58421,4444,180,malicious,"[C2 BEACON] Outbound reverse shell telemetry"',
    ].join('\n');
  }

  return [
    'timestamp,source_ip,destination_ip,protocol,source_port,destination_port,packet_size,status,info',
    '2026-11-10T09:15:00.120Z,192.168.1.15,8.8.8.8,DNS,53210,53,74,normal,"Standard query A api.github.com"',
    '2026-11-10T09:15:00.145Z,8.8.8.8,192.168.1.15,DNS,53,53210,122,normal,"Standard query response A 140.82.121.3"',
    '2026-11-10T09:15:00.180Z,192.168.1.15,140.82.121.3,HTTPS,49320,443,517,normal,"TLSv1.3 Client Hello"',
    '2026-11-10T09:15:00.210Z,140.82.121.3,192.168.1.15,HTTPS,443,49320,1460,normal,"TLSv1.3 Server Hello, Encrypted Extensions"',
    '2026-11-10T09:15:00.230Z,192.168.1.15,140.82.121.3,TCP,49320,443,66,normal,"ACK Seq=518 Ack=1461 Win=65535"',
    '2026-11-10T09:15:01.050Z,192.168.1.10,192.168.1.25,TCP,51100,3306,128,normal,"SQL query SELECT * FROM telemetry"',
    '2026-11-10T09:15:01.090Z,192.168.1.25,192.168.1.10,TCP,3306,51100,940,normal,"SQL result set 48 rows returned"',
    '2026-11-10T09:15:02.300Z,192.168.1.50,151.101.65.140,HTTP,48200,80,380,normal,"GET /healthz HTTP/1.1"',
    '2026-11-10T09:15:02.340Z,151.101.65.140,192.168.1.50,HTTP,80,48200,210,normal,"HTTP/1.1 200 OK"',
    '2026-11-10T09:15:03.100Z,192.168.1.1,192.168.1.15,ARP,0,0,42,normal,"Who has 192.168.1.15? Tell 192.168.1.1"',
    '2026-11-10T09:15:03.105Z,192.168.1.15,192.168.1.1,ARP,0,0,42,normal,"192.168.1.15 is at 02:42:c0:a8:01:0f"',
    '2026-11-10T09:15:04.500Z,192.168.1.15,8.8.8.8,ICMP,0,0,84,normal,"Echo (ping) request seq=1"',
    '2026-11-10T09:15:04.530Z,8.8.8.8,192.168.1.15,ICMP,0,0,84,normal,"Echo (ping) reply seq=1 ttl=118"',
  ].join('\n');
}

/**
 * Triggers a browser download of a text/CSV file.
 */
export function triggerFileDownload(content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
