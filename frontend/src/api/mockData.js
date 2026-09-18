// Default seed data matching backend PostGIS database

export const INITIAL_PROJECTS = [
  {
    id: 1,
    name: 'Sundarbans Coastal Mangrove Restoration',
    description:
      'High-impact blue carbon ecosystem restoration focused on mangrove replanting, coastal protection, and tidal habitat revival.',
    project_type: 'Carbon Offset & Coastal Protection',
    country: 'India',
    region: 'West Bengal',
    status: 'Active',
    target_carbon_tco2e: 125000.0,
    sites_count: 2,
    total_area_ha: 752.5,
    owner_id: 1,
    created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
  },
  {
    id: 2,
    name: 'Western Ghats Biodiversity & Wildlife Corridor',
    description:
      'Continuous tropical rainforest corridor restoration in Nilgiri Biosphere to support endemic fauna and biomass carbon storage.',
    project_type: 'Biodiversity Conservation',
    country: 'India',
    region: 'Tamil Nadu / Kerala',
    status: 'Active',
    target_carbon_tco2e: 240000.0,
    sites_count: 2,
    total_area_ha: 870.0,
    owner_id: 1,
    created_at: new Date(Date.now() - 280 * 86400000).toISOString(),
  },
  {
    id: 3,
    name: 'Deccan Agroforestry & Soil Carbon Initiative',
    description:
      'Regenerative farming and silvopasture expansion enhancing soil organic carbon across smallholder farm clusters.',
    project_type: 'Regenerative Agriculture',
    country: 'India',
    region: 'Maharashtra',
    status: 'Planning',
    target_carbon_tco2e: 85000.0,
    sites_count: 1,
    total_area_ha: 215.0,
    owner_id: 1,
    created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
  },
];

export const INITIAL_SITES = [
  {
    id: 1,
    project_id: 1,
    name: 'Gosaba Tidal Wetland Zone',
    description: 'Primary mangrove afforestation area with dense Rhizophora and Avicennia species.',
    habitat_type: 'Mangrove Wetland',
    area_hectares: 340.5,
    centroid_lat: 22.165,
    centroid_lng: 88.805,
    latest_carbon_stock: 18200.0,
    latest_biodiversity_index: 84.5,
    boundary_geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [88.79, 22.155],
          [88.82, 22.155],
          [88.825, 22.175],
          [88.795, 22.175],
          [88.79, 22.155],
        ],
      ],
    },
  },
  {
    id: 2,
    project_id: 1,
    name: 'Sajnekhali Bio-Reserve Delta',
    description: 'Core protected delta ecosystem for Royal Bengal tigers and estuarine crocodiles.',
    habitat_type: 'Mangrove Reserve',
    area_hectares: 412.0,
    centroid_lat: 22.12,
    centroid_lng: 88.83,
    latest_carbon_stock: 22400.0,
    latest_biodiversity_index: 92.0,
    boundary_geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [88.81, 22.105],
          [88.85, 22.105],
          [88.845, 22.135],
          [88.815, 22.135],
          [88.81, 22.105],
        ],
      ],
    },
  },
  {
    id: 3,
    project_id: 2,
    name: 'Silent Valley Evergreen Block',
    description: 'Unfragmented pristine tropical evergreen rain forest sanctuary.',
    habitat_type: 'Tropical Rainforest',
    area_hectares: 580.0,
    centroid_lat: 11.135,
    centroid_lng: 76.43,
    latest_carbon_stock: 48500.0,
    latest_biodiversity_index: 95.5,
    boundary_geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [76.41, 11.12],
          [76.45, 11.12],
          [76.455, 11.15],
          [76.415, 11.15],
          [76.41, 11.12],
        ],
      ],
    },
  },
  {
    id: 4,
    project_id: 2,
    name: 'Wayanad Montane Shola Forest',
    description: 'High-altitude grassland and Shola forest complex protecting watershed sources.',
    habitat_type: 'Montane Shola',
    area_hectares: 290.0,
    centroid_lat: 11.605,
    centroid_lng: 76.085,
    latest_carbon_stock: 21000.0,
    latest_biodiversity_index: 88.0,
    boundary_geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [76.07, 11.59],
          [76.1, 11.59],
          [76.105, 11.62],
          [76.075, 11.62],
          [76.07, 11.59],
        ],
      ],
    },
  },
  {
    id: 5,
    project_id: 3,
    name: 'Pune Semi-Arid Farm Belt',
    description:
      'Agroforestry site integrated with native fruit trees and nitrogen-fixing legumes.',
    habitat_type: 'Dry Deciduous / Farm',
    area_hectares: 215.0,
    centroid_lat: 18.52,
    centroid_lng: 73.856,
    latest_carbon_stock: 9800.0,
    latest_biodiversity_index: 64.0,
    boundary_geojson: {
      type: 'Polygon',
      coordinates: [
        [
          [73.84, 18.505],
          [73.87, 18.505],
          [73.875, 18.535],
          [73.845, 18.535],
          [73.84, 18.505],
        ],
      ],
    },
  },
];

