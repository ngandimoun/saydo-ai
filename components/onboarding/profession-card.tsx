"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Briefcase, Stethoscope, FlaskConical, Rocket, TrendingUp, Home, UserX, DollarSign, Megaphone, Building2, Wrench, Settings, Calculator, Users, BarChart3, Crown, Zap, Droplets, Hammer, Flame, HardHat } from "lucide-react"

interface ProfessionCardProps {
  id: string
  name: string
  selected: boolean
  onSelect: (id: string) => void
  color?: string
}

const professionIcons: Record<string, React.ReactNode> = {
  doctor: <Stethoscope className="w-6 h-6" />,
  nurse: <Stethoscope className="w-6 h-6" />,
  pharmacist: <FlaskConical className="w-6 h-6" />,
  founder: <Rocket className="w-6 h-6" />,
  entrepreneur: <TrendingUp className="w-6 h-6" />,
  retiring: <Home className="w-6 h-6" />,
  jobless: <UserX className="w-6 h-6" />,
  finance: <DollarSign className="w-6 h-6" />,
  marketing: <Megaphone className="w-6 h-6" />,
  accountant: <Calculator className="w-6 h-6" />,
  consultant: <Users className="w-6 h-6" />,
  manager: <Users className="w-6 h-6" />,
  analyst: <BarChart3 className="w-6 h-6" />,
  executive: <Crown className="w-6 h-6" />,
  electrician: <Zap className="w-6 h-6" />,
  plumber: <Droplets className="w-6 h-6" />,
  carpenter: <Hammer className="w-6 h-6" />,
  welder: <Flame className="w-6 h-6" />,
  constructionWorker: <HardHat className="w-6 h-6" />,
  mechanic: <Settings className="w-6 h-6" />
}

export function ProfessionCard({
  id,
  name,
  selected,
  onSelect,
  color = "bg-primary"
}: ProfessionCardProps) {
  const icon = professionIcons[id] || <Briefcase className="w-6 h-6" />

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(id)}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative p-6 rounded-2xl border-2 transition-all duration-300 text-center min-h-[120px] flex flex-col items-center justify-center gap-3",
        selected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50 hover:shadow-md"
      )}
    >
      {selected && (
        <motion.div
          layoutId="professionSelected"
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
          initial={false}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <svg
            className="w-4 h-4 text-primary-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      )}
      
      <div className={cn(
        "w-14 h-14 rounded-xl flex items-center justify-center text-white",
        color
      )}>
        {icon}
      </div>
      
      <span className="font-semibold text-base">{name}</span>
    </motion.button>
  )
}

