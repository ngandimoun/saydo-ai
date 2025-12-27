export interface Profession {
  id: string
  name: string
  icon?: string
  color?: string
  criticalArtifacts: string[]
}

export const professions: Profession[] = [
  {
    id: 'doctor',
    name: 'Doctor',
    color: 'bg-blue-500',
    criticalArtifacts: ['Patient Records', 'Lab Results', 'Prescriptions', 'Medical Notes', 'Consultation Reports']
  },
  {
    id: 'nurse',
    name: 'Nurse',
    color: 'bg-rose-500',
    criticalArtifacts: ['SOAP Notes', 'Handoffs', 'Patient Logs', 'Medication Charts', 'Vital Signs Records']
  },
  {
    id: 'pharmacist',
    name: 'Pharmacist',
    color: 'bg-green-500',
    criticalArtifacts: ['Prescription Records', 'Drug Interactions', 'Dosage Charts', 'Inventory Logs']
  },
  {
    id: 'founder',
    name: 'Founder',
    color: 'bg-purple-500',
    criticalArtifacts: ['Meeting Minutes', 'Investor Updates', 'Team Memos', 'Product Roadmaps', 'Strategic Plans']
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    color: 'bg-indigo-500',
    criticalArtifacts: ['Business Plans', 'Pitch Decks', 'Financial Projections', 'Market Research', 'Partnership Agreements']
  },
  {
    id: 'retiring',
    name: 'Retiring',
    color: 'bg-amber-500',
    criticalArtifacts: ['Retirement Plans', 'Financial Documents', 'Health Records', 'Estate Planning']
  },
  {
    id: 'jobless',
    name: 'Jobless',
    color: 'bg-gray-500',
    criticalArtifacts: ['Job Applications', 'Resume Versions', 'Cover Letters', 'Interview Notes', 'Skill Assessments']
  },
  {
    id: 'finance',
    name: 'Finance',
    color: 'bg-emerald-500',
    criticalArtifacts: ['Financial Reports', 'Budget Plans', 'Investment Analysis', 'Tax Documents', 'Audit Reports']
  },
  {
    id: 'marketing',
    name: 'Marketing',
    color: 'bg-pink-500',
    criticalArtifacts: ['Campaign Plans', 'Content Calendars', 'Analytics Reports', 'Brand Guidelines', 'Market Research']
  },
  {
    id: 'accountant',
    name: 'Accountant',
    color: 'bg-cyan-500',
    criticalArtifacts: ['Financial Statements', 'Tax Returns', 'Audit Reports', 'Budget Plans', 'Expense Reports']
  },
  {
    id: 'consultant',
    name: 'Consultant',
    color: 'bg-indigo-500',
    criticalArtifacts: ['Client Proposals', 'Analysis Reports', 'Recommendations', 'Project Plans', 'Meeting Notes']
  },
  {
    id: 'manager',
    name: 'Manager',
    color: 'bg-blue-500',
    criticalArtifacts: ['Team Reports', 'Performance Reviews', 'Strategic Plans', 'Meeting Minutes', 'Budget Documents']
  },
  {
    id: 'analyst',
    name: 'Analyst',
    color: 'bg-purple-500',
    criticalArtifacts: ['Data Reports', 'Research Findings', 'Market Analysis', 'Trend Reports', 'Insights']
  },
  {
    id: 'executive',
    name: 'Executive',
    color: 'bg-slate-500',
    criticalArtifacts: ['Board Reports', 'Strategic Plans', 'Executive Summaries', 'Decision Documents', 'Quarterly Reviews']
  },
  {
    id: 'electrician',
    name: 'Electrician',
    color: 'bg-orange-500',
    criticalArtifacts: ['Wiring Diagrams', 'Inspection Reports', 'Safety Checklists', 'Work Orders', 'Equipment Logs']
  },
  {
    id: 'plumber',
    name: 'Plumber',
    color: 'bg-blue-400',
    criticalArtifacts: ['Installation Records', 'Repair Reports', 'Inspection Forms', 'Work Orders', 'Parts Inventory']
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    color: 'bg-amber-600',
    criticalArtifacts: ['Project Plans', 'Material Lists', 'Work Orders', 'Safety Reports', 'Quality Checklists']
  },
  {
    id: 'welder',
    name: 'Welder',
    color: 'bg-red-600',
    criticalArtifacts: ['Welding Specifications', 'Safety Reports', 'Quality Inspections', 'Work Orders', 'Material Logs']
  },
  {
    id: 'constructionWorker',
    name: 'Construction Worker',
    color: 'bg-orange-600',
    criticalArtifacts: ['Safety Reports', 'Work Orders', 'Progress Reports', 'Equipment Logs', 'Time Sheets']
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    color: 'bg-red-500',
    criticalArtifacts: ['Repair Orders', 'Parts Inventory', 'Diagnostic Reports', 'Service Records', 'Warranty Documents']
  }
]

