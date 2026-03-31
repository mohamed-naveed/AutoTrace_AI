import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../services/api'
import ProjectMap from '../components/ProjectMap'

const Skeleton = ({ w = '100%', h = 20 }) => (
    <div style={{
        width: w, height: h, borderRadius: 6,
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--border) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
    }} />
)

const StatusDot = ({ online }) => (
    <span style={{
        display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginRight: 8,
        background: online ? 'var(--accent-green)' : 'var(--accent-red)',
        boxShadow: online ? '0 0 8px var(--accent-green)' : 'none',
    }} />
)

export default function Dashboard() {
    const [time, setTime] = useState(new Date())
    const [projects, setProjects] = useState([])
    const [estimates, setEstimates] = useState([])
    const [loading, setLoading] = useState(true)
    const [backendUp, setBackendUp] = useState(false)
    const [lastRefresh, setLastRefresh] = useState(null)

    const fetchAll = useCallback(async () => {
        try {
            const [projRes, estRes] = await Promise.all([
                api.getProjects(),
                api.getEstimates(),
            ])
            setProjects(projRes.data.data || [])
            setEstimates(estRes.data.data || [])
            setBackendUp(true)
            setLastRefresh(new Date())
        } catch {
            setBackendUp(false)
        } finally {
            setLoading(false)
        }
    }, [])

    // Clock
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    // Initial load + auto-refresh every 30 s
    useEffect(() => {
        fetchAll()
        const interval = setInterval(fetchAll, 30_000)
        return () => clearInterval(interval)
    }, [fetchAll])

    // Compute stats from real data
    const totalCost = estimates.reduce((s, e) => s + (e.total_cost || 0), 0)
    const totalKm = projects.reduce((s, p) => s + (p.distance_km || 0), 0)
    const avgPerKm = totalKm > 0 ? totalCost / totalKm : 0
    const recent = [...projects].reverse().slice(0, 6)

    const statusBadge = e => {
        const flag = estimates.find(est => est.project_id === e.project_id)
        if (!flag) return { label: 'No Estimate', cls: 'badge-orange' }
        return flag.validation_flag
            ? { label: 'Review', cls: 'badge-orange' }
            : { label: 'Completed', cls: 'badge-green' }
    }

    // AI Prediction Insight module (takes most recent estimate)
    const latestEst = estimates.length > 0 ? estimates[0] : null
    const ruleEst = latestEst ? (latestEst.total_cost || 0) : 0
    const aiEst = latestEst ? (latestEst.ai_predicted_cost || 0) : 0
    const confidenceLevel = latestEst ? (latestEst.confidence_level || '—') : '—'
    const differencePct = latestEst && latestEst.prediction_difference !== undefined
        ? (latestEst.prediction_difference * 100).toFixed(1)
        : '0.0'

    // Data for the Chart
    const chartData = [
        { name: 'Rule Engine', cost: ruleEst },
        { name: 'AI Prediction', cost: aiEst }
    ]

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    color: '#fff'
                }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', fontWeight: 600 }}>
                        {payload[0].payload.name}
                    </div>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', fontWeight: 700, color: payload[0].payload.name === 'AI Prediction' ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                        ₹{payload[0].value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="page-wrapper fade-up">

            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <h1 className="page-title">Mission Control</h1>
                    <p className="page-subtitle">
                        <StatusDot online={backendUp} />
                        {backendUp ? 'Backend connected' : 'Backend offline'}
                        {lastRefresh && <span style={{ marginLeft: 12, opacity: 0.5 }}>
                            · refreshed {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        {time.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })} · IST
                    </div>
                </div>
            </div>

            {/* ── KPI Stats ── */}
            <div className="stats-grid">
                <div className="stat-card cyan">
                    <div className="stat-icon cyan">💎</div>
                    <div className="stat-value">
                        {loading ? <Skeleton w={80} h={28} /> : totalCost > 0
                            ? `₹${(totalCost / 1_00_00_000).toFixed(2)} Cr`
                            : '₹0'}
                    </div>
                    <div className="stat-label">Total Estimated Cost</div>
                    <div className="stat-delta up">↑ Live from DB</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-icon blue">🛤</div>
                    <div className="stat-value">
                        {loading ? <Skeleton w={60} h={28} /> : `${totalKm.toFixed(1)} km`}
                    </div>
                    <div className="stat-label">Total Cable Length</div>
                    <div className="stat-delta up">↑ {projects.length} projects</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon green">⚡</div>
                    <div className="stat-value">
                        {loading ? <Skeleton w={70} h={28} /> : avgPerKm > 0
                            ? `₹${(avgPerKm / 1000).toFixed(0)}K`
                            : '—'}
                    </div>
                    <div className="stat-label">Avg Cost per km</div>
                    <div className="stat-delta up">↑ India baseline ₹1.2L</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-icon orange">🧬</div>
                    <div className="stat-value">
                        {loading ? <Skeleton w={40} h={28} /> : estimates.length}
                    </div>
                    <div className="stat-label">DNA Records Saved</div>
                    <div className="stat-delta up">All audit-ready</div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
                <Link to="/estimate" className="btn btn-primary">✦ New Estimate</Link>
                <Link to="/projects" className="btn btn-secondary">◈ View Projects</Link>
                <Link to="/analytics" className="btn btn-ghost">◉ Analytics</Link>
                <button className="btn btn-ghost" onClick={fetchAll}
                    style={{ marginLeft: 'auto' }}>⟳ Refresh</button>
            </div>

            {/* ── AI Prediction Insight ── */}
            <div className="card" style={{ marginBottom: 32, background: 'linear-gradient(145deg, var(--bg-elevated) 0%, rgba(30,30,40,1) 100%)', border: '1px solid var(--accent-cyan)' }}>
                <div className="section-header">
                    <span className="section-title" style={{ color: 'var(--accent-cyan)' }}>🧠 AI Prediction Insight</span>
                    <span className="badge badge-blue">Latest Estimate</span>
                </div>

                <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Rule Estimate (Engine)</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                            {loading ? <Skeleton w={120} h={30} /> : `₹${ruleEst.toLocaleString('en-IN')}`}
                        </div>
                    </div>

                    <div style={{ fontSize: '2rem', color: 'var(--text-muted)', opacity: 0.5 }}>VS</div>

                    <div style={{ flex: 1, minWidth: 200, height: 220, marginLeft: 20 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 30, right: 10, left: -20, bottom: 0 }} barSize={54}>
                                <defs>
                                    <linearGradient id="colorRule" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#f0f4ff" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} dy={12} />
                                <YAxis tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<CustomTooltip />} />
                                <Bar dataKey="cost" radius={[8, 8, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? 'url(#colorRule)' : 'url(#colorAI)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div style={{
                        minWidth: 170, padding: '20px', background: 'var(--bg-card)',
                        borderRadius: 12, border: '1px solid var(--border-accent)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: 0, right: 0, width: 70, height: 70,
                            background: confidenceLevel === 'High' ? 'var(--accent-green)' : confidenceLevel === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-red)',
                            opacity: 0.12, borderRadius: '50%', transform: 'translate(20px, -20px)', filter: 'blur(12px)'
                        }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: '0.85rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Difference</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Space Grotesk', fontSize: '1.2rem' }}>{differencePct}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Confidence</span>
                            <span style={{
                                padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem',
                                fontWeight: 800, fontFamily: 'Space Grotesk', letterSpacing: '0.05em',
                                background: confidenceLevel === 'High' ? 'rgba(52, 211, 153, 0.15)' : confidenceLevel === 'Medium' ? 'rgba(251, 146, 60, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                                color: confidenceLevel === 'High' ? 'var(--accent-green)' : confidenceLevel === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-red)'
                            }}>
                                {confidenceLevel.toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Project Locations Map ── */}
            <div className="card" style={{ marginBottom: 32, padding: '24px 28px' }}>
                <div className="section-header" style={{ marginBottom: 20 }}>
                    <span className="section-title">📍 Project Locations</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interactive Field Overview</span>
                </div>
                <ProjectMap projects={projects} estimates={estimates} height={380} />
            </div>

            {/* ── Recent Projects (live) ── */}
            <div className="card" style={{ marginBottom: 32 }}>
                <div className="section-header">
                    <span className="section-title">Recent Projects</span>
                    <Link to="/projects" className="btn btn-ghost" style={{ padding: '7px 16px', fontSize: '0.8rem' }}>
                        View all →
                    </Link>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '12px 0' }}>
                        {[...Array(4)].map((_, i) => <Skeleton key={i} h={18} />)}
                    </div>
                ) : recent.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">◈</div>
                        <div className="empty-state-text">No projects yet</div>
                        <div className="empty-state-sub">
                            <Link to="/estimate" className="btn btn-primary" style={{ marginTop: 12 }}>✦ Create your first estimate</Link>
                        </div>
                    </div>
                ) : (
                    <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, background: 'transparent' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>State</th>
                                    <th>Build</th>
                                    <th>Distance</th>
                                    <th>Area</th>
                                    <th>Complexity</th>
                                    <th>Created By</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map(p => {
                                    const badge = statusBadge(p)
                                    return (
                                        <tr key={p.project_id}>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{p.project_name}</td>
                                            <td><span className="badge badge-blue">{p.state || '—'}</span></td>
                                            <td>
                                                <span className={`badge ${p.build_type === 'overhead' ? 'badge-blue' : 'badge-orange'}`}>
                                                    {p.build_type}
                                                </span>
                                            </td>
                                            <td style={{ fontFamily: 'Space Grotesk', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                                                {p.distance_km ? `${p.distance_km} km` : `${(p.distance_m / 1000).toFixed(1)} km`}
                                            </td>
                                            <td>{p.area_type}</td>
                                            <td>{p.complexity}</td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{p.created_by || '—'}</td>
                                            <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Agent Pipeline ── */}
            <div className="card">
                <div className="section-header">
                    <span className="section-title">🤖 AI Agent Pipeline — 12 Agents</span>
                    <span className={`badge ${backendUp ? 'badge-green' : 'badge-orange'}`}>
                        {backendUp ? '● All Online' : '○ Backend Offline'}
                    </span>
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: 14
                }}>
                    {[
                        { step: 1, name: 'Input Agent', icon: '📥', role: 'Validates & standardizes all user inputs' },
                        { step: 2, name: 'Project Mode Agent', icon: '🗺️', role: 'Detects new vs extension, sets estimation logic' },
                        { step: 3, name: 'Material Agent', icon: '🪛', role: 'Calculates cable, poles, ducts & joint boxes' },
                        { step: 4, name: 'Labor Agent', icon: '👷', role: 'Productivity → work days → labour cost' },
                        { step: 5, name: 'Overhead Agent', icon: '🏗️', role: 'Permission fees, equipment hire & overhead costs' },
                        { step: 6, name: 'Aggregation Agent', icon: '∑', role: 'Sums all cost components → total cost + cost/km' },
                        { step: 7, name: 'Rule Engine Agent', icon: '⚙️', role: 'Applies business rules, multipliers & pricing policies' },
                        { step: 8, name: 'AI Prediction Agent', icon: '🧠', role: 'ML model benchmarks cost & computes confidence', isNew: true },
                        { step: 9, name: 'Validation Agent', icon: '✅', role: 'Validates estimate vs ML model and generates confidence score' },
                        { step: 10, name: 'DNA Agent', icon: '🧬', role: 'Builds full traceable audit document for cost_dna collection' },
                        { step: 11, name: 'Explanation Agent', icon: '📝', role: 'Generates human-readable summary of how cost was calculated' },
                        { step: 12, name: 'Replay Agent', icon: '🔁', role: 'Re-run with modified params to compare scenarios' },
                    ].map(agent => (
                        <div key={agent.step} style={{
                            background: 'var(--bg-elevated)',
                            border: `1px solid ${agent.isNew ? 'var(--accent-cyan)' : backendUp ? 'var(--border)' : 'rgba(251,146,60,0.15)'}`,
                            boxShadow: agent.isNew ? '0 0 12px rgba(6, 182, 212, 0.2)' : 'none',
                            borderRadius: 'var(--radius-md)',
                            padding: '16px 18px',
                            display: 'flex',
                            gap: 14,
                            alignItems: 'flex-start',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-accent)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = agent.isNew ? 'var(--accent-cyan)' : backendUp ? 'var(--border)' : 'rgba(251,146,60,0.15)'}
                        >
                            {/* Step badge */}
                            <div style={{
                                minWidth: 28, height: 28, borderRadius: 8,
                                background: 'var(--gradient-main)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.7rem', fontWeight: 800, color: '#fff',
                                fontFamily: 'Space Grotesk', flexShrink: 0,
                            }}>{agent.step}</div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                    <span style={{ fontSize: '0.87rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {agent.icon} {agent.name}
                                    </span>
                                    <span style={{
                                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                        background: backendUp ? 'var(--accent-green)' : 'var(--accent-orange)',
                                        boxShadow: backendUp ? '0 0 6px var(--accent-green)' : 'none',
                                    }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                    {agent.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{
                    marginTop: 20, padding: '12px 18px',
                    background: 'var(--bg-base)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.78rem', color: 'var(--text-muted)',
                    fontFamily: 'Space Grotesk',
                }}>
                    Pipeline: Input → Mode → Material → Labor → Overhead → Aggregate → Rules → AI Predict → Validate → DNA → Explain → [Replay]
                </div>
            </div>

        </div >
    )
}
