import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'red' | 'yellow' | 'blue' | 'green'

const styles: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-[#333]',
  secondary: 'bg-card text-ink hover:bg-yellow',
  red: 'bg-red text-white hover:brightness-110',
  yellow: 'bg-gold text-ink hover:brightness-105',
  blue: 'bg-blue text-white hover:brightness-110',
  green: 'bg-green text-white hover:brightness-110',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg' | 'xl'
  children: ReactNode
}

/** Chunky 8-bit game button with a pixel frame. */
export function Button({ variant = 'primary', size = 'lg', className = '', children, ...rest }: ButtonProps) {
  const sizing = size === 'xl' ? 'min-h-20 px-10 text-2xl' : size === 'lg' ? 'min-h-16 px-7 text-lg' : 'min-h-12 px-5 text-sm'
  return (
    <button
      type="button"
      className={`px-btn inline-flex cursor-pointer items-center justify-center gap-3 font-bold uppercase disabled:cursor-not-allowed disabled:opacity-40 ${sizing} ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
