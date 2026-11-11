import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Packet,
  SecurityAlert,
  TrafficStats,
  FilterOptions,
  UserSettings,
} from '../types/traffic';
import {
  generateRandomPacket,
  generateSeedPackets,
  createPortScanBurst,
  createSynFloodBurst,
  createIcmpPingSweep,
  createC2BeaconBurst,
} from '../services/trafficSimulator';
import { evaluateThreats } from '../services/threatDetector';
import { soundManager } from '../services/soundEffects';

interface TrafficContextType {
  packets: Packet[];
  filteredPackets: Packet[];
  alerts: SecurityAlert[];
  stats: TrafficStats;
  isMonitoring: boolean;
  isPaused: boolean;
  filters: FilterOptions;
  settings: UserSettings;
  selectedPacket: Packet | null;
  setSelectedPacket: (packet: Packet | null) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  togglePause: () => void;
  clearPackets: () => void;
  loadSampleDataset: (type: 'standard' | 'attack') => void;
  addPackets: (incoming: Packet[], replace?: boolean) => void;
  injectAttack: (type: 'portScan' | 'synFlood' | 'icmpSweep' | 'c2Beacon') => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  updateAlertStatus: (alertId: string, status: SecurityAlert['status']) => void;
  dismissAlert: (alertId: string) => void;
  resetAllData: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  simulationSpeed: 1200, // 1 packet every 1.2s
  bufferLimit: 300,
  autoScroll: true,
  soundAlerts: true,
  portScanThreshold: 4,
  synFloodThreshold: 8,
  trafficSpikeThreshold: 12,
  themeAccent: 'emerald',
};

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  protocol: 'ALL',
  status: 'ALL',
  direction: 'ALL',
  port: '',
};

const STORAGE_KEY_SETTINGS = 'nta_user_settings_v1';
const STORAGE_KEY_PACKETS = 'nta_packets_buffer_v1';

const TrafficContext = createContext<TrafficContextType | undefined>(undefined);

