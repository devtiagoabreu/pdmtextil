"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

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

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onClick?.()
    router.push(href)
  }, [href, onClick, router])

  const handleMouseEnter = useCallback(() => {
    if (prefetch) router.prefetch(href)
  }, [href, prefetch, router])

  const handleFocus = useCallback(() => {
    if (prefetch) router.prefetch(href)
  }, [href, prefetch, router])

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
