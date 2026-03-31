/**
 * Utility for geometric calculations and routing APIs
 */

/**
 * Calculates straight-line distance using Haversine formula
 * Returns distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Fetches actual road distance and geometry from OSRM Public API
 * Returns { distanceKm, geometry, durationMin }
 */
export async function getOSRMRoute(start, end, fetchAlternatives = true) {
    if (!start || !end) return null;

    try {
        const fetchRoute = async (points) => {
            const coordsString = points.map(p => `${p[1]},${p[0]}`).join(';');
            const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                return data.routes[0];
            }
            return null;
        };

        // Main Route
        const mainRoute = await fetchRoute([start, end]);
        if (!mainRoute) throw new Error('OSRM route not found');

        const allRoutes = [{
            id: 0,
            distanceKm: mainRoute.distance / 1000,
            durationMin: mainRoute.duration / 60,
            geometry: mainRoute.geometry
        }];

        if (!fetchAlternatives) {
            return allRoutes;
        }

        // Generate synthetic waypoints for guaranteed alternatives
        const dLat = end[0] - start[0];
        const dLon = end[1] - start[1];
        const midLat = (start[0] + end[0]) / 2;
        const midLon = (start[1] + end[1]) / 2;
        
        // Perpendicular vector
        const len = Math.sqrt(dLat*dLat + dLon*dLon) || 1;
        const pLat = -dLon / len;
        const pLon = dLat / len;
        const shiftDist = len * 0.20; // 20% shift off-center

        const wp1 = [midLat + pLat * shiftDist, midLon + pLon * shiftDist];
        const wp2 = [midLat - pLat * shiftDist, midLon - pLon * shiftDist];

        const [alt1, alt2] = await Promise.all([
            fetchRoute([start, wp1, end]),
            fetchRoute([start, wp2, end])
        ]);

        if (alt1 && alt1.distance > mainRoute.distance && alt1.distance < mainRoute.distance * 1.5) {
            allRoutes.push({
                id: 1,
                distanceKm: alt1.distance / 1000,
                durationMin: alt1.duration / 60,
                geometry: alt1.geometry
            });
        }
        if (alt2 && alt2.distance > mainRoute.distance && alt2.distance < mainRoute.distance * 1.5) {
            allRoutes.push({
                id: 2,
                distanceKm: alt2.distance / 1000,
                durationMin: alt2.duration / 60,
                geometry: alt2.geometry
            });
        }

        // Sort by distance (shortest first)
        return allRoutes.sort((a,b) => a.distanceKm - b.distanceKm).map((rt, idx) => ({...rt, id: idx}));
    } catch (error) {
        console.error('OSRM API Error:', error);
        // Fallback to straight line
        const directDist = calculateHaversineDistance(start[0], start[1], end[0], end[1]);
        return [{
            id: 0,
            distanceKm: directDist * 1.2, // Add 20% for road curvature
            durationMin: (directDist * 1.2) * 2, // Dummy duration
            geometry: {
                type: 'LineString',
                coordinates: [[start[1], start[0]], [end[1], end[0]]]
            },
            fallback: true
        }];
    }
}
