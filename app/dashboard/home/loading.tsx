"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        {/* Saydo loading orb */}
        <motion.div
          className="relative"
        >
          <motion.div
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-600 shadow-lg shadow-primary/30"
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-teal-600/50"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground font-medium"
        >
          Loading your day...
        </motion.p>
      </motion.div>
    </div>
  )
}