export const socialIntelligenceSources = [
  { id: 'twitter', name: 'X (Twitter)' },
  { id: 'reddit', name: 'Reddit' },
  { id: 'hackernews', name: 'Hacker News' },
  { id: 'substack', name: 'Substack' },
  { id: 'linkedin', name: 'LinkedIn' },
  { id: 'medium', name: 'Medium' },
  { id: 'youtube', name: 'YouTube' },
  { id: 'podcasts', name: 'Podcasts' }
]

export const newsVerticals = [
  { id: 'fintech', name: 'Fintech' },
  { id: 'ai', name: 'AI' },
  { id: 'crypto', name: 'Crypto' },
  { id: 'geopolitics', name: 'Geopolitics' },
  { id: 'health', name: 'Health' },
  { id: 'climate', name: 'Climate' },
  { id: 'tech', name: 'Technology' },
  { id: 'startups', name: 'Startups' },
  { id: 'biotech', name: 'Biotech' },
  { id: 'energy', name: 'Energy' },
  { id: 'realEstate', name: 'Real Estate' },
  { id: 'education', name: 'Education' },
  { id: 'sports', name: 'Sports' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'fashion', name: 'Fashion' },
  { id: 'food', name: 'Food & Dining' },
  { id: 'travel', name: 'Travel' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'socialMedia', name: 'Social Media' },
  { id: 'ecommerce', name: 'E-commerce' },
  { id: 'saas', name: 'SaaS' },
  { id: 'healthcareTech', name: 'Healthcare Tech' },
  { id: 'edtech', name: 'EdTech' },
  { id: 'retail', name: 'Retail' },
  { id: 'logistics', name: 'Logistics' },
  { id: 'agriculture', name: 'Agriculture' },
  { id: 'manufacturing', name: 'Manufacturing' },
  { id: 'telecom', name: 'Telecommunications' },
  { id: 'media', name: 'Media & Publishing' }
]

export const healthInterests = [
  { id: 'biohacking', name: 'Biohacking' },
  { id: 'longevity', name: 'Longevity' },
  { id: 'gutHealth', name: 'Gut Health' },
  { id: 'fitness', name: 'Fitness' },
  { id: 'nutrition', name: 'Nutrition' },
  { id: 'mentalHealth', name: 'Mental Health' },
  { id: 'sleep', name: 'Sleep Optimization' },
  { id: 'hormones', name: 'Hormone Optimization' },
  { id: 'recovery', name: 'Recovery' },
  { id: 'preventive', name: 'Preventive Care' }
]

export const commonAllergies = [
  'Peanuts',
  'Penicillin',
  'Pollen',
  'Dust',
  'Shellfish',
  'Eggs',
  'Milk',
  'Soy',
  'Wheat',
  'Tree Nuts',
  'Latex',
  'Bee Stings'
]

export const bodyTypes = [
  { id: 'thin', name: 'Thin', description: 'Naturally slender, lean build' },
  { id: 'slimFit', name: 'Slim Fit', description: 'Slender with some muscle definition' },
  { id: 'athletic', name: 'Athletic', description: 'Well-toned, active build' },
  { id: 'muscular', name: 'Muscular', description: 'Strong, defined muscles' },
  { id: 'curvy', name: 'Curvy', description: 'Hourglass figure, fuller curves' },
  { id: 'plusSize', name: 'Plus Size', description: 'Larger frame, fuller build' },
  { id: 'ectomorph', name: 'Ectomorph', description: 'Naturally thin, fast metabolism' },
  { id: 'mesomorph', name: 'Mesomorph', description: 'Athletic, naturally muscular' },
  { id: 'endomorph', name: 'Endomorph', description: 'Naturally stocky, slower metabolism' },
  { id: 'balanced', name: 'Balanced', description: 'Mix of body types' }
]

export const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

export interface SkinTone {
  id: string
  name: string
  color: string // Hex color for visual representation
}

export const skinTones: SkinTone[] = [
  { id: 'veryFair', name: 'Very Fair', color: '#FDBBAE' },
  { id: 'fair', name: 'Fair', color: '#F4C2A1' },
  { id: 'light', name: 'Light', color: '#E6BC9A' },
  { id: 'lightBeige', name: 'Light Beige', color: '#D4A574' },
  { id: 'mediumLight', name: 'Medium Light', color: '#C9975F' },
  { id: 'medium', name: 'Medium', color: '#B8844F' },
  { id: 'olive', name: 'Olive', color: '#A0723F' },
  { id: 'tan', name: 'Tan', color: '#8D5F2F' },
  { id: 'mediumBrown', name: 'Medium Brown', color: '#7A4D1F' },
  { id: 'brown', name: 'Brown', color: '#6B3D0F' },
  { id: 'darkBrown', name: 'Dark Brown', color: '#5A2F08' },
  { id: 'deep', name: 'Deep', color: '#4A1F05' },
  { id: 'veryDeep', name: 'Very Deep', color: '#3A1503' }
]

export function getProfessionById(id: string): Profession | undefined {
  return professions.find(p => p.id === id)
}

