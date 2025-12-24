"use client"

import { motion } from "framer-motion"
import { Stethoscope, Briefcase, Users, Lightbulb, FileText, UserCheck } from "lucide-react"
import { OptionalImage } from "@/components/ui/optional-image"
import { getLandingImageUrl } from "@/lib/landing-images"

const useCases = [
  {
    icon: Stethoscope,
    title: "Healthcare Workers",
    description: "Nurses and doctors capture patient notes, treatment plans, and follow-ups on the go.",
    example: "Quick voice note after patient visit → AI agent creates organized care plan with reminders",
    gradient: "from-rose-50 to-orange-50",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    borderColor: "border-rose-200/60",
    imageKey: "use-case-healthcare" as const,
  },
  {
    icon: Briefcase,
    title: "Founders & Managers",
    description: "Turn scattered thoughts into actionable plans, meeting notes, and team updates.",
    example: "Rambling strategy session → AI agent extracts clear action items and next steps",
    gradient: "from-amber-50 to-yellow-50",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    borderColor: "border-amber-200/60",
    imageKey: "use-case-founder" as const,
  },
  {
    icon: Users,
    title: "Caregivers",
    description: "Document care activities, medication schedules, and important observations.",
    example: "Daily care updates → AI agent structures care log with reminders",
    gradient: "from-sky-50 to-cyan-50",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    borderColor: "border-sky-200/60",
    imageKey: "use-case-caregiver" as const,
  },
  {
    icon: Lightbulb,
    title: "Writers & Creators",
    description: "Capture ideas, plot points, and creative thoughts before they slip away.",
    example: "Stream of consciousness → AI agent organizes notes and writing prompts",
    gradient: "from-violet-50 to-purple-50",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    borderColor: "border-violet-200/60",
    imageKey: "use-case-writer" as const,
  },
  {
    icon: UserCheck,
    title: "Technicians",
    description: "Document repairs, maintenance notes, and technical observations hands-free.",
    example: "Field service notes → AI agent creates professional service reports",
    gradient: "from-emerald-50 to-teal-50",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    borderColor: "border-emerald-200/60",
    imageKey: "use-case-technician" as const,
  },
  {
    icon: FileText,
    title: "Anyone Overwhelmed",
    description: "When your brain moves faster than your fingers, Saydo's AI agent keeps up.",
    example: "Mental dump → AI agent creates clear priorities and organized thoughts",
    gradient: "from-slate-50 to-gray-50",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    borderColor: "border-slate-200/60",
    imageKey: undefined,
  },
]

export const UseCases = () => {
  return (
    <section className="w-full py-20 sm:py-28 px-4 bg-gradient-to-b from-background to-secondary">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="saydo-headline text-3xl sm:text-4xl md:text-5xl text-foreground mb-5">
            Built for People Who{" "}
            <span className="saydo-headline-italic text-primary">Move Fast</span>
          </h2>
          <p className="saydo-body text-muted-foreground text-lg max-w-2xl mx-auto">
            Saydo is perfect for anyone who thinks faster than they type
          </p>
        </motion.div>

        {/* Use Cases Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`saydo-card bg-gradient-to-br ${useCase.gradient} dark:bg-card/60 dark:border-primary/30 border ${useCase.borderColor} p-5 sm:p-6 overflow-hidden group`}
            >
              {useCase.imageKey && (
                <div className="relative w-full aspect-video mb-4 rounded-xl overflow-hidden bg-white/50 dark:bg-card/50">
                  <OptionalImage
                    src={getLandingImageUrl(useCase.imageKey)}
                    alt={`${useCase.title} - AI Agent Workflow`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${useCase.iconBg} dark:bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                  <useCase.icon className={`${useCase.iconColor} dark:text-primary w-6 h-6`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-foreground dark:text-foreground font-semibold text-lg mb-2">
                    {useCase.title}
                  </h3>
                  <p className="text-muted-foreground dark:text-foreground/90 text-sm mb-3 leading-relaxed">
                    {useCase.description}
                  </p>
                  <div className="bg-white/60 dark:bg-card/80 dark:border-primary/30 backdrop-blur-sm rounded-lg p-3 border border-white/80">
                    <p className="text-muted-foreground dark:text-foreground/95 text-xs italic">
                      &ldquo;{useCase.example}&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
