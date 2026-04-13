import { useEffect } from "react"
import { useLocation } from "react-router-dom"

interface PageWrapperProps {
  children: React.ReactNode
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const location = useLocation()

  useEffect(() => {
    // Forçar scroll to top ao mudar de página
    window.scrollTo(0, 0)
  }, [location.pathname])

  return <>{children}</>
}
