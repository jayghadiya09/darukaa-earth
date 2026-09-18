import axios from 'axios';
import {
  INITIAL_PROJECTS,
  INITIAL_SITES,
  generateHistoricalAnalytics,
  calculatePolygonAreaHectares,
  calculatePolygonCentroid,
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3500, // 3.5s timeout for rapid offline fallback
  headers: {
    'Content-Type': 'application/json',
  },
});

// Local state cache
function getStoredProjects() {
  const cached = localStorage.getItem('darukaa_projects');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem('darukaa_projects', JSON.stringify(INITIAL_PROJECTS));
  return INITIAL_PROJECTS;
}

function saveProjects(projects) {
  localStorage.setItem('darukaa_projects', JSON.stringify(projects));
}

function getStoredSites() {
  const cached = localStorage.getItem('darukaa_sites');
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // fallback
    }
  }
  localStorage.setItem('darukaa_sites', JSON.stringify(INITIAL_SITES));
  return INITIAL_SITES;
}

function saveSites(sites) {
  localStorage.setItem('darukaa_sites', JSON.stringify(sites));
}

// Interceptor to inject JWT Bearer token into headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('darukaa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Offline & Demo fallback interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isNetworkError =
      !error.response ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.response.status === 404 ||
      error.response.status === 502 ||
      error.response.status === 503;

    if (isNetworkError) {
      const { url, method, data } = error.config;
      console.warn(
        `[Darukaa.Earth] Backend unreachable at ${url}. Serving from local high-performance store.`
      );

      // 1. Auth Me
      if (url.includes('/auth/me')) {
        return {
          status: 200,
          data: {
            id: 1,
            email: 'admin@darukaa.earth',
            full_name: 'Darukaa Administrator',
            role: 'administrator',
            is_active: true,
          },
        };
      }

      // 2. Auth Login
      if (url.includes('/auth/login')) {
        const token = 'darukaa_demo_jwt_token_admin_access';
        return {
          status: 200,
          data: {
            access_token: token,
            token_type: 'bearer',
          },
        };
      }

      // 3. Auth Register
      if (url.includes('/auth/register')) {
        let parsed = data;
        if (typeof data === 'string') {
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = {};
          }
        }
        return {
          status: 201,
          data: {
            id: 2,
            email: parsed.email || 'user@darukaa.earth',
            full_name: parsed.full_name || 'New Administrator',
            role: parsed.role || 'administrator',
          },
        };
      }

      // 4. Projects GET
      if (url.endsWith('/projects/') || url.endsWith('/projects')) {
        if (method === 'get') {
          return { status: 200, data: getStoredProjects() };
        }
        if (method === 'post') {
          const body = typeof data === 'string' ? JSON.parse(data) : data;
          const projects = getStoredProjects();
          const newProj = {
            id: projects.length + 1,
            name: body.name,
            description: body.description || '',
            project_type: body.project_type || 'Carbon Offset',
            country: body.country || 'Global',
            region: body.region || '',
            target_carbon_tco2e: parseFloat(body.target_carbon_tco2e) || 100000.0,
            status: 'Active',
            sites_count: 0,
            total_area_ha: 0.0,
            owner_id: 1,
            created_at: new Date().toISOString(),
          };
          projects.unshift(newProj);
          saveProjects(projects);
          return { status: 201, data: newProj };
        }
      }

      // 5. Sites GET / POST
      if (url.endsWith('/sites/') || url.endsWith('/sites')) {
        if (method === 'get') {
          return { status: 200, data: getStoredSites() };
        }
        if (method === 'post') {
          const body = typeof data === 'string' ? JSON.parse(data) : data;
          const sites = getStoredSites();
          const geom = body.boundary_geojson?.geometry || body.boundary_geojson;
          const coords = geom?.coordinates || [];
          const areaHa = calculatePolygonAreaHectares(coords);
          const centroid = calculatePolygonCentroid(coords);

          const newSite = {
            id: sites.length + 1,
            project_id: body.project_id || 1,
            name: body.name || 'New Conservation Site',
            description: body.description || '',
            habitat_type: body.habitat_type || 'Tropical Forest',
            area_hectares: areaHa,
            centroid_lat: centroid.lat,
            centroid_lng: centroid.lng,
            latest_carbon_stock: Math.round(areaHa * 45),
            latest_biodiversity_index: 82.0,
            boundary_geojson: geom,
          };
          sites.push(newSite);
          saveSites(sites);

          // Update project site counts
          const projects = getStoredProjects();
          const p = projects.find((proj) => proj.id === body.project_id);
          if (p) {
            p.sites_count = (p.sites_count || 0) + 1;
            p.total_area_ha = Number(((p.total_area_ha || 0) + areaHa).toFixed(1));
            saveProjects(projects);
          }

          return { status: 201, data: newSite };
        }
      }

      // 6. Analytics Query
      if (url.includes('/analytics/site/')) {
        const siteId = parseInt(url.split('/').pop());
        const sites = getStoredSites();
        const site = sites.find((s) => s.id === siteId) || sites[0];
        const analytics = generateHistoricalAnalytics(site);
        return { status: 200, data: analytics };
      }

      // 7. Seed Data Reset
      if (url.includes('/seed')) {
        saveProjects(INITIAL_PROJECTS);
        saveSites(INITIAL_SITES);
        return {
          status: 200,
          data: { status: 'success', message: 'Dataset reseeded to initial state.' },
        };
      }
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('darukaa_token');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