export function generateHistoricalAnalytics(site) {
  const records = [];
  const base_c = site.latest_carbon_stock || 15000;
  const base_b = site.latest_biodiversity_index || 75;
  const area = site.area_hectares || 250;
  const now = Date.now();

  for (let m = 12; m >= 0; m--) {
    const ts = new Date(now - m * 30 * 86400000).toISOString();
    const trend = (12 - m) / 12.0;
    const c_val = Math.round(base_c * (0.82 + 0.18 * trend));
    const b_val = Number(Math.min(base_b * (0.88 + 0.12 * trend), 99.0).toFixed(1));
    const n_val = Number(Math.min(0.72 * (0.85 + 0.15 * trend), 0.96).toFixed(2));
    const bio_mass = Number((area * 0.14 * (0.85 + 0.15 * trend)).toFixed(1));
    const canopy = Number(Math.min(55.0 + 25.0 * trend, 94.0).toFixed(1));
    const sp_obs = Math.round(40 * (0.75 + 0.25 * trend));

    records.push({
      timestamp: ts,
      carbon_stock_tco2e: c_val,
      biodiversity_index: b_val,
      ndvi_index: n_val,
      biomass_density_t_ha: bio_mass,
      canopy_cover_pct: canopy,
      soil_organic_carbon_pct: Number((1.8 + 1.2 * trend).toFixed(2)),
      species_observed_count: sp_obs,
    });
  }

  const latest = records[records.length - 1];
  return {
    site_id: site.id,
    site_name: site.name,
    area_hectares: site.area_hectares,
    records,
    latest_metrics: latest,
  };
}

// Spherical polygon area in hectares
export function calculatePolygonAreaHectares(coordinates) {
  if (!coordinates || coordinates.length < 3) return 50.0;
  const ring = coordinates[0];
  if (!ring || ring.length < 3) return 50.0;

  const R = 6378137; // Earth radius in meters
  let area = 0;
  const n = ring.length;

  for (let i = 0; i < n; i++) {
    const p1 = ring[i];
    const p2 = ring[(i + 1) % n];
    const lon1 = (p1[0] * Math.PI) / 180;
    const lat1 = (p1[1] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  area = Math.abs((area * R * R) / 2.0);
  // Convert square meters to hectares
  const ha = area / 10000.0;
  return Number(Math.max(ha, 1.0).toFixed(1));
}

// Compute polygon centroid
export function calculatePolygonCentroid(coordinates) {
  const ring = coordinates[0] || [];
  if (ring.length === 0) return { lat: 20.5937, lng: 78.9629 };
  let sumLat = 0;
  let sumLng = 0;
  ring.forEach(([lng, lat]) => {
    sumLng += lng;
    sumLat += lat;
  });
  return {
    lat: Number((sumLat / ring.length).toFixed(4)),
    lng: Number((sumLng / ring.length).toFixed(4)),
  };
}
