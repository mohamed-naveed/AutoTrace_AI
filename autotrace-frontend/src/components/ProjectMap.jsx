import { useEffect, useRef, useState, useMemo } from 'react'
import Map, { Marker, Popup, useMap } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getProjectCoords, INDIA_CENTER } from '../utils/cityCoords'

// Custom colored marker component
const ProjectMarker = ({ color, onClick }) => (
    <div 
        onClick={onClick}
        style={{
            width: 14, height: 14, borderRadius: '50%',
            background: color,
            border: '2px solid #fff',
            boxShadow: `0 0 10px ${color}88, 0 2px 8px rgba(0,0,0,0.4)`,
            cursor: 'pointer',
            transform: 'translate(-50%, -50%)',
            transition: 'transform 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.5)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
    />
)

const inr = v => `₹${Number(v ?? 0).toLocaleString('en-IN')}`

export default function ProjectMap({ projects = [], estimates = [], height = 400, onMarkerClick }) {
    const mapRef = useRef(null)
    const [popupInfo, setPopupInfo] = useState(null)

    // Auto-fit bounds when projects change
    useEffect(() => {
        if (!projects || projects.length === 0 || !mapRef.current) return

        const coords = projects.map(p => {
            const [lat, lng] = getProjectCoords(p)
            return [lng, lat] // MapLibre uses [lng, lat]
        })

        if (coords.length === 1) {
            mapRef.current.flyTo({ center: coords[0], zoom: 8, duration: 2000 })
        } else {
            const lats = coords.map(c => c[1])
            const lngs = coords.map(c => c[0])
            const bounds = [
                [Math.min(...lngs), Math.min(...lats)],
                [Math.max(...lngs), Math.max(...lats)]
            ]
            mapRef.current.fitBounds(bounds, { padding: 40, duration: 2000 })
        }
    }, [projects])

    if (!projects || projects.length === 0) {
        return (
            <div style={{
                height, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)', color: 'var(--text-muted)',
                fontSize: '0.88rem',
            }}>
                🗺️ No projects to display on map
            </div>
        )
    }

    const getEstimate = (projectId) => estimates.find(e => e.project_id === projectId)

    return (
        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', height }}>
            <Map
                ref={mapRef}
                initialViewState={{
                    latitude: INDIA_CENTER[0],
                    longitude: INDIA_CENTER[1],
                    zoom: 4
                }}
                mapStyle="https://tiles.openfreemap.org/styles/dark"
                style={{ width: '100%', height: '100%' }}
            >
                {projects.map(project => {
                    const [lat, lng] = getProjectCoords(project)
                    const est = getEstimate(project.project_id)
                    const hasReview = est?.validation_flag
                    const color = hasReview ? '#fb923c' : est ? '#34d399' : '#22d3ee'

                    return (
                        <Marker
                            key={project.project_id}
                            latitude={lat}
                            longitude={lng}
                            anchor="center"
                        >
                            <ProjectMarker 
                                color={color} 
                                onClick={(e) => {
                                    e.originalEvent.stopPropagation()
                                    setPopupInfo(project)
                                    onMarkerClick?.(project)
                                }} 
                            />
                        </Marker>
                    )
                })}

                {popupInfo && (
                    <Popup
                        latitude={getProjectCoords(popupInfo)[0]}
                        longitude={getProjectCoords(popupInfo)[1]}
                        anchor="bottom"
                        onClose={() => setPopupInfo(null)}
                        closeButton={false}
                        maxWidth="auto"
                    >
                        <div style={{
                            fontFamily: "'Inter', 'Space Grotesk', sans-serif",
                            minWidth: 200,
                            color: '#e2e8f0',
                            padding: '4px'
                        }}>
                            <div style={{
                                fontSize: '0.92rem', fontWeight: 700,
                                color: '#f1f5f9', marginBottom: 8,
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                paddingBottom: 6,
                            }}>
                                📍 {popupInfo.project_name}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.78rem' }}>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>State</span><br />
                                    <span style={{ fontWeight: 600 }}>{popupInfo.state || '—'}</span>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Location</span><br />
                                    <span style={{ fontWeight: 600 }}>{popupInfo.location || '—'}</span>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Distance</span><br />
                                    <span style={{ fontWeight: 600, color: '#22d3ee' }}>
                                        {popupInfo.distance_km || (popupInfo.distance_m / 1000).toFixed(1)} km
                                    </span>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Build</span><br />
                                    <span style={{ fontWeight: 600 }}>
                                        {popupInfo.build_type === 'overhead' ? '🗼' : '🚇'} {popupInfo.build_type}
                                    </span>
                                </div>
                                {getEstimate(popupInfo.project_id) && (
                                    <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, marginTop: 2 }}>
                                        <span style={{ color: '#94a3b8' }}>Total Cost</span><br />
                                        <span style={{
                                            fontWeight: 700, fontSize: '1rem',
                                            fontFamily: 'Space Grotesk',
                                            background: 'linear-gradient(135deg, #6366f1, #22d3ee)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}>
                                            {inr(getEstimate(popupInfo.project_id).total_cost)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    )
}
