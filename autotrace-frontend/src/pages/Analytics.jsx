import { useEffect, useState, useCallback } from 'react'
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import api from '../services/api'

const COLORS = ['#6366f1', '#38bdf8', '#34d399', '#fb923c', '#a78bfa', '#64748b', '#f43f5e', '#facc15']

const Skeleton = ({ w = '100%', h = 220 }) => (
    <div style={{
        width: w, height: h, borderRadius: 10,
        background: 'linear-gradient(90deg, var(--bg-elevated) 25%, var(--border) 50%, var(--bg-elevated) 75%)',
        backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
    }} />
)

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 18px', fontSize: '0.82rem'
        }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color || 'var(--accent-cyan)', fontWeight: 700 }}>
                    {p.name === 'cost' ? `₹${Number(p.value).toLocaleString('en-IN')}` : `${p.value}`}
                </div>
            ))}
        </div>
    )
}

export default function Analytics() {
    const [projects, setProjects] = useState([])
    const [estimates, setEstimates] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchAll = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const [projRes, estRes] = await Promise.all([
                api.getProjects(),
                api.getEstimates(),
            ])
            setProjects(projRes.data.data || [])
            setEstimates(estRes.data.data || [])
        } catch {
            setError('Could not reach backend.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchAll() }, [fetchAll])

    // ── Derived chart data ───────────────────────────────────
    // 1. Monthly cost trend (group by month from created_at)
    const monthlyMap = {}
    estimates.forEach(e => {
        if (!e.created_at) return
        const d = new Date(e.created_at)
        const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' })
        monthlyMap[key] = (monthlyMap[key] || 0) + (e.total_cost || 0)
    })
    const monthlyCosts = Object.entries(monthlyMap)
        .map(([month, cost]) => ({ month, cost }))
        .slice(-6)

    // 2. State distribution from projects
    const stateMap = {}
    projects.forEach(p => {
        const s = p.state || p.district || 'Unknown'
        stateMap[s] = (stateMap[s] || 0) + 1
    })
    const stateData = Object.entries(stateMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([name, value], i) => ({ name, value, color: COLORS[i] }))

    // 3. Confidence distribution
    const confMap = { 'High': 0, 'Medium': 0, 'Low': 0 }
    estimates.forEach(e => { if (e.confidence_level) confMap[e.confidence_level]++ })
    const confidenceData = Object.entries(confMap).map(([range, count]) => ({ range, count }))

    // 4. Cost per km by area type
    const areaMap = {}
    estimates.forEach(e => {
        const proj = projects.find(p => p.project_id === e.project_id)
        const area = proj?.area_type || 'unknown'
        if (!areaMap[area]) areaMap[area] = { total: 0, count: 0 }
        areaMap[area].total += (e.cost_per_km || 0)
        areaMap[area].count += 1
    })
    const areaTypeData = Object.entries(areaMap).map(([area, { total, count }]) => ({
        area, cost: Math.round(count > 0 ? total / count : 0)
    }))

    // KPIs
    const totalCost = estimates.reduce((s, e) => s + (e.total_cost || 0), 0)
    const avgAccuracy = estimates.length > 0
        ? estimates.filter(e => e.confidence_level === 'High').length / estimates.length * 100
        : 0
    const avgPerKm = estimates.length > 0
        ? estimates.reduce((s, e) => s + (e.cost_per_km || 0), 0) / estimates.length
        : 0
    const uniqueStates = new Set(projects.map(p => p.state || p.district)).size

    return (
        <div className="page-wrapper fade-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">🇮🇳 India FTTP · Live data from MongoDB · {estimates.length} estimates</p>
                </div>
                <button className="btn btn-ghost" onClick={fetchAll}>⟳ Refresh</button>
            </div>

            {error && <div className="error-banner" style={{ marginBottom: 24 }}>⚠ {error}</div>}

            {/* KPIs */}
            <div className="stats-grid" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Total Pipeline Value', value: totalCost > 0 ? `₹${(totalCost / 1_00_00_000).toFixed(2)} Cr` : '₹0', color: 'cyan' },
                    { label: 'High Confidence Rate', value: `${avgAccuracy.toFixed(0)}%`, color: 'green' },
                    { label: 'Avg Cost / km', value: avgPerKm > 0 ? `₹${Math.round(avgPerKm).toLocaleString('en-IN')}` : '—', color: 'blue' },
                    { label: 'States Covered', value: uniqueStates || 0, color: 'orange' },
                ].map(s => (
                    <div key={s.label} className={`stat-card ${s.color}`}>
                        <div className="stat-value">{loading ? '…' : s.value}</div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-delta up">↑ Live DB</div>
                    </div>
                ))}
            </div>

            {/* Monthly cost trend */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="section-header">
                    <span className="section-title">Monthly Cost Volume</span>
                    <span className="badge badge-blue">INR · ₹ · Live</span>
                </div>
                {loading ? <Skeleton /> : monthlyCosts.length === 0 ? (
                    <div className="empty-state" style={{ height: 220 }}>
                        <div className="empty-state-icon">📊</div>
                        <div className="empty-state-text">No data yet</div>
                        <div className="empty-state-sub">Submit your first estimate to see the chart</div>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={monthlyCosts} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="gradCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
                            <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false}
                                tickFormatter={v => `₹${(v / 1_00_000).toFixed(0)}L`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="cost" name="cost" stroke="#6366f1" strokeWidth={2.5}
                                fill="url(#gradCost)" dot={{ fill: '#6366f1', r: 4 }}
                                activeDot={{ r: 6, stroke: '#38bdf8', strokeWidth: 2 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

                {/* State Distribution */}
                <div className="card">
                    <div className="section-header"><span className="section-title">🇮🇳 State Distribution</span></div>
                    {loading ? <Skeleton h={220} /> : stateData.length === 0 ? (
                        <div className="empty-state" style={{ height: 220 }}>
                            <div className="empty-state-icon">◈</div>
                            <div className="empty-state-text">No data yet</div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={stateData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                                    dataKey="value" paddingAngle={3}>
                                    {stateData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={v => `${v} projects`}
                                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10 }} />
                                <Legend iconType="circle" iconSize={8}
                                    formatter={v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Confidence Distribution */}
                <div className="card">
                    <div className="section-header"><span className="section-title">Confidence Distribution</span></div>
                    {loading ? <Skeleton h={220} /> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={confidenceData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.08)" />
                                <XAxis dataKey="range" stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10 }} />
                                <Bar dataKey="count" name="Estimates" radius={[6, 6, 0, 0]}>
                                    {confidenceData.map((_, i) => (
                                        <Cell key={i} fill={['#34d399', '#38bdf8', '#fb923c'][i]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Cost per km by area type */}
            {areaTypeData.length > 0 && (
                <div className="card">
                    <div className="section-header">
                        <span className="section-title">Avg Cost/km by Area Type — Live</span>
                        <span className="badge badge-green">vs ₹1,20,000 India baseline</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${areaTypeData.length}, 1fr)`, gap: 16 }}>
                        {areaTypeData.map(a => (
                            <div key={a.area} className="result-item">
                                <div className="result-item-label" style={{ textTransform: 'capitalize' }}>{a.area}</div>
                                <div className="result-item-value" style={{ fontSize: '1.3rem' }}>
                                    ₹{a.cost.toLocaleString('en-IN')}
                                </div>
                                <div style={{ marginTop: 10, height: 4, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${Math.min((a.cost / 1_50_000) * 100, 100)}%`,
                                        height: '100%', borderRadius: 99, background: 'var(--gradient-main)'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    )
}
