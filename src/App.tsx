import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppShell from '@/components/layout/AppShell'
import OverviewPage from '@/components/pages/OverviewPage'
import ModelsPage from '@/components/pages/ModelsPage'
import DockerPage from '@/components/pages/DockerPage'
import ServicesPage from '@/components/pages/ServicesPage'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6 max-w-screen-xl mx-auto animate-fade-in">
      <div className="card p-6">
        <h1 className="text-lg font-medium text-text-primary font-display">{title}</h1>
        <p className="text-sm text-text-tertiary mt-1">This section is ready for dashboard content.</p>
      </div>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'models', element: <ModelsPage /> },
      { path: 'docker', element: <DockerPage /> },
      { path: 'infrastructure', element: <PlaceholderPage title="Infrastructure" /> },
      { path: 'agents', element: <PlaceholderPage title="Agents" /> },
      { path: 'logs', element: <PlaceholderPage title="Logs" /> },
      { path: 'settings', element: <PlaceholderPage title="Settings" /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
