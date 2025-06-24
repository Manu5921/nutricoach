import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "../primitives/button"
import type { BaseComponentProps } from "@/types"

/**
 * Navigation bar variants
 */
const navBarVariants = cva(
  [
    "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
    "transition-all duration-200"
  ],
  {
    variants: {
      variant: {
        default: "border-border",
        glass: "border-border/50 bg-background/80",
        solid: "bg-background border-border"
      },
      size: {
        sm: "h-14",
        default: "h-16", 
        lg: "h-20"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

export interface NavBarProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navBarVariants>,
    BaseComponentProps {
  /** Logo or brand component */
  logo?: React.ReactNode
  /** Navigation items */
  children?: React.ReactNode
  /** Actions on the right side */
  actions?: React.ReactNode
}

/**
 * Main navigation bar component
 */
const NavBar = React.forwardRef<HTMLElement, NavBarProps>(
  (
    {
      className,
      variant,
      size,
      logo,
      children,
      actions,
      ...props
    },
    ref
  ) => {
    return (
      <nav
        ref={ref}
        className={cn(navBarVariants({ variant, size }), className)}
        {...props}
      >
        <div className="container flex h-full items-center justify-between px-4">
          {/* Logo/Brand section */}
          {logo && (
            <div className="flex items-center">
              {logo}
            </div>
          )}

          {/* Navigation items */}
          <div className="flex items-center space-x-6">
            {children}
          </div>

          {/* Actions section */}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </nav>
    )
  }
)

NavBar.displayName = "NavBar"

/**
 * Navigation link component
 */
export interface NavLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    BaseComponentProps {
  /** Whether the link is active */
  active?: boolean
  /** Whether the link is disabled */
  disabled?: boolean
  /** Icon to show before text */
  icon?: React.ReactNode
}

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  (
    {
      className,
      active = false,
      disabled = false,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <a
        ref={ref}
        className={cn(
          "flex items-center gap-2 text-sm font-medium transition-colors",
          "hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active 
            ? "text-primary-600 border-b-2 border-primary-600" 
            : "text-muted-foreground",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        {icon && <span className="h-4 w-4">{icon}</span>}
        {children}
      </a>
    )
  }
)

NavLink.displayName = "NavLink"

/**
 * Health-focused NutriCoach Navigation Bar
 */
export interface NutriNavBarProps extends Omit<NavBarProps, "logo" | "children" | "actions"> {
  /** Current active route */
  activeRoute?: string
  /** User avatar/profile */
  userProfile?: {
    name: string
    avatar?: string
    email: string
  }
  /** Navigation items configuration */
  navigationItems?: Array<{
    label: string
    href: string
    icon?: React.ReactNode
    badge?: string | number
  }>
  /** Callback for user actions */
  onUserAction?: (action: "profile" | "settings" | "logout") => void
  /** Search handler */
  onSearch?: (query: string) => void
}

const NutriNavBar = React.forwardRef<HTMLElement, NutriNavBarProps>(
  (
    {
      activeRoute,
      userProfile,
      navigationItems = [],
      onUserAction,
      onSearch,
      ...props
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState("")

    const defaultNavItems = [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      },
      {
        label: "Recipes",
        href: "/recipes",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        )
      },
      {
        label: "Meal Plans",
        href: "/meal-plans",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      },
      {
        label: "Progress",
        href: "/progress",
        icon: (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      }
    ]

    const navItems = navigationItems.length > 0 ? navigationItems : defaultNavItems

    const handleSearch = (e: React.FormEvent) => {
      e.preventDefault()
      if (onSearch && searchQuery.trim()) {
        onSearch(searchQuery.trim())
      }
    }

    return (
      <NavBar
        ref={ref}
        variant="glass"
        logo={
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">NC</span>
            </div>
            <span className="font-bold text-lg text-foreground">NutriCoach</span>
          </div>
        }
        actions={
          <div className="flex items-center space-x-4">
            {/* Search */}
            {onSearch && (
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-64 rounded-md border border-input bg-background pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </form>
            )}

            {/* User Profile */}
            {userProfile && (
              <div className="flex items-center space-x-2">
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {userProfile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium">
                  {userProfile.name}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <Button variant="ghost" size="sm">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </Button>
          </div>
        }
        {...props}
      >
        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={activeRoute === item.href}
              icon={item.icon}
            >
              {item.label}
              {item.badge && (
                <span className="ml-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </NavBar>
    )
  }
)

NutriNavBar.displayName = "NutriNavBar"

export { NavBar, NavLink, NutriNavBar, navBarVariants }
export type { NavBarProps, NavLinkProps, NutriNavBarProps }