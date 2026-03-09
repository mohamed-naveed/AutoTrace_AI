import { useState, useRef, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../services/api'

/* ── Static data ─────────────────────────────────────────── */
const INDIA_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli',
    'Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]
const AREA_TYPES = [{ v: 'urban', l: 'Urban', d: 'Metro core, city centres' },
{ v: 'semi-urban', l: 'Semi-Urban', d: 'Tier-2 cities, towns' },
{ v: 'rural', l: 'Rural', d: 'Villages, remote areas' }]
const BUILD_TYPES = [{ v: 'overhead', l: 'Overhead', icon: '🗼', d: 'Poles every 50 m' },
{ v: 'underground', l: 'Underground', icon: '🚇', d: 'Duct every 100 m' }]
const COMPLEXITY = [{ v: 'low', l: 'Low', color: '#34d399' },
{ v: 'medium', l: 'Medium', color: '#fb923c' },
{ v: 'high', l: 'High', color: '#f87171' }]
const PROJECT_TYPES = [{ v: 'new', l: 'New', icon: '🏗️', d: 'Full infrastructure' },
{ v: 'extension', l: 'Extension', icon: '🔌', d: 'Incremental cost only' }]
const PRIORITIES = ['low', 'medium', 'high']

const AGENTS = [
    { name: 'Input Agent', icon: '📥' },
    { name: 'Project Mode', icon: '🗺️' },
    { name: 'Material Agent', icon: '🪛' },
    { name: 'Labor Agent', icon: '👷' },
    { name: 'Rule Engine', icon: '⚙️' },
    { name: 'Overhead Agent', icon: '🏗️' },
    { name: 'Aggregation', icon: '∑' },
    { name: 'Validation', icon: '✅' },
    { name: 'DNA Agent', icon: '🧬' },
    { name: 'Explanation', icon: '📝' },
]

const defaultForm = {
    project_name: '', project_type: 'new', state: 'Tamil Nadu', location: '',
    area_type: 'urban', build_type: 'overhead', distance_km: '', complexity: 'low',
    permission_required: false, equipment_required: false,
    created_by: '', priority: 'medium',
    cable_rate: '45', pole_rate: '3000', duct_rate: '500',
    joint_box_rate: '1500', labor_rate_per_day: '1200', equipment_rate_per_day: '0',
}

/* ── Sub-components ─────────────────────────────────────── */
const Chip = ({ label, active, onClick, sub = null, icon = null, color = null }) => (
    <button type="button" onClick={onClick} style={{
        padding: sub ? '10px 16px' : '8px 18px',
        borderRadius: 99, cursor: 'pointer', textAlign: 'left',
        border: `1.5px solid ${active ? (color || 'var(--accent-blue)') : 'var(--border)'}`,
        background: active
            ? color ? `${color}18` : 'rgba(99,102,241,0.15)'
            : 'transparent',
        color: active ? (color || 'var(--accent-cyan)') : 'var(--text-muted)',
        fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.18s',
        display: 'flex', flexDirection: 'column', gap: 2,
    }}>
        <span>{icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}</span>
        {sub && <span style={{ fontSize: '0.7rem', opacity: 0.7, fontWeight: 400 }}>{sub}</span>}
    </button>
)

const StepDot = ({ n, current, done }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem',
            fontWeight: 700, fontFamily: 'Space Grotesk',
            background: done ? 'var(--accent-green)'
                : current ? 'var(--gradient-main)' : 'var(--bg-elevated)',
            color: (done || current) ? '#fff' : 'var(--text-muted)',
            border: `2px solid ${done ? 'var(--accent-green)' : current ? 'transparent' : 'var(--border)'}`,
            boxShadow: current ? 'var(--shadow-glow)' : 'none',
            transition: 'all 0.3s',
        }}>
            {done ? '✓' : n}
        </div>
    </div>
)

const FieldLabel = ({ children, hint }) => (
    <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {children}
        </div>
        {hint && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{hint}</div>}
    </div>
)

