import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import SelectionMap from '../components/SelectionMap'
import { getOSRMRoute } from '../utils/routeUtils'
import { CITY_COORDS } from '../utils/cityCoords'
import './ReplayView.css'

export default function ReplayView() {
    const { projectId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [originalDna, setOriginalDna] = useState(null)
    const [projectInfo, setProjectInfo] = useState(null)
    const [replayData, setReplayData] = useState(null)
    const [replicating, setReplicating] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveSuccess, setSaveSuccess] = useState(false)
    const [showMap, setShowMap] = useState(false)

    // Override form state (Enhanced with Pro features)
    const [overrides, setOverrides] = useState({
        distance_km: '',
        complexity: '',
        area_type: '',
        build_type: '',
        permission_required: false,
        equipment_required: false,
        cable_rate: '',
        pole_rate: '',
        duct_rate: '',
        joint_box_rate: '',
        labor_rate_per_day: '',
        equipment_rate_per_day: '',
        labor_inflation: 0,
        material_inflation: 0
    })
    const [showRates, setShowRates] = useState(false)

    const [altRoutes, setAltRoutes] = useState([])
    const [fetchingAltRoutes, setFetchingAltRoutes] = useState(false)

    // Automatically fetch alternatives if we can parse the location
    useEffect(() => {
        const locationStr = originalDna?.inputs?.location || projectInfo?.location;
        if (!locationStr) return;
        
        let loc = locationStr.toLowerCase();
        let parts = loc.split(/ to |-| - /);
        
        if (parts.length >= 2) {
            let sourceMatch = parts[0].trim();
            let destMatch = parts[1].trim();
            
            let srcEntry = Object.entries(CITY_COORDS).find(([k]) => sourceMatch.includes(k) || k.includes(sourceMatch));
            let dstEntry = Object.entries(CITY_COORDS).find(([k]) => destMatch.includes(k) || k.includes(destMatch));
            
            if (srcEntry && dstEntry) {
                setFetchingAltRoutes(true);
                getOSRMRoute(srcEntry[1], dstEntry[1], true).then(routes => {
                    if (routes && routes.length > 0) {
                        setAltRoutes(routes);
                    }
                    setFetchingAltRoutes(false);
                });
            }
        }
    }, [originalDna, projectInfo]);

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                if (!projectId) return;
                const [dnaRes, projRes] = await Promise.all([
                    api.getProjectDNA(projectId),
                    api.getProject(projectId).catch(() => null)
                ])
                const dna = dnaRes.data.data
                const project = projRes?.data?.data
                setOriginalDna(dna)
                if (project) setProjectInfo(project)

                setOverrides({
                    distance_km: dna.inputs.distance_km || project?.distance_km || '',
                    complexity: dna.inputs.complexity || project?.complexity || 'low',
                    area_type: dna.inputs.area_type || project?.area_type || 'urban',
                    build_type: dna.inputs.build_type || project?.build_type || 'overhead',
                    permission_required: dna.inputs.permission_required ?? project?.permission_required ?? false,
                    equipment_required: dna.inputs.equipment_required ?? project?.equipment_required ?? false,
                    cable_rate: dna.inputs.cable_rate || project?.cable_rate || 45,
                    pole_rate: dna.inputs.pole_rate || project?.pole_rate || 3000,
                    duct_rate: dna.inputs.duct_rate || project?.duct_rate || 500,
                    joint_box_rate: dna.inputs.joint_box_rate || project?.joint_box_rate || 1500,
                    labor_rate_per_day: dna.inputs.labor_rate_per_day || project?.labor_rate_per_day || 1200,
                    equipment_rate_per_day: dna.inputs.equipment_rate_per_day || project?.equipment_rate_per_day || 0,
                    labor_inflation: 0,
                    material_inflation: 0
                })
            } catch (err) {
                setError('Failed to load project simulation data.')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchProjectData()
    }, [projectId])

    const handleRunReplay = async (e) => {
        if (e) e.preventDefault()
        setReplicating(true)
        setError('')

        try {
            const parseNum = (val, d) => (val === '' || val === undefined || val === null) ? d : parseFloat(val);
            const finalOverrides = {
                distance_km: parseNum(overrides.distance_km, 0),
                complexity: overrides.complexity,
                area_type: overrides.area_type,
                build_type: overrides.build_type,
                permission_required: overrides.permission_required,
                equipment_required: overrides.equipment_required,
                cable_rate: parseNum(overrides.cable_rate, 45),
                pole_rate: parseNum(overrides.pole_rate, 3000),
                duct_rate: parseNum(overrides.duct_rate, 500),
                joint_box_rate: parseNum(overrides.joint_box_rate, 1500),
                labor_rate_per_day: parseNum(overrides.labor_rate_per_day, 1200),
                equipment_rate_per_day: parseNum(overrides.equipment_rate_per_day, 0),
                labor_inflation: parseNum(overrides.labor_inflation, 0),
                material_inflation: parseNum(overrides.material_inflation, 0)
            }

            const res = await api.runReplay(projectId, finalOverrides)
            setReplayData(res.data.data)
        } catch (err) {
            setError(err.response?.data?.detail || 'Replay failed to calculate.')
            console.error(err)
        } finally {
            setReplicating(false)
        }
    }

    const handleSaveReplay = async () => {
        if (!projectId || !replayData) return
        setSaving(true)
        setError('')
        try {
            await api.saveReplay(projectId, replayData.new_dna)
            setSaveSuccess(true)
            // Refresh baseline for visual confirmation
            setOriginalDna(replayData.new_dna)
            setTimeout(() => setSaveSuccess(false), 3000)
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save simulated scenario.')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }



    if (loading) return <div className="page-wrapper fade-up"><p>Loading original estimate...</p></div>

    return (
        <div className="page-wrapper fade-up replay-container">
            <header className="replay-header">
                <button className="btn btn-ghost" onClick={() => navigate('/projects')}>
                    &larr; Back to Projects
                </button>
                <div className="header-titles">
                    <h1 className="page-title">What-If Simulation</h1>
                    <p className="page-subtitle">Test scenarios against project: <span style={{color: 'var(--accent-cyan)'}}>{originalDna?.inputs?.project_name}</span></p>
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="replay-grid">
                {/* FORM PANEL */}
                <div className="replay-panel override-panel card">
                    <h2>Simulation Setup</h2>
                    <p className="panel-hint">Tweak parameters to see instant cost impacts.</p>

                    <form onSubmit={handleRunReplay} className="override-form">
                        <div className="form-group">
                            <label>Distance Limit (km)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={overrides.distance_km}
                                onChange={e => setOverrides({ ...overrides, distance_km: e.target.value })}
                            />
                            <button type="button" className="btn btn-ghost map-simulation-trigger" onClick={() => setShowMap(true)}>
                                🗺️ Pick on Simulation Map
                            </button>
                        </div>

                        {/* Alternative Routes automatically extracted */}
                        {fetchingAltRoutes && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', marginBottom: 20, padding: 8, background: 'rgba(56, 189, 248, 0.05)', borderRadius: 6, textAlign: 'center' }}>
                                🔄 Analyzing Alternative Routes...
                            </div>
                        )}
                        {altRoutes.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Quick Route Switch [{altRoutes.length} found]</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                    {altRoutes.map((rt, idx) => {
                                        const isSelected = Math.abs(parseFloat(overrides.distance_km || 0) - rt.distanceKm) < 0.1;
                                        return (
                                        <button 
                                            key={idx} 
                                            type="button"
                                            onClick={() => setOverrides({...overrides, distance_km: rt.distanceKm})}
                                            style={{
                                                padding: '10px 14px', borderRadius: 8, textAlign: 'left',
                                                background: isSelected ? 'rgba(34, 211, 238, 0.1)' : 'var(--bg-elevated)',
                                                border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border)',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                opacity: isSelected ? 1 : 0.7
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.opacity = '0.7' }}
                                        >
                                            <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                                                {idx === 0 ? 'Current Baseline Route' : `Alternative Option ${idx}`}
                                            </span>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                                                    {rt.distanceKm.toFixed(1)} km
                                                </div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1, marginTop: 2 }}>
                                                    {Math.round(rt.durationMin)} mins
                                                </div>
                                            </div>
                                        </button>
                                    )})}
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Complexity</label>
                            <div className="toggle-group" style={{ marginBottom: 12 }}>
                                {['low', 'medium', 'high'].map(c => (
                                    <button key={c} type="button" 
                                        className={`toggle-btn ${overrides.complexity === c ? 'active' : ''}`}
                                        onClick={() => setOverrides({...overrides, complexity: c})}
                                        style={{ 
                                            textTransform: 'capitalize',
                                            borderColor: overrides.complexity === c ? (c === 'high' ? '#f87171' : c === 'medium' ? '#fbbf24' : 'var(--accent-cyan)') : 'var(--border)'
                                        }}>
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Build Type & Area</label>
                            <div className="toggle-group" style={{ marginBottom: 12 }}>
                                <button type="button" className={`toggle-btn ${overrides.build_type === 'overhead' ? 'active' : ''}`}
                                    onClick={() => setOverrides({...overrides, build_type: 'overhead'})}>Overhead</button>
                                <button type="button" className={`toggle-btn ${overrides.build_type === 'underground' ? 'active' : ''}`}
                                    onClick={() => setOverrides({...overrides, build_type: 'underground'})}>Underground</button>
                            </div>
                            <div className="toggle-group flex-wrap">
                                {['urban', 'semi-urban', 'rural'].map(t => (
                                    <button key={t} type="button" 
                                        className={`toggle-btn ${overrides.area_type === t ? 'active' : ''}`}
                                        onClick={() => setOverrides({...overrides, area_type: t})}
                                        style={{ textTransform: 'capitalize' }}>
                                        {t.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Optional Flags</label>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {[
                                    { name: 'permission_required', label: '🏛 Permission', hint: '5% uplift' },
                                    { name: 'equipment_required', label: '🚜 Equipment', hint: 'Daily rate' },
                                ].map(({ name, label, hint }) => (
                                    <div key={name} 
                                        onClick={() => setOverrides({...overrides, [name]: !overrides[name]})}
                                        style={{
                                            flex: 1, minWidth: 120, cursor: 'pointer',
                                            padding: '10px', borderRadius: 10, border: '1px solid var(--border)',
                                            background: overrides[name] ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-elevated)',
                                            borderColor: overrides[name] ? 'var(--accent-cyan)' : 'var(--border)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: overrides[name] ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>{label}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{hint}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <button type="button" className="btn btn-ghost" style={{ width: '100%', fontSize: '0.75rem' }}
                                onClick={() => setShowRates(!showRates)}>
                                {showRates ? '▲ Hide' : '▼ Customise'} Unit Rates (INR)
                            </button>
                            {showRates && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                                    {[
                                        ['cable_rate', 'Cable ₹/m', '45'],
                                        ['pole_rate', 'Pole ₹', '3000'],
                                        ['duct_rate', 'Duct ₹', '500'],
                                        ['joint_box_rate', 'Joint Box ₹', '1500'],
                                        ['labor_rate_per_day', 'Labour ₹/d', '1200'],
                                        ['equipment_rate_per_day', 'Equip ₹/d', '0'],
                                    ].map(([key, lbl, ph]) => (
                                        <div key={key}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 4 }}>{lbl}</div>
                                            <input type="number" step="0.01" className="form-input" style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                                placeholder={ph}
                                                value={overrides[key]} onChange={e => setOverrides({...overrides, [key]: e.target.value})} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary run-replay-btn" disabled={replicating}>
                            {replicating ? 'Processing Scenario...' : 'Execute Simulation'}
                        </button>
                    </form>
                </div>

                {/* COMPARISON PANEL */}
                <div className="replay-panel results-panel card">
                    <h2>Simulated Impact</h2>
                    {!replayData ? (
                        <div className="empty-results">
                            <span className="icon">🚀</span>
                            <p>Adjust the knobs and click "Execute" to start your simulation.</p>

                            <div className="original-cost-summary">
                                <h3>Baseline Reference</h3>
                                <div className="big-currency" style={{fontSize: '2rem'}}>
                                    ₹{originalDna?.final_cost?.total_cost?.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="comparison-view animated-entry">
                            <div className="metrics-grid">
                                <div className="metric-box box-original">
                                    <span className="metric-label">Baseline</span>
                                    <span className="metric-value">₹{replayData.old_dna.final_cost.total_cost.toLocaleString()}</span>
                                    <span className="metric-sub">{replayData.old_dna.inputs.build_type} | {replayData.old_dna.inputs.distance_km} km</span>
                                </div>
                                <div className="metric-separator" style={{color: 'var(--accent-cyan)'}}>→</div>
                                <div className="metric-box box-new">
                                    <span className="metric-label">Simulated</span>
                                    <span className="metric-value" style={{color: 'var(--accent-cyan)'}}>₹{replayData.new_dna.final_cost.total_cost.toLocaleString()}</span>
                                    <span className="metric-sub">{replayData.new_dna.inputs.build_type} | {replayData.new_dna.inputs.distance_km} km</span>
                                </div>
                            </div>

                            <div className="comparison-breakdown">
                                <h3>Scenario Breakdown</h3>
                                <table className="diff-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th className="right-align">Baseline</th>
                                            <th className="right-align">Simulated</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Material Cost</td>
                                            <td className="right-align">₹{replayData.old_dna.final_cost.material_cost?.toLocaleString()}</td>
                                            <td className="right-align difference-value">₹{replayData.new_dna.final_cost.material_cost?.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Labor Cost</td>
                                            <td className="right-align">₹{replayData.old_dna.final_cost.labor_cost?.toLocaleString()}</td>
                                            <td className="right-align difference-value">₹{replayData.new_dna.final_cost.labor_cost?.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Estimate</td>
                                            <td className="right-align">₹{replayData.old_dna.final_cost.total_cost?.toLocaleString()}</td>
                                            <td className="right-align" style={{fontWeight: 800, color: 'var(--accent-cyan)'}}>₹{replayData.new_dna.final_cost.total_cost?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="save-actions" style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                                <button 
                                    className="btn btn-primary" 
                                    style={{ flex: 1, background: saveSuccess ? 'var(--accent-green)' : 'var(--accent-cyan)' }}
                                    onClick={handleSaveReplay}
                                    disabled={saving || saveSuccess}
                                >
                                    {saving ? 'Saving...' : saveSuccess ? '✓ Successfully Updated' : 'Replace Baseline with This Version'}
                                </button>
                                <button className="btn btn-ghost" onClick={() => setReplayData(null)}>
                                    Reset Simulation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Selection Map Modal */}
            {showMap && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, padding: 20, animation: 'fadeIn 0.3s'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: 1000, padding: 24, animation: 'slideUp 0.3s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <h2 style={{ margin: 0 }}>What-If Simulation Map</h2>
                            <button className="btn btn-ghost" onClick={() => setShowMap(false)}>✕</button>
                        </div>
                        <SelectionMap onComplete={(dist) => {
                            setOverrides({ ...overrides, distance_km: dist })
                            setShowMap(false)
                        }} />
                    </div>
                </div>
            )}
        </div>
    )
}
