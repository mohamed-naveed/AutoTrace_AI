import { useState, useEffect, useRef } from 'react'

export default function LocationSearch({ onSelect }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowResults(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (query.length < 3) {
            setResults([])
            return
        }

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true)
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=in&limit=5`)
                const data = await response.json()
                setResults(data)
                setShowResults(true)
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [query])

    const handleSelect = (r) => {
        onSelect([parseFloat(r.lat), parseFloat(r.lon)], r.display_name)
        setQuery('')
        setShowResults(false)
    }

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder="🔍 Search city or location in India..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 3 && setShowResults(true)}
                    style={{
                        paddingRight: 40,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border-accent)',
                        borderRadius: 10,
                        fontSize: '0.85rem'
                    }}
                />
                {loading && (
                    <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
                    </div>
                )}
            </div>

            {showResults && results.length > 0 && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)',
                    borderRadius: 10, marginTop: 6, zIndex: 2000, overflow: 'hidden',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)', animation: 'fadeIn 0.2s'
                }}>
                    {results.map((r, i) => (
                        <div
                            key={i}
                            onClick={() => handleSelect(r)}
                            style={{
                                padding: '10px 16px', fontSize: '0.8rem', cursor: 'pointer',
                                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.display_name.split(',')[0]}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {r.display_name}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
