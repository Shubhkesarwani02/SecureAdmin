import { useLocation, useNavigate } from "react-router-dom"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"

const menuItems = [
  {
    title: "Overview",
    path: "/",
    key: "overview"
  },
  {
    title: "Client Management",
    path: "/clients", 
    key: "clients"
  },
  {
    title: "System Monitoring",
    path: "/monitoring",
    key: "monitoring"
  },
  {
    title: "Payments & Billing",
    path: "/payments",
    key: "payments"
  },
  {
    title: "Snippet Manager",
    path: "/snippets",
    key: "snippets"
  },
  {
    title: "Admin Settings",
    path: "/settings",
    key: "settings"
  }
]

export function BreadcrumbNavigation() {
  const location = useLocation()
  const navigate = useNavigate()

  const getCurrentTitle = () => {
    const item = menuItems.find(item => item.path === location.pathname)
    return item ? item.title : "Overview"
  }

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    navigate("/")
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink 
            href="/" 
            onClick={handleHomeClick}
            className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
          >
            Framtt Admin
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage className="font-medium">{getCurrentTitle()}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
