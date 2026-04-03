'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface RegionData {
  name: string;
  abbr: string;
  lat: number;
  lng: number;
  recettes: number;
  volume: number;
  valeurMoy: number;
  tva: number;
  croissance: number;
  level: 'high' | 'medium' | 'low';
}

const LEVEL_COLOR: Record<string, string> = {
  high:   '#1d4ed8',
  medium: '#00853F',
  low:    '#93c5fd',
};
const LEVEL_BORDER: Record<string, string> = {
  high:   '#005f2e',
  medium: '#00853F',
  low:    '#60a5fa',
};

function createMarkerIcon(region: RegionData, isSelected: boolean): L.DivIcon {
  const color  = LEVEL_COLOR[region.level];
  const size   = isSelected ? 46 : 38;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 40 40">
      ${isSelected ? `<circle cx="20" cy="20" r="19" fill="${color}" fill-opacity="0.2"/>` : ''}
      <circle cx="20" cy="20" r="15" fill="${color}" stroke="white" stroke-width="2.5"
        style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.3))"/>
      <text x="20" y="24" text-anchor="middle"
        font-size="${region.abbr.length > 3 ? '6' : '7'}"
        font-weight="bold" fill="white" font-family="system-ui,sans-serif">
        ${region.abbr}
      </text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize:    [size, size],
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

function FlyToSelected({ selected }: { selected: RegionData | null }) {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.flyTo([selected.lat, selected.lng], 8, { duration: 1.2 });
    } else {
      map.flyTo([14.5, -14.5], 7, { duration: 1.2 });
    }
  }, [selected, map]);
  return null;
}

function fmtXOF(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B FCFA`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M FCFA`;
  return `${(n / 1_000).toFixed(0)}K FCFA`;
}

interface Props {
  regions: RegionData[];
  selected: RegionData | null;
  onSelect: (r: RegionData | null) => void;
}

export default function SenegalMap({ regions, selected, onSelect }: Props) {
  // Guard: ne pas rendre si regions est undefined/vide
  if (!regions || regions.length === 0) return null;

  return (
    <MapContainer
      center={[14.5, -14.5]}
      zoom={7}
      style={{ width: '100%', height: '100%' }}
      zoomControl
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <FlyToSelected selected={selected} />

      {regions.map((region) => (
        <Marker
          key={region.name}
          position={[region.lat, region.lng]}
          icon={createMarkerIcon(region, selected?.name === region.name)}
          eventHandlers={{
            click: () => onSelect(selected?.name === region.name ? null : region),
          }}
        >
          <Popup closeButton={false} offset={[0, -18]}>
            <div style={{ minWidth: 180 }}>
              <div style={{
                backgroundColor: LEVEL_COLOR[region.level],
                padding: '8px 12px',
                borderRadius: '6px 6px 0 0',
              }}>
                <span style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>{region.name}</span>
              </div>
              <div style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                borderRadius: '0 0 6px 6px',
                border: '1px solid #f1f5f9',
                fontSize: 12,
              }}>
                {[
                  ['Recettes',   fmtXOF(region.recettes)],
                  ['TVA (18%)',  fmtXOF(region.tva)],
                  ['Croissance', `+${region.croissance}%`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#6b7280' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: label === 'Croissance' ? '#00853F' : '#111827' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}