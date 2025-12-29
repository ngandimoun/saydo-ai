"use client"

import { motion } from "framer-motion"
import { Briefcase } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div 
        className="relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-16 h-16 rounded-full border-3 border-teal-200 dark:border-teal-900" />
        <motion.div 
          className="absolute inset-0 rounded-full border-3 border-transparent border-t-teal-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <Briefcase className="absolute inset-0 m-auto w-6 h-6 text-teal-500" />
      </motion.div>
    </div>
  )
}