export const TrafficProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load settings from local storage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Load initial packets
  const [packets, setPackets] = useState<Packet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PACKETS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return generateSeedPackets(45);
  });

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null);

  // Save settings on update
  const updateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  }, []);

  // Save packets buffer periodically to localStorage
  useEffect(() => {
    try {
      // Save top 80 packets to prevent local storage quota saturation
      localStorage.setItem(STORAGE_KEY_PACKETS, JSON.stringify(packets.slice(0, 80)));
    } catch {
      // ignore
    }
  }, [packets]);

  // Recalculate threats when packets change
  useEffect(() => {
    // Evaluate threats over the recent 70 packets
    const recent = packets.slice(0, 70);
    const detected = evaluateThreats(recent, {
      portScanThreshold: settings.portScanThreshold,
      trafficSpikeThreshold: settings.trafficSpikeThreshold,
    });

    setAlerts((prev) => {
      // Preserve status of acknowledged alerts
      const statusMap = new Map(prev.map((a) => [a.id, a.status]));
      const merged = detected.map((d) => ({
        ...d,
        status: statusMap.get(d.id) || d.status,
      }));

      // If new critical alert appeared and sound alerts enabled
      const newHighThreat = merged.some((m) => !statusMap.has(m.id) && (m.severity === 'Critical' || m.severity === 'High'));
      if (newHighThreat && settings.soundAlerts) {
        soundManager.playAlert('High');
      }

      return merged;
    });
  }, [packets, settings.portScanThreshold, settings.trafficSpikeThreshold, settings.soundAlerts]);

  // Live packet simulation timer
  useEffect(() => {
    if (!isMonitoring || isPaused) return;

    const interval = setInterval(() => {
      const newPacket = generateRandomPacket();
      setPackets((prev) => {
        const next = [newPacket, ...prev];
        return next.length > settings.bufferLimit ? next.slice(0, settings.bufferLimit) : next;
      });
    }, settings.simulationSpeed);

    return () => clearInterval(interval);
  }, [isMonitoring, isPaused, settings.simulationSpeed, settings.bufferLimit]);

  // Start / Stop / Pause
  const startMonitoring = () => {
    setIsMonitoring(true);
    setIsPaused(false);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const clearPackets = () => {
    setPackets([]);
    setAlerts([]);
    localStorage.removeItem(STORAGE_KEY_PACKETS);
  };

  const resetAllData = () => {
    const seed = generateSeedPackets(45);
    setPackets(seed);
    setAlerts([]);
    setSettings(DEFAULT_SETTINGS);
    setFilters(DEFAULT_FILTERS);
    try {
      localStorage.removeItem(STORAGE_KEY_PACKETS);
      localStorage.removeItem(STORAGE_KEY_SETTINGS);
    } catch {
      // ignore
    }
  };

  const addPackets = (incoming: Packet[], replace = false) => {
    if (replace) {
      setPackets(incoming.slice(0, settings.bufferLimit));
    } else {
      setPackets((prev) => {
        const combined = [...incoming, ...prev];
        return combined.slice(0, settings.bufferLimit);
      });
    }
  };

  const loadSampleDataset = (type: 'standard' | 'attack') => {
    if (type === 'attack') {
      const bursts = [
        ...createPortScanBurst(),
        ...createSynFloodBurst(),
        ...createC2BeaconBurst(),
      ];
      setPackets((prev) => [...bursts, ...prev].slice(0, settings.bufferLimit));
    } else {
      const seed = generateSeedPackets(60);
      setPackets(seed);
    }
  };

  // Attack injector
  const injectAttack = (type: 'portScan' | 'synFlood' | 'icmpSweep' | 'c2Beacon') => {
    let attackPackets: Packet[] = [];
    if (type === 'portScan') {
      attackPackets = createPortScanBurst();
    } else if (type === 'synFlood') {
      attackPackets = createSynFloodBurst();
    } else if (type === 'icmpSweep') {
      attackPackets = createIcmpPingSweep();
    } else if (type === 'c2Beacon') {
      attackPackets = createC2BeaconBurst();
    }

    setPackets((prev) => [...attackPackets, ...prev].slice(0, settings.bufferLimit));
    if (settings.soundAlerts) {
      soundManager.playAlert('Critical');
    }
  };

  const updateAlertStatus = (alertId: string, status: SecurityAlert['status']) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status } : a)));
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  // Filtered Packets memo
  const filteredPackets = useMemo(() => {
    return packets.filter((p) => {
      // Search query (IP or info or protocol)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesIp = p.sourceIp.toLowerCase().includes(query) || p.destinationIp.toLowerCase().includes(query);
        const matchesInfo = (p.info || '').toLowerCase().includes(query);
        const matchesProto = p.protocol.toLowerCase().includes(query);
        if (!matchesIp && !matchesInfo && !matchesProto) return false;
      }

      // Protocol filter
      if (filters.protocol !== 'ALL' && p.protocol !== filters.protocol) {
        return false;
      }

      // Status filter
      if (filters.status !== 'ALL' && p.status !== filters.status) {
        return false;
      }

      // Direction filter
      if (filters.direction !== 'ALL' && p.direction !== filters.direction) {
        return false;
      }

      // Port filter
      if (filters.port) {
        const portNum = parseInt(filters.port, 10);
        if (!isNaN(portNum) && p.sourcePort !== portNum && p.destinationPort !== portNum) {
          return false;
        }
      }

      return true;
    });
  }, [packets, filters]);

  // Aggregate Stats memo
  const stats: TrafficStats = useMemo(() => {
    let totalBytes = 0;
    let incomingBytes = 0;
    let outgoingBytes = 0;
    let internalBytes = 0;
    let suspiciousCount = 0;
    let maliciousCount = 0;
    const protocolsSet = new Set<string>();

    packets.forEach((p) => {
      totalBytes += p.packetSize;
      protocolsSet.add(p.protocol);

      if (p.direction === 'incoming') incomingBytes += p.packetSize;
      else if (p.direction === 'outgoing') outgoingBytes += p.packetSize;
      else internalBytes += p.packetSize;

      if (p.status === 'suspicious') suspiciousCount++;
      if (p.status === 'malicious') maliciousCount++;
    });

    const avgPacketSize = packets.length > 0 ? Math.round(totalBytes / packets.length) : 0;

    return {
      totalPackets: packets.length,
      totalBytes,
      incomingBytes,
      outgoingBytes,
      internalBytes,
      suspiciousCount,
      maliciousCount,
      avgPacketSize,
      activeProtocolsCount: protocolsSet.size,
    };
  }, [packets]);

  return (
    <TrafficContext.Provider
      value={{
        packets,
        filteredPackets,
        alerts,
        stats,
        isMonitoring,
        isPaused,
        filters,
        settings,
        selectedPacket,
        setSelectedPacket,
        setFilters,
        startMonitoring,
        stopMonitoring,
        togglePause,
        clearPackets,
        loadSampleDataset,
        addPackets,
        injectAttack,
        updateSettings,
        updateAlertStatus,
        dismissAlert,
        resetAllData,
      }}
    >
      {children}
    </TrafficContext.Provider>
  );
};

export const useTraffic = () => {
  const context = useContext(TrafficContext);
  if (!context) {
    throw new Error('useTraffic must be used within a TrafficProvider');
  }
  return context;
};
