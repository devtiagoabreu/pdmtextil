"use client"

import Link from "next/link"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  title?: string
  onClick?: () => void
}

export function NavLink({ href, children, className, title, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={className}
      title={title}
    >
      {children}
    </Link>
  )
}