/* Animated counter */
function useCounter(target, duration = 1200) {
    const [val, setVal] = useState(0)
    useEffect(() => {
        if (!target) return
        let start = 0; const step = target / (duration / 16)
        const t = setInterval(() => {
            start += step
            if (start >= target) { setVal(target); clearInterval(t) } else setVal(Math.floor(start))
        }, 16)
        return () => clearInterval(t)
    }, [target, duration])
    return val
}

/* Custom donut tooltip */
const DonutTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{payload[0].name}</div>
            <div style={{ color: payload[0].payload.color, fontWeight: 700 }}>₹{Number(payload[0].value).toLocaleString('en-IN')}</div>
        </div>
    )
}

/* ── Main Component ─────────────────────────────────────── */
export default function NewEstimate() {
    const [form, setForm] = useState(defaultForm)
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [showRates, setShowRates] = useState(false)
    const [agentsDone, setAgentsDone] = useState(0)
    const [animating, setAnimating] = useState(false)

    const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(null) }
    const onChange = e => {
        const { name, value, type, checked } = e.target
        set(name, type === 'checkbox' ? checked : value)
    }
    const inr = v => `₹${Number(v ?? 0).toLocaleString('en-IN')}`

    // Animated counter for total cost
    const totalCounter = useCounter(result ? Math.round(result.final_cost?.total_cost ?? 0) : 0)

    // Simulate agents ticking while loading
    useEffect(() => {
        if (!loading) { setAgentsDone(0); return }
        setAgentsDone(0)
        let i = 0
        const t = setInterval(() => {
            i++; setAgentsDone(i)
            if (i >= AGENTS.length) clearInterval(t)
        }, 220)
        return () => clearInterval(t)
    }, [loading])

    const handleSubmit = async e => {
        e.preventDefault()
        if (!form.distance_km || parseFloat(form.distance_km) <= 0) {
            setError('Please enter a valid distance greater than 0 km.'); return
        }
        setLoading(true); setResult(null); setError(null); setAnimating(true)
        try {
            const payload = {
                project_name: form.project_name, project_type: form.project_type,
                state: form.state, location: form.location,
                area_type: form.area_type, build_type: form.build_type,
                distance_km: parseFloat(form.distance_km), complexity: form.complexity,
                permission_required: form.permission_required, equipment_required: form.equipment_required,
                created_by: form.created_by || 'System', priority: form.priority,
                cable_rate: parseFloat(form.cable_rate), pole_rate: parseFloat(form.pole_rate),
                duct_rate: parseFloat(form.duct_rate), joint_box_rate: parseFloat(form.joint_box_rate),
                labor_rate_per_day: parseFloat(form.labor_rate_per_day),
                equipment_rate_per_day: parseFloat(form.equipment_rate_per_day),
            }
            const { data } = await api.createEstimate(payload)
            setResult(data.data)
        } catch (err) {
            setError(err.response?.data?.detail || 'Cannot connect to backend (port 8000). Is it running?')
        } finally {
            setLoading(false); setTimeout(() => setAnimating(false), 400)
        }
    }

    const confidence = result?.validation_result?.confidence
    const confColor = c => c === 'High' ? 'var(--accent-green)' : c === 'Medium' ? 'var(--accent-orange)' : 'var(--accent-red)'
    const costs = result?.final_cost ?? {}
    const donutData = result ? [
        { name: 'Material', value: Math.max(0, costs.material_cost ?? 0), color: '#6366f1' },
        { name: 'Labour', value: Math.max(0, costs.labor_cost ?? 0), color: '#38bdf8' },
        { name: 'Permission', value: Math.max(0, costs.permission_cost ?? 0), color: '#34d399' },
        { name: 'Equipment', value: Math.max(0, costs.equipment_cost ?? 0), color: '#fb923c' },
    ].filter(d => d.value > 0) : []

    /* ============================================================
       STEPS
    ============================================================ */
    const STEPS = [
        { n: 1, label: 'Project Info' },
        { n: 2, label: 'Technical Setup' },
        { n: 3, label: 'Flags & Rates' },
    ]

    const canNext1 = form.project_name.trim().length > 0 && form.state
    const canNext2 = parseFloat(form.distance_km) > 0

    return (
        <div className="page-wrapper fade-up" style={{ maxWidth: 1400 }}>

            {/* ── Page Header ── */}
            <div style={{ marginBottom: 32 }}>
                <h1 className="page-title">New Estimate</h1>
                <p className="page-subtitle">🇮🇳 India FTTP · AI multi-agent pipeline · Zero manual calculation</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: result ? '560px 1fr' : '680px', gap: 36, alignItems: 'start' }}>

                {/* ══════════════════════════════════════════
            LEFT — FORM
        ══════════════════════════════════════════ */}
                <div>

                    {/* Step Progress */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 0,
                        marginBottom: 28, padding: '16px 24px',
                        background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                    }}>
                        {STEPS.map((s, i) => (
                            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: s.n < step ? 'pointer' : 'default' }}
                                    onClick={() => s.n < step && setStep(s.n)}>
                                    <StepDot n={s.n} current={step === s.n} done={step > s.n} />
                                    <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            Step {s.n}
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem', fontWeight: 700,
                                            color: step === s.n ? 'var(--text-primary)' : step > s.n ? 'var(--accent-green)' : 'var(--text-muted)'
                                        }}>{s.label}</div>
                                    </div>
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        flex: 1, height: 2, margin: '0 16px',
                                        background: step > s.n
                                            ? 'var(--accent-green)'
                                            : 'var(--border)',
                                        borderRadius: 99, transition: 'background 0.4s'
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Form Card */}
                    <div className="card" style={{ padding: '32px 36px' }}>

                        {error && (
                            <div className="error-banner" style={{ marginBottom: 24 }}>⚠ {error}</div>
                        )}

                        <form onSubmit={handleSubmit}>

                            {/* ── STEP 1: Project Info ── */}
                            {step === 1 && (
                                <div className="fade-up">
                                    <div style={{ marginBottom: 28 }}>
                                        <div className="form-group">
                                            <FieldLabel hint="A descriptive name for this FTTP deployment">Project Name</FieldLabel>
                                            <input id="project_name" name="project_name" className="form-input"
                                                placeholder="e.g. Mumbai Suburban FTTP Grid Phase 2"
                                                value={form.project_name} onChange={onChange} autoFocus />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                                            <div className="form-group">
                                                <FieldLabel>Created By</FieldLabel>
                                                <input id="created_by" name="created_by" className="form-input"
                                                    placeholder="Engineer name" value={form.created_by} onChange={onChange} />
                                            </div>
                                            <div className="form-group">
                                                <FieldLabel>Priority</FieldLabel>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                                                    {PRIORITIES.map(p => (
                                                        <Chip key={p} label={p} active={form.priority === p}
                                                            onClick={() => set('priority', p)} />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                                            <div className="form-group">
                                                <FieldLabel hint="Indian state or union territory">State / UT</FieldLabel>
                                                <select id="state" name="state" className="form-select"
                                                    value={form.state} onChange={onChange}>
                                                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <FieldLabel hint="City, district, zone, or area">City / Location</FieldLabel>
                                                <input id="location" name="location" className="form-input"
                                                    placeholder="e.g. Powai, Whitefield, GIFT City"
                                                    value={form.location} onChange={onChange} />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <FieldLabel>Project Type</FieldLabel>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                {PROJECT_TYPES.map(t => (
                                                    <Chip key={t.v} label={t.l} icon={t.icon} sub={t.d}
                                                        active={form.project_type === t.v}
                                                        onClick={() => set('project_type', t.v)} />
                                                ))}
                                            </div>

                                            {/* Context-aware banner */}
                                            {form.project_type === 'extension' ? (
                                                <div style={{
                                                    marginTop: 14, padding: '14px 18px',
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'rgba(56,189,248,0.07)',
                                                    border: '1px solid rgba(56,189,248,0.25)',
                                                }}>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 8 }}>
                                                        🔌 Extension Mode — What the system does:
                                                    </div>
                                                    <ul style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.85, paddingLeft: 18, margin: 0 }}>
                                                        <li>FTTP is already installed at your premises (ONU, indoor wiring &amp; splice box exist)</li>
                                                        <li><strong style={{ color: 'var(--accent-green)' }}>Material cost −30%</strong> — existing infrastructure not re-provisioned</li>
                                                        <li><strong style={{ color: 'var(--accent-green)' }}>Labour −40%</strong> — extension factor ×0.6 applied (Rule 11), faster work</li>
                                                        <li>Underground civil uplift (×1.30) is <strong style={{ color: 'var(--accent-green)' }}>waived</strong> — existing duct reused</li>
                                                        <li>Enter only the <strong style={{ color: 'var(--accent-cyan)' }}>new cable run distance</strong> needed</li>
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    marginTop: 12, padding: '10px 16px',
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'rgba(99,102,241,0.07)',
                                                    border: '1px solid rgba(99,102,241,0.18)',
                                                    fontSize: '0.78rem', color: 'var(--text-muted)',
                                                }}>
                                                    🏗️ <strong style={{ color: 'var(--text-secondary)' }}>New Deployment</strong> — Full infrastructure cost: cables, poles/ducts, splicing &amp; labour from scratch.
                                                    Underground deployments include ×1.30 civil works uplift.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button type="button" className="btn btn-primary"
                                        style={{ width: '100%', justifyContent: 'center', padding: 14 }}
                                        disabled={!canNext1}
                                        onClick={() => canNext1 && setStep(2)}>
                                        Continue → Technical Setup
                                    </button>
                                </div>
                            )}

                            {/* ── STEP 2: Technical Setup ── */}
                            {step === 2 && (
                                <div className="fade-up">
                                    <div style={{ marginBottom: 28 }}>

                                        <div className="form-group">
                                            <FieldLabel hint="Rule 1: internally converted to metres for all calculations">
                                                Route Distance (km)
                                            </FieldLabel>
                                            <input id="distance_km" name="distance_km" className="form-input"
                                                type="number" min="0.01" step="0.01" placeholder="e.g. 5.2"
                                                value={form.distance_km} onChange={onChange} autoFocus
                                                style={{ fontSize: '1.4rem', fontFamily: 'Space Grotesk', fontWeight: 700, padding: '16px 20px' }} />
                                            {form.distance_km > 0 && (
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 6 }}>
                                                    = {(parseFloat(form.distance_km) * 1000).toLocaleString('en-IN')} metres internally
                                                </div>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <FieldLabel hint="Overhead = pole every 50 m · Underground = duct every 100 m">
                                                Build Type
                                            </FieldLabel>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                {BUILD_TYPES.map(t => (
                                                    <Chip key={t.v} label={t.l} icon={t.icon} sub={t.d}
                                                        active={form.build_type === t.v}
                                                        onClick={() => set('build_type', t.v)} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <FieldLabel hint="Affects labour productivity multiplier">Area Type</FieldLabel>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                {AREA_TYPES.map(t => (
                                                    <Chip key={t.v} label={t.l} sub={t.d}
                                                        active={form.area_type === t.v}
                                                        onClick={() => set('area_type', t.v)} />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <FieldLabel hint="Low=1.0× · Medium=1.2× · High=1.5× labour multiplier">
                                                Complexity
                                            </FieldLabel>
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                {COMPLEXITY.map(c => (
                                                    <Chip key={c.v} label={c.l} active={form.complexity === c.v}
                                                        color={c.color} onClick={() => set('complexity', c.v)} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button type="button" className="btn btn-ghost"
                                            style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => setStep(1)}>← Back</button>
                                        <button type="button" className="btn btn-primary"
                                            style={{ flex: 2, justifyContent: 'center', padding: 14 }}
                                            disabled={!canNext2}
                                            onClick={() => canNext2 && setStep(3)}>
                                            Continue → Flags &amp; Rates
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 3: Flags & Rates ── */}
                            {step === 3 && (
                                <div className="fade-up">

                                    {/* Summary */}
                                    <div style={{
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)', padding: '16px 20px', marginBottom: 24,
                                        display: 'flex', gap: 24, flexWrap: 'wrap'
                                    }}>
                                        {[
                                            ['Project', form.project_name || '—'],
                                            ['Location', `${form.location ? form.location + ', ' : ''}${form.state}`],
                                            ['Distance', `${form.distance_km} km`],
                                            ['Build', form.build_type],
                                            ['Mode', form.project_type],
                                        ].map(([k, v]) => (
                                            <div key={k}>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</div>
                                                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'Space Grotesk' }}>{v}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Flags */}
                                    <div className="form-group">
                                        <FieldLabel>Optional Flags</FieldLabel>
                                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                            {[
                                                { name: 'permission_required', label: '🏛 Permission Required', hint: '5% of material+labour' },
                                                { name: 'equipment_required', label: '🚜 Equipment Required', hint: 'Equipment rate × days' },
                                            ].map(({ name, label, hint }) => (
                                                <label key={name} style={{
                                                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                                                    padding: '12px 18px', borderRadius: 'var(--radius-md)',
                                                    border: `1.5px solid ${form[name] ? 'var(--accent-blue)' : 'var(--border)'}`,
                                                    background: form[name] ? 'rgba(99,102,241,0.1)' : 'var(--bg-elevated)',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    <input type="checkbox" name={name} id={name}
                                                        checked={form[name]} onChange={onChange}
                                                        style={{ width: 16, height: 16, accentColor: 'var(--accent-blue)', cursor: 'pointer' }} />
                                                    <div>
                                                        <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hint}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Rate overrides */}
                                    <div style={{ marginBottom: 24 }}>
                                        <button type="button" className="btn btn-ghost"
                                            style={{ marginBottom: 16, fontSize: '0.8rem', padding: '8px 16px' }}
                                            onClick={() => setShowRates(r => !r)}>
                                            {showRates ? '▲ Hide' : '▼ Customise'} Unit Rates (INR)
                                        </button>

                                        {showRates && (
                                            <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                                                {[
                                                    ['cable_rate', 'Cable ₹/m', '45'],
                                                    ['pole_rate', 'Pole ₹/each', '3000'],
                                                    ['duct_rate', 'Duct section ₹', '500'],
                                                    ['joint_box_rate', 'Joint box ₹', '1500'],
                                                    ['labor_rate_per_day', 'Labour ₹/day', '1200'],
                                                    ['equipment_rate_per_day', 'Equipment ₹/day', '0'],
                                                ].map(([key, lbl, ph]) => (
                                                    <div className="form-group" key={key}>
                                                        <FieldLabel>{lbl}</FieldLabel>
                                                        <input id={key} name={key} className="form-input"
                                                            type="number" min="0" step="0.01" placeholder={ph}
                                                            value={form[key]} onChange={onChange} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="divider" />

                                    <div style={{ display: 'flex', gap: 12 }}>
                                        <button type="button" className="btn btn-ghost"
                                            style={{ flex: 1, justifyContent: 'center' }}
                                            onClick={() => setStep(2)}>← Back</button>
                                        <button id="submit-estimate" type="submit" className="btn btn-primary"
                                            disabled={loading}
                                            style={{ flex: 3, justifyContent: 'center', padding: 14, fontSize: '1rem' }}>
                                            {loading
                                                ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Running Pipeline…</>
                                                : '✦ Generate Cost DNA'}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </form>
                    </div>

                    {/* Agent Pipeline execution log (visible only while loading) */}
                    {(loading || (result && agentsDone === AGENTS.length)) && (
                        <div className="card fade-up" style={{ marginTop: 20, padding: '20px 24px' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                🤖 Pipeline Execution
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {AGENTS.map((a, i) => {
                                    const done = i < agentsDone
                                    const running = i === agentsDone && loading
                                    return (
                                        <div key={a.name} style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            padding: '5px 12px', borderRadius: 99,
                                            background: done ? 'rgba(52,211,153,0.12)'
                                                : running ? 'rgba(99,102,241,0.15)'
                                                    : 'var(--bg-elevated)',
                                            border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : running ? 'var(--accent-blue)' : 'var(--border)'}`,
                                            fontSize: '0.75rem', fontWeight: 600,
                                            color: done ? 'var(--accent-green)' : running ? 'var(--accent-cyan)' : 'var(--text-muted)',
                                            transition: 'all 0.25s',
                                        }}>
                                            {running && <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, marginRight: 2 }} />}
                                            {a.icon} {a.name}
                                            {done && ' ✓'}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ══════════════════════════════════════════
            RIGHT — RESULTS
        ══════════════════════════════════════════ */}
                {result && (
                    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                        {/* ── Total Cost Hero ── */}
                        <div className="card" style={{
                            textAlign: 'center', padding: '36px 28px',
                            background: 'linear-gradient(145deg, rgba(99,102,241,0.1) 0%, rgba(56,189,248,0.06) 100%)',
                            position: 'relative', overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%',
                                background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent)', pointerEvents: 'none'
                            }} />
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                                Total Estimated Cost
                            </div>
                            <div style={{
                                fontFamily: 'Space Grotesk', fontSize: '3rem', fontWeight: 800,
                                background: 'var(--gradient-main)', WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1
                            }}>
                                ₹{totalCounter.toLocaleString('en-IN')}
                            </div>
                            <div style={{ marginTop: 8, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                ₹{Math.round(costs.cost_per_km ?? 0).toLocaleString('en-IN')} per km
                            </div>

                            {/* Confidence pill */}
                            <div style={{
                                marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 10,
                                padding: '8px 20px', borderRadius: 99,
                                background: result.validation_result?.requires_manual_review ? 'rgba(239,68,68,0.1)' : `${confColor(confidence)}18`,
                                border: `1.5px solid ${result.validation_result?.requires_manual_review ? 'rgba(239,68,68,0.4)' : `${confColor(confidence)}44`}`
                            }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: result.validation_result?.requires_manual_review ? 'var(--accent-red)' : confColor(confidence),
                                    boxShadow: `0 0 8px ${result.validation_result?.requires_manual_review ? 'var(--accent-red)' : confColor(confidence)}`,
                                    display: 'inline-block'
                                }} />
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: result.validation_result?.requires_manual_review ? 'var(--accent-red)' : confColor(confidence) }}>
                                    {result.validation_result?.confidence_score ? `${result.validation_result.confidence_score}% Confidence` : `${confidence} Confidence`}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    {result.validation_result?.requires_manual_review ? '⚠️ Manual Review Recommended' : `${result.validation_result?.deviation_percentage?.toFixed(1)}% deviation`}
                                </span>
                            </div>

                            {/* Location tag */}
                            <div style={{ marginTop: 14, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                📍 {form.location ? `${form.location}, ` : ''}{form.state} · {form.distance_km} km · {form.build_type} · {form.area_type}
                            </div>
                        </div>

                        {/* ── Donut + Breakdown ── */}
                        <div className="card" style={{ padding: '24px 28px' }}>
                            <div className="section-header" style={{ marginBottom: 20 }}>
                                <span className="section-title">Cost Breakdown</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'center' }}>
                                {/* Donut */}
                                <div style={{ position: 'relative' }}>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie data={donutData} cx="50%" cy="50%"
                                                innerRadius={54} outerRadius={80}
                                                dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                                                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                            </Pie>
                                            <Tooltip content={<DonutTip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Bars */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    {[
                                        { label: 'Material', val: costs.material_cost, color: '#6366f1' },
                                        { label: 'Labour', val: costs.labor_cost, color: '#38bdf8' },
                                        { label: 'Permission', val: costs.permission_cost, color: '#34d399' },
                                        { label: 'Equipment', val: costs.equipment_cost, color: '#fb923c' },
                                    ].map(item => {
                                        const pct = costs.total_cost > 0 ? (item.val / costs.total_cost) * 100 : 0
                                        return (
                                            <div key={item.label}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
                                                        {item.label}
                                                    </span>
                                                    <span style={{ fontSize: '0.82rem', fontFamily: 'Space Grotesk', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {inr(item.val)}
                                                    </span>
                                                </div>
                                                <div style={{ height: 5, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${pct}%`, height: '100%', borderRadius: 99,
                                                        background: item.color,
                                                        boxShadow: `0 0 8px ${item.color}66`,
                                                        transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                    }} />
                                                </div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>{pct.toFixed(1)}% of total</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Derived Materials ── */}
                        <div className="card" style={{ padding: '24px 28px' }}>
                            <div className="section-header" style={{ marginBottom: 16 }}>
                                <span className="section-title">🪛 Material Quantities</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
                                {Object.entries(result.derived_materials ?? {}).map(([k, v]) => (
                                    <div key={k} style={{
                                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-md)', padding: '14px 16px', textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.35rem', fontFamily: 'Space Grotesk', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                                            {typeof v === 'number' ? v.toFixed(1) : v}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: 4 }}>
                                            {k.replace(/_/g, ' ')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Labour & Multipliers ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {[
                                { title: '👷 Labour', data: result.labor_calculation ?? {} },
                                { title: '✖ Multipliers', data: result.multipliers_applied ?? {} },
                            ].map(({ title, data }) => (
                                <div key={title} className="card" style={{ padding: '20px 24px' }}>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>{title}</div>
                                    {Object.entries(data).map(([k, v]) => (
                                        <div key={k} style={{
                                            display: 'flex', justifyContent: 'space-between', padding: '7px 0',
                                            borderBottom: '1px solid var(--border)', fontSize: '0.82rem'
                                        }}>
                                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'Space Grotesk' }}>
                                                {typeof v === 'number' ? v.toFixed(3) : v}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* ── Validation ── */}
                        <div className="card" style={{
                            padding: '24px 28px',
                            border: `1px solid ${result.validation_result?.requires_manual_review ? 'rgba(239,68,68,0.4)' : `${confColor(confidence)}33`}`
                        }}>
                            <div className="section-header" style={{ marginBottom: 16 }}>
                                <span className="section-title">Validation</span>
                                <span style={{ fontSize: '0.8rem', color: result.validation_result?.requires_manual_review ? 'var(--accent-red)' : confColor(confidence), fontWeight: 700 }}>
                                    {result.validation_result?.requires_manual_review ? 'Guardrails Failed / High Variance' : 'vs ₹1,20,000/km India baseline'}
                                </span>
                            </div>
                            {result.validation_result?.flags?.length > 0
                                ? result.validation_result.flags.map((f, i) => (
                                    <div key={i} className="error-banner" style={{ marginBottom: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.3)' }}>⚠ {f}</div>
                                ))
                                : <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--accent-green)', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <span style={{ fontSize: '1.4rem' }}>✓</span>
                                    Within India FTTP baseline — estimate looks realistic
                                </div>
                            }
                        </div>

                        {/* ── Agent Audit Log ── */}
                        {result.validation_result?.rationale_log && result.validation_result.rationale_log.length > 0 && (
                            <div className="card" style={{ padding: '24px 28px' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>🔍 Agent Audit Rationale</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {result.validation_result.rationale_log.map((log, idx) => (
                                        <div key={idx} style={{ background: 'var(--bg-elevated)', padding: '14px 18px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-blue)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: 4 }}>{log.agent}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{log.reasoning || 'No reasoning details provided.'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Explanation ── */}
                        {result.explanation && (
                            <div className="card" style={{ padding: '24px 28px' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>📝 AI Explanation</div>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                                    {result.explanation}
                                </p>
                            </div>
                        )}

                        {/* ── Actions ── */}
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => { setResult(null); setStep(1) }}>
                                ← New Estimate
                            </button>
                            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => { navigator.clipboard.writeText(JSON.stringify(result, null, 2)) }}>
                                📋 Copy DNA JSON
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    )
}
