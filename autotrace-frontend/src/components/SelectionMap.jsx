import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Map, { Marker, Source, Layer, Popup, useMap } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getOSRMRoute } from '../utils/routeUtils'
import LocationSearch from './LocationSearch'

export default function SelectionMap({ onComplete, initialSource = null, initialDest = null }) {
    const mapRef = useRef(null)
    const [source, setSource] = useState(initialSource)
    const [destination, setDestination] = useState(initialDest)
    const [routes, setRoutes] = useState([])
    const [selectedRouteIndex, setSelectedRouteIndex] = useState(0)
    const [distance, setDistance] = useState(0)
    const [loading, setLoading] = useState(false)
    const [pickingMode, setPickingMode] = useState('source')
    const [fetchingAlts, setFetchingAlts] = useState(false)

    // Effect to calculate route
    useEffect(() => {
        if (source && destination) {
            setLoading(true)
            getOSRMRoute(source, destination, false).then(data => {
                if (data && data.length > 0) {
                    setRoutes(data)
                    setSelectedRouteIndex(0)
                    setDistance(data[0].distanceKm)
                } else {
                    setRoutes([])
                    setSelectedRouteIndex(0)
                    setDistance(0)
                }
                setLoading(false)
            })
        }
    }, [source, destination])

    // Auto-fit bounds
    useEffect(() => {
        if (!source || !destination || !mapRef.current) return
        const bounds = [
            [Math.min(source[1], destination[1]), Math.min(source[0], destination[0])],
            [Math.max(source[1], destination[1]), Math.max(source[0], destination[0])]
        ]
        mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 })
    }, [source, destination])

    const onMapClick = (e) => {
        const { lat, lng } = e.lngLat
        if (pickingMode === 'source') {
            setSource([lat, lng])
            setPickingMode('dest')
        } else if (pickingMode === 'dest' && !destination) {
            setDestination([lat, lng])
            setPickingMode('adjust') 
        }
    }

    const reset = () => {
        setSource(null)
        setDestination(null)
        setRoutes([])
        setSelectedRouteIndex(0)
        setDistance(0)
    }

    const [mapInstance, setMapInstance] = useState(null)

    const onMapLoad = useCallback((e) => {
        setMapInstance(e.target)
    }, [])

    // Native MapLibre GL JS Route Rendering (bypasses React-Map-GL abstraction bugs)
    useEffect(() => {
        const mapInstance = mapRef.current?.getMap();
        if (!mapInstance) return;

        if (routes.length === 0) {
            // Clear the map if reset is clicked
            if (mapInstance.getSource('routes-source')) {
                mapInstance.getSource('routes-source').setData({ type: 'FeatureCollection', features: [] });
            }
            return;
        }

        const data = {
            type: 'FeatureCollection',
            features: routes.map(rt => ({
                type: 'Feature',
                properties: { 
                    id: rt.id, 
                    isSelected: rt.id === selectedRouteIndex 
                },
                geometry: rt.geometry
            }))
        };

        if (!mapInstance.getSource('routes-source')) {
            mapInstance.addSource('routes-source', { type: 'geojson', data });
        } else {
            mapInstance.getSource('routes-source').setData(data);
        }

        // Always check and enforce layers existing, since react-map-gl might drop native layers silently
        if (!mapInstance.getLayer('routes-shadows')) {
            mapInstance.addLayer({
                id: 'routes-shadows', type: 'line', source: 'routes-source',
                filter: ['!=', ['get', 'isSelected'], true],
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#64748b', 'line-width': 5, 'line-opacity': 0.4 }
            });
        }
        if (!mapInstance.getLayer('routes-lines')) {
            mapInstance.addLayer({
                id: 'routes-lines', type: 'line', source: 'routes-source',
                filter: ['!=', ['get', 'isSelected'], true],
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#94a3b8', 'line-width': 3, 'line-opacity': 0.8 }
            });
        }
        if (!mapInstance.getLayer('route-shadow-active')) {
            mapInstance.addLayer({
                id: 'route-shadow-active', type: 'line', source: 'routes-source',
                filter: ['==', ['get', 'isSelected'], true],
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#38bdf8', 'line-width': 8, 'line-opacity': 0.4 }
            });
        }
        if (!mapInstance.getLayer('route-line-active')) {
            mapInstance.addLayer({
                id: 'route-line-active', type: 'line', source: 'routes-source',
                filter: ['==', ['get', 'isSelected'], true],
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#0ea5e9', 'line-width': 4, 'line-opacity': 1 }
            });
        }

        // Force refresh filters in case they desync
        if (mapInstance.getLayer('routes-shadows')) mapInstance.setFilter('routes-shadows', ['!=', ['get', 'isSelected'], true]);
        if (mapInstance.getLayer('routes-lines')) mapInstance.setFilter('routes-lines', ['!=', ['get', 'isSelected'], true]);
        if (mapInstance.getLayer('route-shadow-active')) mapInstance.setFilter('route-shadow-active', ['==', ['get', 'isSelected'], true]);
        if (mapInstance.getLayer('route-line-active')) mapInstance.setFilter('route-line-active', ['==', ['get', 'isSelected'], true]);

    }, [mapInstance, routes, selectedRouteIndex]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Control Panel */}
            <div style={{ 
                display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center',
                padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)' 
            }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                    <div style={{ width: '100%', maxWidth: 400 }}>
                        <LocationSearch onSelect={(coords) => {
                            if (pickingMode === 'source') {
                                setSource(coords)
                                setPickingMode('dest')
                            } else {
                                setDestination(coords)
                            }
                        }} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={reset} style={{ padding: '8px 16px' }}>Reset</button>
                    <button className="btn btn-primary" onClick={() => onComplete(distance.toFixed(2))} 
                        disabled={!distance || loading} style={{ padding: '8px 24px' }}>
                        Use {distance ? `${distance.toFixed(1)} km` : 'Selected Route'}
                    </button>
                </div>
            </div>

            <div style={{ position: 'relative', height: 450, borderRadius: 16, overflow: 'hidden', border: '2px solid var(--border-accent)' }}>
                <Map
                    ref={mapRef}
                    mapLib={maplibregl}
                    initialViewState={{
                        latitude: 20.5937,
                        longitude: 78.9629,
                        zoom: 4
                    }}
                    mapStyle="https://tiles.openfreemap.org/styles/positron"
                    onClick={onMapClick}
                    onLoad={onMapLoad}
                    style={{ width: '100%', height: '100%' }}
                >
                    {source && (
                        <Marker
                            latitude={source[0]}
                            longitude={source[1]}
                            draggable={true}
                            onDragEnd={e => setSource([e.lngLat.lat, e.lngLat.lng])}
                        >
                            <div style={{ color: '#3b82f6', fontSize: '2rem' }}>📍</div>
                        </Marker>
                    )}

                    {destination && (
                        <Marker
                            latitude={destination[0]}
                            longitude={destination[1]}
                            draggable={true}
                            onDragEnd={e => setDestination([e.lngLat.lat, e.lngLat.lng])}
                        >
                            <div style={{ color: '#ef4444', fontSize: '2rem' }}>🚩</div>
                        </Marker>
                    )}
                </Map>

                {/* Floating Guide Overlay */}
                <div style={{
                    position: 'absolute', top: 20, right: 20, zIndex: 1000,
                    maxWidth: 240, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(10px)',
                    padding: '16px', borderRadius: 14, border: '1px solid var(--border-accent)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)', color: '#fff',
                    maxHeight: 'calc(100% - 40px)', overflowY: 'auto'
                }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 12, letterSpacing: '0.05em' }}>
                        Mission Guidance
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: pickingMode === 'source' && !source ? 1 : 0.5 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>1</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: pickingMode === 'source' && !source ? 700 : 400 }}>Pick Fiber Source point</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: (source && !destination) ? 1 : 0.5 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>2</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: (source && !destination) ? 700 : 400 }}>Pick Project Site location</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: (source && destination) ? 1 : 0.5 }}>
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.2)', border: '1px solid var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>3</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: (source && destination) ? 700 : 400 }}>Adjust route (Drag markers)</div>
                        </div>
                    </div>

                    {distance > 0 && (
                        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                                {distance.toFixed(1)}<small style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: 2 }}>km</small>
                            </div>
                            {loading ? (
                                <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)' }}>Adjusting routes...</div>
                            ) : (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>via {routes[selectedRouteIndex]?.durationMin ? Math.round(routes[selectedRouteIndex].durationMin) + ' min' : 'OSRM'}</div>
                            )}
                        </div>
                    )}

                    {routes.length === 1 && !fetchingAlts && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                            <button 
                                onClick={() => {
                                    setFetchingAlts(true);
                                    getOSRMRoute(source, destination, true).then(data => {
                                        if (data) setRoutes(data);
                                        setFetchingAlts(false);
                                    });
                                }}
                                style={{
                                    width: '100%', padding: '10px', background: 'rgba(56, 189, 248, 0.1)',
                                    border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)',
                                    borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
                            >
                                🔄 Find Alternative Routes
                            </button>
                        </div>
                    )}

                    {fetchingAlts && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                            Analysing secondary routes...
                        </div>
                    )}

                    {routes.length > 1 && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, marginBottom: 8, letterSpacing: '0.05em' }}>
                                Alternative Routes
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {routes.map((rt, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => { setSelectedRouteIndex(idx); setDistance(rt.distanceKm); }}
                                        style={{ 
                                            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            border: selectedRouteIndex === idx ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                                            background: selectedRouteIndex === idx ? 'rgba(34, 211, 238, 0.1)' : 'rgba(255,255,255,0.02)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.8rem', fontWeight: selectedRouteIndex === idx ? 700 : 500, color: selectedRouteIndex === idx ? 'var(--accent-cyan)' : 'var(--text)' }}>
                                            Option {idx + 1}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                            <div>{rt.distanceKm.toFixed(1)} km</div>
                                            <div style={{ opacity: 0.7 }}>{Math.round(rt.durationMin)} min</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
