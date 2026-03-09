import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import NewEstimate from './pages/NewEstimate'
import ProjectList from './pages/ProjectList'
import Analytics from './pages/Analytics'
import ReplayView from './pages/ReplayView'

export default function App() {
    return (
        <BrowserRouter>
            <div className="app-layout">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/estimate" element={<NewEstimate />} />
                        <Route path="/projects" element={<ProjectList />} />
                        <Route path="/replay/:projectId" element={<ReplayView />} />
                        <Route path="/analytics" element={<Analytics />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    )
}
