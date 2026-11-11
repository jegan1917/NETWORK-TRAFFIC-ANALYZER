import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Flame,
  ArrowRight,
  Database,
  HelpCircle,
} from 'lucide-react';
import { useTraffic } from '../../context/TrafficContext';
import {
  parseNetworkTrafficCsv,
  getSampleCsvContent,
  triggerFileDownload,
  ParseResult,
} from '../../services/csvParser';

export const CsvUploadView: React.FC<{
  onNavigateTab: (tab: string) => void;
}> = ({ onNavigateTab }) => {
  const { addPackets, loadSampleDataset } = useTraffic();

  const [dragActive, setDragActive] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseResult({
        success: false,
        packets: [],
        errors: ['Please select a valid .csv file format.'],
        totalRows: 0,
        validRows: 0,
      });
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const res = parseNetworkTrafficCsv(text);
      setParseResult(res);
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setParseResult({
        success: false,
        packets: [],
        errors: ['Failed to read file from disk.'],
        totalRows: 0,
        validRows: 0,
      });
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = (replace: boolean) => {
    if (!parseResult || parseResult.packets.length === 0) return;
    addPackets(parseResult.packets, replace);
    setSuccessMessage(
      `Successfully loaded ${parseResult.packets.length} packets into ${
        replace ? 'a clean workspace buffer' : 'the existing live stream'
      }! Dashboard & statistics have been updated.`
    );
  };

  const downloadSample = (type: 'standard' | 'attack') => {
    const csv = getSampleCsvContent(type);
    const fname = type === 'attack' ? 'attack_traffic_sample.csv' : 'sample_network_traffic.csv';
    triggerFileDownload(csv, fname);
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono text-base font-bold text-slate-100">
                CSV TRAFFIC INGESTION &amp; PARSER
              </h2>
              <p className="text-xs text-slate-400">
                Import external network captures or firewall logs for offline security auditing
              </p>
            </div>
          </div>
        </div>

        {/* Sample Download Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => downloadSample('standard')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Download standard enterprise sample CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sample CSV</span>
          </button>
          <button
            onClick={() => downloadSample('attack')}
            className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-mono border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            title="Download attack scenario sample CSV"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>Attack Sample CSV</span>
          </button>
        </div>
      </div>

      {/* Instant 1-Click Preloaded Datasets for College Review Demo */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>QUICK-LOAD PRE-PACKAGED DATASETS (FOR VIVA DEMONSTRATION)</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
            1-Click Ready
          </span>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Need to demonstrate CSV ingestion immediately during college project evaluation without preparing a file?
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              loadSampleDataset('standard');
              setSuccessMessage('Loaded 60 enterprise standard traffic records into telemetry buffer.');
            }}
            className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-left transition-colors group"
          >
            <div className="flex items-center justify-between font-mono text-xs text-slate-200 group-hover:text-cyan-300">
              <span className="font-semibold">Normal Enterprise Day Trace</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Realistic blend of HTTPS (TLS 1.3), DNS queries to 8.8.8.8, ARP resolution, and internal MySQL queries.
            </p>
          </button>

          <button
            onClick={() => {
              loadSampleDataset('attack');
              setSuccessMessage('Loaded attack trace (Nmap Port Scan + SYN Flood + C2 Metasploit beacon).');
            }}
            className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 text-left transition-colors group"
          >
            <div className="flex items-center justify-between font-mono text-xs text-slate-200 group-hover:text-rose-300">
              <span className="font-semibold text-rose-300">Cyber Attack Incident Trace</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Contains Nmap sequential SYN scanning across ports 21-4444, an unacknowledged SYN flood, and C2 beacons.
            </p>
          </button>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-cyan-400 mb-3">
          <Upload className="w-6 h-6" />
        </div>

        <h3 className="font-mono text-sm font-semibold text-slate-200 mb-1">
          {fileName ? `Selected: ${fileName}` : 'Drag & Drop your network traffic CSV file here'}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mb-3">
          Supports comma, semicolon, or tab-delimited files. Expected columns: timestamp, source_ip, destination_ip, protocol, source_port, destination_port, packet_size.
        </p>
        <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-800 text-cyan-400 text-xs font-mono">
          Browse Computer Files
        </span>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => onNavigateTab('dashboard')}
            className="text-xs underline text-cyan-300 hover:text-cyan-200 font-semibold ml-4 shrink-0"
          >
            View Dashboard &rarr;
          </button>
        </div>
      )}

      {/* Parse Results Card */}
      {parseResult && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-mono text-sm font-bold text-slate-100">
                PARSER EVALUATION SUMMARY: {fileName}
              </h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                parseResult.success
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
              }`}
            >
              {parseResult.success ? 'Validated Successfully' : 'Validation Failed'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">TOTAL ROWS</span>
              <span className="text-lg font-bold text-slate-200">{parseResult.totalRows}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PARSED PACKETS</span>
              <span className="text-lg font-bold text-emerald-400">{parseResult.validRows}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MALFORMED ROWS</span>
              <span className={`text-lg font-bold ${parseResult.errors.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {parseResult.totalRows - parseResult.validRows}
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">STATUS</span>
              <span className="text-lg font-bold text-cyan-400">
                {parseResult.success ? 'Ready to Apply' : 'Action Needed'}
              </span>
            </div>
          </div>

          {/* Error List if Any */}
          {parseResult.errors.length > 0 && (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/40 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1.5">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Format Validation Errors ({parseResult.errors.length}):</span>
              </div>
              <ul className="list-disc list-inside text-rose-200/90 space-y-1 text-[11px]">
                {parseResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons if Valid */}
          {parseResult.success && (
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleApply(true)}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition-colors shadow-lg shadow-cyan-600/20"
              >
                Replace Active Buffer with Uploaded CSV
              </button>
              <button
                onClick={() => handleApply(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700"
              >
                Merge with Existing Traffic
              </button>
            </div>
          )}
        </div>
      )}

      {/* CSV Schema Specification Documentation */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono text-sm font-semibold text-slate-200">
            CSV DATA SCHEMA &amp; SPECIFICATION
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Strict schema requirements for custom PCAP-to-CSV exports and packet logs
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2">COLUMN</th>
                <th className="pb-2">TYPE</th>
                <th className="pb-2">REQUIRED</th>
                <th className="pb-2">EXAMPLE VALUE</th>
                <th className="pb-2">DESCRIPTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
              <tr>
                <td className="py-2 text-cyan-300 font-semibold">timestamp</td>
                <td className="py-2 text-slate-400">ISO / String</td>
                <td className="py-2 text-emerald-400">Yes</td>
                <td className="py-2 text-slate-400">2026-11-10T10:15:00Z</td>
                <td className="py-2 text-slate-400">Time of packet capture</td>
              </tr>
              <tr>
                <td className="py-2 text-cyan-300 font-semibold">source_ip</td>
                <td className="py-2 text-slate-400">IPv4 String</td>
                <td className="py-2 text-emerald-400">Yes</td>
                <td className="py-2 text-slate-400">192.168.1.15</td>
                <td className="py-2 text-slate-400">Originating host IP</td>
              </tr>
              <tr>
                <td className="py-2 text-cyan-300 font-semibold">destination_ip</td>
                <td className="py-2 text-slate-400">IPv4 String</td>
                <td className="py-2 text-emerald-400">Yes</td>
                <td className="py-2 text-slate-400">8.8.8.8</td>
                <td className="py-2 text-slate-400">Destination host IP</td>
              </tr>
              <tr>
                <td className="py-2 text-cyan-300 font-semibold">protocol</td>
                <td className="py-2 text-slate-400">String</td>
                <td className="py-2 text-emerald-400">Yes</td>
                <td className="py-2 text-slate-400">TCP, UDP, ICMP, HTTP</td>
                <td className="py-2 text-slate-400">Transport / App layer protocol</td>
              </tr>
              <tr>
                <td className="py-2 text-cyan-300 font-semibold">source_port</td>
                <td className="py-2 text-slate-400">Integer</td>
                <td className="py-2 text-emerald-400">Yes</td>
                <td className="py-2 text-slate-400">49152</td>
                <td className="py-2 text-slate-400">Port (0-65535)</td>
              </tr>
              <tr>
                <td className="py-2 text-cyan-300 font-semibold">destination_port</td>
                <td className="py-2 text-slate-400">Integer</td>
                <td className="py-2 text-emerald-400">Yes</td>
                <td className="py-2 text-slate-400">443</td>
                <td className="py-2 text-slate-400">Target service port (0-65535)</td>
              </tr>
              <tr>
                <td className="py-2 text-cyan-300 font-semibold">packet_size</td>
                <td className="py-2 text-slate-400">Integer</td>
                <td className="py-2 text-emerald-400">Yes</td>
                <td className="py-2 text-slate-400">1460</td>
                <td className="py-2 text-slate-400">Frame length in Bytes</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-400">status</td>
                <td className="py-2 text-slate-400">String</td>
                <td className="py-2 text-slate-500">Optional</td>
                <td className="py-2 text-slate-400">normal, suspicious, malicious</td>
                <td className="py-2 text-slate-400">Pre-labeled threat flag</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
