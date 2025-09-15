"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Users,
  Building,
  BarChart3,
  Settings,
  MessageSquare,
  Brain,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>(["admin"])

  const toggleSection = (section: string) => {
    setOpenSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const menuItems = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: Home,
    },
    {
      title: "Administración",
      section: "admin",
      icon: Settings,
      items: [
        { title: "Usuarios", href: "/admin/usuarios", icon: Users },
        { title: "Propiedades", href: "/admin/propiedades", icon: Building },
        { title: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { title: "Integraciones", href: "/admin/integrations", icon: Settings },
      ],
    },
    {
      title: "IA & Chat",
      section: "ai",
      icon: Brain,
      items: [
        { title: "Workspace IA", href: "/ai/workspace", icon: Brain },
        { title: "Chat", href: "/chat", icon: MessageSquare },
      ],
    },
  ]

  return (
    <div className={cn("w-80 bg-white border-r border-gray-200 h-full", className)}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900">Sur-Realista</h2>
      </div>

      <nav className="px-4 space-y-2">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50",
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Link>
            ) : (
              <>
                <button
                  onClick={() => toggleSection(item.section!)}
                  className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.title}
                  {openSections.includes(item.section!) ? (
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  ) : (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </button>

                {openSections.includes(item.section!) && item.items && (
                  <div className="ml-6 mt-2 space-y-1">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm transition-colors",
                          pathname === subItem.href ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        <subItem.icon className="w-4 h-4 mr-3" />
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
