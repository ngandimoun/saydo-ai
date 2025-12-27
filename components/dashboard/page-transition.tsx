"use client"

import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"
import { springs } from "@/lib/motion-system"

/**
 * Page Transition Wrapper
 * 
 * Provides smooth transitions between dashboard tabs.
 * Uses Framer Motion for elegant page animations.
 */

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.99,
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.99,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
}

// Child element variants for staggered animations
const childVariants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
  },
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Export child variants for use in page components
export { childVariants as pageChildVariants }

/**
 * Section animation component
 * Use this to wrap sections that should animate in sequence
 */
interface AnimatedSectionProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export function AnimatedSection({ children, className, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.section>
  )
}

/**
 * Staggered list container
 * Use this to wrap lists that should animate children in sequence
 */
interface StaggeredListProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export function StaggeredList({ children, className, staggerDelay = 0.05 }: StaggeredListProps) {
  return (
    <motion.div
      initial="initial"
      animate="enter"
      exit="exit"
      variants={{
        initial: { opacity: 0 },
        enter: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
        exit: {
          opacity: 0,
          transition: {
            staggerChildren: staggerDelay / 2,
            staggerDirection: -1,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * Staggered item for use inside StaggeredList
 */
interface StaggeredItemProps {
  children: React.ReactNode
  className?: string
}

export function StaggeredItem({ children, className }: StaggeredItemProps) {
  return (
    <motion.div variants={childVariants} className={className}>
      {children}
    </motion.div>
  )
}

