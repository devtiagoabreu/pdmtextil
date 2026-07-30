"use client"

import { useRouter } from "next/navigation"
import { useRef, useCallback } from "react"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  title?: string
  onClick?: () => void
  prefetch?: boolean
}

export function NavLink({ href, children, className, title, onClick, prefetch = true }: NavLinkProps) {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onClick?.()
    try {
      routerRef.current.push(href)
    } catch {
      window.location.href = href
    }
  }

  const handleMouseEnter = useCallback(() => {
    if (prefetch) routerRef.current.prefetch(href)
  }, [href, prefetch])

  const handleFocus = useCallback(() => {
    if (prefetch) routerRef.current.prefetch(href)
  }, [href, prefetch])

  return (
    <a
      href={href}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      className={className}
      title={title}
    >
      {children}
    </a>
  )
}
