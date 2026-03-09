import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import './ReplayView.css'

export default function ReplayView() {
    const { projectId } = useParams()
    const navigate = useNavigate()

    // State for the existing DNA logic and new Replay overrides
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [originalDna, setOriginalDna] = useState(null)
    const [replayData, setReplayData] = useState(null)
    const [replicating, setReplicating] = useState(false)

    // Override form state
    const [overrides, setOverrides] = useState({
        distance_km: '',
        complexity: '',
        area_type: ''
    })

    useEffect(() => {
        const fetchProjectDNA = async () => {
            try {
                if (!projectId) return;
                const res = await api.getProjectDNA(projectId)
                setOriginalDna(res.data.data)

                // Pre-fill the overrides with the exact existing values
                setOverrides({
                    distance_km: res.data.data.inputs.distance_km || '',
                    complexity: res.data.data.inputs.complexity || 'low',
                    area_type: res.data.data.inputs.area_type || 'urban'
                })
            } catch (err) {
                setError('Failed to load project DNA.')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchProjectDNA()
    }, [projectId])

    const handleRunReplay = async (e) => {
        e.preventDefault()
        setReplicating(true)
        setError('')

        try {
            // Only send non-empty overrides
            const finalOverrides = {}
            if (overrides.distance_km) finalOverrides.distance_km = parseFloat(overrides.distance_km)
            if (overrides.complexity) finalOverrides.complexity = overrides.complexity
            if (overrides.area_type) finalOverrides.area_type = overrides.area_type

            const res = await api.runReplay(projectId, finalOverrides)
            setReplayData(res.data.data)
        } catch (err) {
            setError(err.response?.data?.detail || 'Replay failed to calculate.')
            console.error(err)
        } finally {
            setReplicating(false)
        }
    }

    if (loading) return <div className="page-wrapper fade-up"><p>Loading original estimate...</p></div>

    return (
        <div className="page-wrapper fade-up replay-container">
            <header className="replay-header">
                <button className="btn-secondary" onClick={() => navigate('/projects')}>
                    &larr; Back to Projects
                </button>
                <div className="header-titles">
                    <h1 className="page-title">Replay Analysis</h1>
                    <p className="page-subtitle">Test 'What-If' scenarios against project: {originalDna?.inputs?.project_name}</p>
                </div>
            </header>

            {error && <div className="error-banner">{error}</div>}

            <div className="replay-grid">
                {/* FORM PANEL */}
                <div className="replay-panel override-panel card">
                    <h2>Scenario Setup</h2>
                    <p className="panel-hint">Modify inputs to recalculate cost dynamically.</p>

                    <form onSubmit={handleRunReplay} className="override-form">
                        <div className="form-group">
                            <label>Distance Limit (km)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={overrides.distance_km}
                                onChange={e => setOverrides({ ...overrides, distance_km: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Design Complexity</label>
                            <select
                                value={overrides.complexity}
                                onChange={e => setOverrides({ ...overrides, complexity: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Area Type</label>
                            <select
                                value={overrides.area_type}
                                onChange={e => setOverrides({ ...overrides, area_type: e.target.value })}
                            >
                                <option value="urban">Urban</option>
                                <option value="semi-urban">Semi-Urban</option>
                                <option value="rural">Rural</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-primary run-replay-btn" disabled={replicating}>
                            {replicating ? 'Running Pipeline...' : 'Run New Estimate'}
                        </button>
                    </form>
                </div>

                {/* COMPARISON PANEL */}
                <div className="replay-panel results-panel card">
                    <h2>Cost Comparison</h2>
                    {!replayData ? (
                        <div className="empty-results">
                            <span className="icon">📊</span>
                            <p>Run a new estimate to see real-time comparisons.</p>

                            <div className="original-cost-summary">
                                <h3>Original Total Cost</h3>
                                <div className="big-currency">
                                    ₹{originalDna?.final_cost?.total_cost?.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="comparison-view animated-entry">
                            <div className="metrics-grid">
                                <div className="metric-box box-original">
                                    <span className="metric-label">Original Estimate</span>
                                    <span className="metric-value">₹{replayData.old_dna.final_cost.total_cost.toLocaleString()}</span>
                                    <span className="metric-sub">Distance: {replayData.old_dna.inputs.distance_km} km</span>
                                </div>
                                <div className="metric-separator">→</div>
                                <div className="metric-box box-new">
                                    <span className="metric-label">Replay Estimate</span>
                                    <span className="metric-value">₹{replayData.new_dna.final_cost.total_cost.toLocaleString()}</span>
                                    <span className="metric-sub">Distance: {replayData.new_dna.inputs.distance_km} km</span>
                                </div>
                            </div>

                            <div className="comparison-breakdown">
                                <h3>Cost Breakdown Difference</h3>
                                <table className="diff-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th className="right-align">Original</th>
                                            <th className="right-align">New Replay</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Total Material</td>
                                            <td className="right-align">₹{replayData.old_dna.final_cost.material_cost?.toLocaleString()}</td>
                                            <td className="right-align difference-value">₹{replayData.new_dna.final_cost.material_cost?.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Total Labor</td>
                                            <td className="right-align">₹{replayData.old_dna.final_cost.labor_cost?.toLocaleString()}</td>
                                            <td className="right-align difference-value">₹{replayData.new_dna.final_cost.labor_cost?.toLocaleString()}</td>
                                        </tr>
                                        <tr>
                                            <td>Overheads</td>
                                            <td className="right-align">₹{(replayData.old_dna.final_cost.permission_cost + replayData.old_dna.final_cost.equipment_cost)?.toLocaleString()}</td>
                                            <td className="right-align difference-value">₹{(replayData.new_dna.final_cost.permission_cost + replayData.new_dna.final_cost.equipment_cost)?.toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
