import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

/** Dark basemap: Mapbox streets-dark when token present, else free raster tiles via Mapbox GL. */
function getMapStyle() {
  if (MAPBOX_TOKEN && MAPBOX_TOKEN.startsWith('pk.')) {
    return 'mapbox://styles/mapbox/dark-v11';
  }
  return {
    version: 8,
    sources: {
      'carto-dark': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
          'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        ],
        tileSize: 256,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      },
    },
    layers: [{ id: 'carto-dark', type: 'raster', source: 'carto-dark' }],
  };
}

function siteToFeature(site) {
  const geom = site.boundary_geojson?.geometry || site.boundary_geojson;
  if (!geom) return null;
  return {
    type: 'Feature',
    geometry: geom,
    properties: {
      id: site.id,
      name: site.name,
      habitat_type: site.habitat_type,
      area_hectares: site.area_hectares,
      latest_carbon_stock: site.latest_carbon_stock,
      latest_biodiversity_index: site.latest_biodiversity_index,
    },
  };
}

export const InteractiveMap = ({
  sites = [],
  selectedSite = null,
  onSiteSelect = () => {},
  onPolygonDrawn = null,
  onInitDraw = null,
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const popupRef = useRef(null);
  const onSiteSelectRef = useRef(onSiteSelect);
  const onPolygonDrawnRef = useRef(onPolygonDrawn);
  const onInitDrawRef = useRef(onInitDraw);
  const sitesRef = useRef(sites);

  useEffect(() => {
    onSiteSelectRef.current = onSiteSelect;
    onPolygonDrawnRef.current = onPolygonDrawn;
    onInitDrawRef.current = onInitDraw;
    sitesRef.current = sites;
  }, [onSiteSelect, onPolygonDrawn, onInitDraw, sites]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN || 'pk.local-dev-token';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getMapStyle(),
      center: [78.9629, 20.5937],
      zoom: 4.5,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), 'top-right');
    popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: '280px' });

    map.on('load', () => {
      map.addSource('sites', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'sites-fill',
        type: 'fill',
        source: 'sites',
        paint: {
          'fill-color': [
            'case',
            ['==', ['get', 'id'], selectedSite?.id ?? -1],
            '#06B6D4',
            '#10B981',
          ],
          'fill-opacity': ['case', ['==', ['get', 'id'], selectedSite?.id ?? -1], 0.5, 0.28],
        },
      });

      map.addLayer({
        id: 'sites-outline',
        type: 'line',
        source: 'sites',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'id'], selectedSite?.id ?? -1],
            '#22D3EE',
            '#34D399',
          ],
          'line-width': ['case', ['==', ['get', 'id'], selectedSite?.id ?? -1], 3, 2],
        },
      });

      map.on('click', 'sites-fill', (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const props = feature.properties;
        const site = sitesRef.current.find((s) => s.id === Number(props.id)) || {
          id: Number(props.id),
          name: props.name,
          habitat_type: props.habitat_type,
          area_hectares: Number(props.area_hectares),
          latest_carbon_stock: Number(props.latest_carbon_stock),
          latest_biodiversity_index: Number(props.latest_biodiversity_index),
          boundary_geojson: feature.geometry,
          centroid_lng: e.lngLat.lng,
          centroid_lat: e.lngLat.lat,
        };

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font-family:system-ui,sans-serif;color:#0f172a;padding:4px">
              <h4 style="margin:0 0 4px;font-size:14px;font-weight:700">${props.name}</h4>
              <p style="margin:0 0 4px;font-size:11px;color:#475569">Habitat: <b>${props.habitat_type || 'N/A'}</b></p>
              <p style="margin:0 0 6px;font-size:11px;color:#475569">Area: <b>${props.area_hectares} ha</b></p>
              <div style="background:#e2e8f0;padding:6px;border-radius:4px;font-size:11px">
                Carbon: <b>${props.latest_carbon_stock || 'N/A'} tCO2e</b><br/>
                Bio Index: <b>${props.latest_biodiversity_index || 'N/A'} / 100</b>
              </div>
            </div>`
          )
          .addTo(map);

        onSiteSelectRef.current(site);
      });

      map.on('mouseenter', 'sites-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'sites-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      if (onPolygonDrawnRef.current) {
        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: { polygon: true, trash: true },
          defaultMode: 'simple_select',
          styles: [
            {
              id: 'gl-draw-polygon-fill',
              type: 'fill',
              filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              paint: { 'fill-color': '#10B981', 'fill-opacity': 0.35 },
            },
            {
              id: 'gl-draw-polygon-stroke',
              type: 'line',
              filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              paint: { 'line-color': '#10B981', 'line-width': 2 },
            },
            {
              id: 'gl-draw-polygon-midpoint',
              type: 'circle',
              filter: ['all', ['==', '$meta', 'midpoint'], ['==', '$type', 'Point']],
              paint: { 'circle-radius': 4, 'circle-color': '#06B6D4' },
            },
            {
              id: 'gl-draw-polygon-and-line-vertex',
              type: 'circle',
              filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
              paint: {
                'circle-radius': 5,
                'circle-color': '#fff',
                'circle-stroke-color': '#10B981',
                'circle-stroke-width': 2,
              },
            },
          ],
        });
        map.addControl(draw, 'top-left');
        drawRef.current = draw;

        map.on('draw.create', (e) => {
          const feature = e.features?.[0];
          if (feature) {
            onPolygonDrawnRef.current(feature);
            setTimeout(() => {
              draw.deleteAll();
            }, 100);
          }
        });

        if (onInitDrawRef.current) {
          onInitDrawRef.current({
            startDrawing: () => draw.changeMode('draw_polygon'),
            deleteAll: () => draw.deleteAll(),
          });
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      const source = map.getSource('sites');
      if (!source) return;

      const features = sites.map(siteToFeature).filter(Boolean);
      source.setData({ type: 'FeatureCollection', features });

      if (map.getLayer('sites-fill')) {
        const selectedId = selectedSite?.id ?? -1;
        map.setPaintProperty('sites-fill', 'fill-color', [
          'case',
          ['==', ['get', 'id'], selectedId],
          '#06B6D4',
          '#10B981',
        ]);
        map.setPaintProperty('sites-fill', 'fill-opacity', [
          'case',
          ['==', ['get', 'id'], selectedId],
          0.5,
          0.28,
        ]);
        map.setPaintProperty('sites-outline', 'line-color', [
          'case',
          ['==', ['get', 'id'], selectedId],
          '#22D3EE',
          '#34D399',
        ]);
        map.setPaintProperty('sites-outline', 'line-width', [
          'case',
          ['==', ['get', 'id'], selectedId],
          3,
          2,
        ]);
      }

      if (features.length > 0 && !selectedSite) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach((f) => {
          const coords =
            f.geometry.type === 'Polygon'
              ? f.geometry.coordinates[0]
              : f.geometry.type === 'MultiPolygon'
                ? f.geometry.coordinates.flat(2)
                : [];
          coords.forEach((c) => bounds.extend(c));
        });
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 56, maxZoom: 12, duration: 800 });
        }
      }

      if (selectedSite?.centroid_lng && selectedSite?.centroid_lat) {
        map.flyTo({
          center: [selectedSite.centroid_lng, selectedSite.centroid_lat],
          zoom: Math.max(map.getZoom(), 11),
          essential: true,
        });
      }
    };

    if (map.isStyleLoaded()) update();
    else map.once('load', update);
  }, [sites, selectedSite]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

      <div className="absolute bottom-4 right-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-3 text-xs text-slate-300 shadow-lg flex flex-col gap-1.5">
        <div className="font-semibold text-white mb-0.5 text-[11px] uppercase tracking-wider">
          Map Legend
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-400 inline-block" />
          <span>Project Sites (Polygon)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-cyan-500/50 border border-cyan-400 inline-block" />
          <span>Selected Site</span>
        </div>
        {onPolygonDrawn && (
          <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-emerald-400 font-medium">
            Use the polygon tool (top-left) to draw a new site
          </div>
        )}
        {!MAPBOX_TOKEN && (
          <div className="mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-amber-400">
            Set VITE_MAPBOX_TOKEN for Mapbox dark basemap
          </div>
        )}
      </div>
    </div>
  );
};
