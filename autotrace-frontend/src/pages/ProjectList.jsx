import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

/* ── Skeleton ── */
const Skeleton = ({ h = 18 }) => (
    <div style={{
        width: '100%', height: h, borderRadius: 6,
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--border) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
)

/* ── Explanation Modal ── */
function ExplainModal({ project, estimate, onClose }) {
    const [dna, setDna] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!project?.project_id) return
        setLoading(true)
        api.getProjectDNA(project.project_id)
            .then(r => setDna(r.data.data))
            .catch(() => setError('Could not load DNA record for this project.'))
            .finally(() => setLoading(false))
    }, [project])

    // Close on Escape key
    useEffect(() => {
        const h = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [onClose])

    const inr = v => `₹${Number(v ?? 0).toLocaleString('en-IN')}`
    const conf = dna?.validation_result?.confidence || estimate?.confidence_level
    const confColor = c => c === 'High' ? 'var(--accent-green)' : c === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-red)'

    return (
        <>
            {/* Backdrop */}
            <div onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'rgba(5,8,17,0.82)',
                backdropFilter: 'blur(6px)', zIndex: 1000,
                animation: 'fadeIn 0.2s ease',
            }} />

            {/* Drawer panel */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: 0,
                width: 'min(680px, 95vw)',
                background: 'var(--bg-surface)',
                borderLeft: '1px solid var(--border)',
                zIndex: 1001, overflowY: 'auto',
                boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
                animation: 'slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}>

                {/* Header */}
                <div style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border)',
                    padding: '20px 28px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                    <div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                            📝 Cost DNA Explanation
                        </div>
                        <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', maxWidth: 420 }}>
                            {project?.project_name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            📍 {project?.location ? `${project.location}, ` : ''}{project?.state}
                            {' · '}{project?.distance_km ?? (project?.distance_m / 1000)?.toFixed(2)} km
                            {' · '}{project?.build_type} · {project?.area_type}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                        cursor: 'pointer', fontSize: '1rem', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                        flexShrink: 0,
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                    >✕</button>
                </div>

                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {[...Array(6)].map((_, i) => <Skeleton key={i} h={i === 0 ? 80 : 20} />)}
                        </div>
                    ) : error ? (
                        <div className="error-banner">{error}</div>
                    ) : (
                        <>
                            {/* ── Confidence Badge ── */}
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 10,
                                padding: '10px 20px', borderRadius: 99, width: 'fit-content',
                                background: dna?.validation_result?.requires_manual_review ? 'rgba(239,68,68,0.1)' : `${confColor(conf)}18`,
                                border: `1.5px solid ${dna?.validation_result?.requires_manual_review ? 'rgba(239,68,68,0.4)' : `${confColor(conf)}44`}`,
                            }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: dna?.validation_result?.requires_manual_review ? 'var(--accent-red)' : confColor(conf), display: 'inline-block', boxShadow: `0 0 8px ${dna?.validation_result?.requires_manual_review ? 'var(--accent-red)' : confColor(conf)}` }} />
                                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: dna?.validation_result?.requires_manual_review ? 'var(--accent-red)' : confColor(conf) }}>
                                    {dna?.validation_result?.confidence_score ? `${dna.validation_result.confidence_score}% Confidence` : `${conf} Confidence`}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {dna?.validation_result?.requires_manual_review ? '⚠️ Manual Planner Review Required' : `${dna?.validation_result?.deviation_percentage?.toFixed(1)}% deviation from ₹1,20k/km baseline`}
                                </span>
                            </div>

                            {/* ── Agent Audit Log ── */}
                            {dna?.validation_result?.rationale_log && dna.validation_result.rationale_log.length > 0 && (
                                <div style={{
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-md)', padding: '20px 24px'
                                }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        🔍 Agent Audit Rationale
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {dna.validation_result.rationale_log.map((log, idx) => (
                                            <div key={idx} style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-blue)' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 4 }}>{log.agent}</div>
                                                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{log.reasoning || 'No details provided.'}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── AI Explanation ── */}
                            <div style={{
                                background: 'linear-gradient(145deg, rgba(99,102,241,0.08), rgba(56,189,248,0.04))',
                                border: '1px solid rgba(99,102,241,0.25)',
                                borderRadius: 'var(--radius-md)', padding: '20px 24px',
                            }}>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    🤖 AI Explanation
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.85 }}>
                                    {dna?.explanation || 'No explanation available for this estimate.'}
                                </p>
                            </div>

                            {/* ── Cost Summary ── */}
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    💰 Cost Breakdown
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    {[
                                        ['Total Cost', estimate?.total_cost, true, '#38bdf8'],
                                        ['Cost per km', estimate?.cost_per_km, false, '#6366f1'],
                                        ['Material Cost', estimate?.material_cost, false, '#8b5cf6'],
                                        ['Labour Cost', estimate?.labor_cost, false, '#34d399'],
                                        ['Permission', estimate?.permission_cost, false, '#fb923c'],
                                        ['Equipment', estimate?.equipment_cost, false, '#64748b'],
                                    ].map(([label, val, accent, color]) => (
                                        <div key={label} style={{
                                            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-sm)', padding: '12px 16px',
                                            borderLeft: accent ? `3px solid ${color}` : '1px solid var(--border)',
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
                                            <div style={{ fontFamily: 'Space Grotesk', fontSize: accent ? '1.25rem' : '0.95rem', fontWeight: 700, color: accent ? color : 'var(--text-primary)' }}>
                                                {inr(val)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Material Quantities ── */}
                            {dna?.derived_materials && (
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        🪛 Material Quantities
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                                        {Object.entries(dna.derived_materials).map(([k, v]) => (
                                            <div key={k} style={{
                                                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-sm)', padding: '12px 14px', textAlign: 'center',
                                            }}>
                                                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                                                    {typeof v === 'number' ? v.toFixed(1) : v}
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 4 }}>
                                                    {k.replace(/_/g, ' ')}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Labour Calculation ── */}
                            {dna?.labor_calculation && (
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        👷 Labour Calculation
                                    </div>
                                    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                        {Object.entries(dna.labor_calculation).map(([k, v], i, arr) => (
                                            <div key={k} style={{
                                                display: 'flex', justifyContent: 'space-between', padding: '11px 18px',
                                                borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                                                fontSize: '0.85rem',
                                            }}>
                                                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                                                    {typeof v === 'number' ? v.toFixed(3) : v}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Multipliers ── */}
                            {dna?.multipliers_applied && (
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        ✖ Multipliers Applied
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {Object.entries(dna.multipliers_applied).map(([k, v]) => (
                                            <div key={k} style={{
                                                padding: '8px 16px', borderRadius: 99,
                                                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                                fontSize: '0.82rem', fontWeight: 600,
                                            }}>
                                                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')} </span>
                                                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'Space Grotesk' }}>× {v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Validation Flags ── */}
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    ✅ Validation
                                </div>
                                {dna?.validation_result?.flags?.length > 0
                                    ? dna.validation_result.flags.map((f, i) => (
                                        <div key={i} className="error-banner" style={{ marginBottom: 8 }}>⚠ {f}</div>
                                    ))
                                    : <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-green)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        <span style={{ fontSize: '1.3rem' }}>✓</span>
                                        Within India FTTP baseline — estimate is realistic
                                    </div>
                                }
                            </div>

                            {/* ── Project Metadata ── */}
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    📋 Project Metadata
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    {[
                                        ['Project ID', project?.project_id?.slice(0, 8) + '…'],
                                        ['Created By', project?.created_by || '—'],
                                        ['Priority', project?.priority || '—'],
                                        ['Complexity', project?.complexity || '—'],
                                        ['Permission', project?.permission_required ? 'Yes' : 'No'],
                                        ['Equipment', project?.equipment_required ? 'Yes' : 'No'],
                                        ['Created At', project?.created_at ? new Date(project.created_at).toLocaleString('en-IN') : '—'],
                                    ].map(([k, v]) => (
                                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 12px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: '0.82rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </>
                    )}
                </div>
            </div>
        </>
    )
}

/* ══════════════════════════════════════════════════════════════
   ProjectList — main page
══════════════════════════════════════════════════════════════ */
const confidenceCls = c => c === 'High' ? 'badge-green' : c === 'Medium' ? 'badge-blue' : 'badge-orange'
const statusBadge = p => p.validation_flag ? { label: '⚠ Review', cls: 'badge-orange' } : { label: '✓ OK', cls: 'badge-green' }

export default function ProjectList() {
    const [projects, setProjects] = useState([])
    const [estimates, setEstimates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('All')
    const [stateFilter, setStateFilter] = useState('All')
    const [explainRow, setExplainRow] = useState(null) // { project, estimate }

    const fetchAll = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const [pR, eR] = await Promise.all([api.getProjects(), api.getEstimates()])
            setProjects(pR.data.data || [])
            setEstimates(eR.data.data || [])
        } catch {
            setError('Could not reach backend. Is it running on port 8000?')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    const merged = projects.map(p => {
        const est = estimates.find(e => e.project_id === p.project_id) || {}
        return { ...p, ...est, _project: p, _estimate: est }
    })

    const uniqueStates = ['All', ...new Set(projects.map(p => p.state || p.district || '').filter(Boolean))]

    const filtered = merged.filter(p => {
        const q = search.toLowerCase()
        const matchSearch =
            (p.project_name || '').toLowerCase().includes(q) ||
            (p.state || '').toLowerCase().includes(q) ||
            (p.location || '').toLowerCase().includes(q) ||
            (p.project_id || '').includes(q)
        const matchFilter = filter === 'All' || (filter === 'Review' ? p.validation_flag : !p.validation_flag)
        const matchState = stateFilter === 'All' || (p.state || p.district) === stateFilter
        return matchSearch && matchFilter && matchState
    })

    const totalCost = filtered.reduce((s, p) => s + (p.total_cost || 0), 0)
    const totalKm = filtered.reduce((s, p) => s + (p.distance_km || (p.distance_m ? p.distance_m / 1000 : 0)), 0)

    return (
        <div className="page-wrapper fade-up">

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">
                        {loading
                            ? 'Loading…'
                            : `${filtered.length} of ${projects.length} projects · ₹${totalCost.toLocaleString('en-IN')} · ${totalKm.toFixed(1)} km`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-ghost" onClick={fetchAll}>⟳ Refresh</button>
                    <Link to="/estimate" className="btn btn-primary">✦ New Estimate</Link>
                </div>
            </div>

            {/* ── Filters ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <input id="project-search" className="form-input" style={{ maxWidth: 280 }}
                    placeholder="Search project, state, city…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                <select className="form-select" style={{ maxWidth: 200 }}
                    value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                    {uniqueStates.map(s => <option key={s} value={s}>{s === 'All' ? '🇮🇳 All States' : s}</option>)}
                </select>
                {[
                    { label: 'All', val: 'All' },
                    { label: '✓ OK', val: 'OK' },
                    { label: '⚠ Review', val: 'Review' },
                ].map(f => (
                    <button key={f.val}
                        className={`btn ${filter === f.val ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setFilter(f.val)}
                        style={{ padding: '10px 18px' }}>{f.label}</button>
                ))}
            </div>

            {error && <div className="error-banner" style={{ marginBottom: 20 }}>⚠ {error}</div>}

            {/* ── Table ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>State</th>
                                <th>Location</th>
                                <th>Distance</th>
                                <th>Build</th>
                                <th>Area</th>
                                <th>Complexity</th>
                                <th>Total Cost (₹)</th>
                                <th>Cost/km (₹)</th>
                                <th>Confidence</th>
                                <th>Created By</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>{[...Array(13)].map((_, j) => <td key={j}><Skeleton /></td>)}</tr>
                                ))
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={13}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">◈</div>
                                        <div className="empty-state-text">{projects.length === 0 ? 'No projects yet' : 'No matching projects'}</div>
                                        <div className="empty-state-sub">
                                            {projects.length === 0
                                                ? <Link to="/estimate" className="btn btn-primary" style={{ marginTop: 12 }}>✦ Create first estimate</Link>
                                                : 'Adjust your search or filter'}
                                        </div>
                                    </div>
                                </td></tr>
                            ) : (
                                filtered.map(p => {
                                    const km = p.distance_km || (p.distance_m ? p.distance_m / 1000 : 0)
                                    const badge = statusBadge(p)
                                    return (
                                        <tr key={p.project_id || p._id}>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: 200 }}>{p.project_name}</td>
                                            <td><span className="badge badge-blue">{p.state || p.district || '—'}</span></td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)' }}>
                                                {p.location ? `📍 ${p.location}` : '—'}
                                            </td>
                                            <td style={{ fontFamily: 'Space Grotesk', fontWeight: 700 }}>{km.toFixed(2)} km</td>
                                            <td>
                                                <span className={`badge ${p.build_type === 'overhead' ? 'badge-blue' : 'badge-orange'}`}>{p.build_type}</span>
                                            </td>
                                            <td>{p.area_type}</td>
                                            <td>{p.complexity}</td>
                                            <td style={{ color: 'var(--accent-cyan)', fontFamily: 'Space Grotesk', fontWeight: 700 }}>
                                                {p.total_cost != null ? `₹${p.total_cost.toLocaleString('en-IN')}` : '—'}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {p.cost_per_km != null ? `₹${Math.round(p.cost_per_km).toLocaleString('en-IN')}` : '—'}
                                            </td>
                                            <td>
                                                <span className={`badge ${confidenceCls(p.confidence_level)}`}>{p.confidence_level || '—'}</span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{p.created_by || '—'}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}
                                            </td>

                                            {/* ── Actions ── */}
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn btn-ghost"
                                                        style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap' }}
                                                        onClick={() => setExplainRow({ project: p._project || p, estimate: p._estimate || {} })}
                                                    >
                                                        📝 Explain
                                                    </button>
                                                    <Link
                                                        to={`/replay/${p.project_id || p._id}`}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 14px', fontSize: '0.78rem', fontWeight: 700, whiteSpace: 'nowrap', border: '1px solid var(--border)' }}
                                                    >
                                                        🔄 Replay
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Explanation Modal ── */}
            {explainRow && (
                <ExplainModal
                    project={explainRow.project}
                    estimate={explainRow.estimate}
                    onClose={() => setExplainRow(null)}
                />
            )}

        </div>
    )
}
