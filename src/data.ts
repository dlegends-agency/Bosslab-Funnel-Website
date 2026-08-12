export const painPointsLeft = [
  'Missed calls become lost customers',
  'Leads go unanswered',
  'Hiring staff is expensive',
] as const

export const painPointsRight = [
  'Social media is inconsistent',
  'Marketing takes too much time',
  'Too many tools to manage',
] as const

export const traditionalHiring = [
  'Hire Employees',
  'Monthly Salaries',
  'Training Required',
  'Fixed Work Hours',
  'Multiple Tools',
] as const

export const bossLabBenefits = [
  'Start In Minutes',
  'One Subscription',
  'Ready To Use',
  'Available Around The Clock',
  'One Platform',
] as const

export const industries = [
  { name: 'Roofers', icon: 'roof' },
  { name: 'Plumbers', icon: 'wrench' },
  { name: 'Electricians', icon: 'bolt' },
  { name: 'Dentists', icon: 'tooth' },
  { name: 'HVAC', icon: 'fan' },
  { name: 'Auto Repair', icon: 'car' },
  { name: 'Landscapers', icon: 'leaf' },
  { name: 'Cleaners', icon: 'sparkle' },
  { name: 'Real Estate', icon: 'building' },
  { name: 'Accountants', icon: 'calculator' },
  { name: 'Salons', icon: 'scissors' },
  { name: 'Pest Control', icon: 'bug' },
] as const

export type FeatureValue = string | boolean

export interface PricingPlan {
  name: string
  price: string
  values: FeatureValue[]
}

export const featureLabels = [
  'Monthly Price',
  'Businesses',
  'Users',
  'AI Employees',
  'Mission Control',
  'CRM',
  'Automation',
  'Reports',
  'API Access',
  'White Label',
  'Priority Support',
  'AI Credits',
  'Phone Minutes',
  'SMS',
  'Email',
] as const

/** Starter values match the source page; Growth/Pro fill incomplete source columns. */
export const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: '$199',
    values: [
      '$199',
      '1',
      '2',
      '5',
      true,
      'Basic',
      'Basic',
      'Standard',
      false,
      false,
      'Email',
      '5,000',
      '100',
      '200',
      '2,000',
    ],
  },
  {
    name: 'Growth',
    price: '$399',
    values: [
      '$399',
      '3',
      '5',
      '10',
      true,
      'Advanced',
      'Advanced',
      'Advanced',
      true,
      false,
      'Priority',
      '15,000',
      '500',
      '1,000',
      '10,000',
    ],
  },
  {
    name: 'Pro',
    price: '$799',
    values: [
      '$799',
      '10',
      '15',
      '25',
      true,
      'Pro',
      'Pro',
      'Custom',
      true,
      true,
      '24/7',
      '50,000',
      '2,000',
      '5,000',
      '50,000',
    ],
  },
]

export type Testimonial = {
  name: string
  handle: string
  initials: string
  quote: string
  tone: 'blue' | 'emerald' | 'orange' | 'pink' | 'cyan' | 'violet'
}

export const testimonialsRowA: Testimonial[] = [
  {
    name: 'Sarah Jenkins',
    handle: '@sarah_jk',
    initials: 'SJ',
    tone: 'blue',
    quote:
      'Boss Lab took over our missed calls overnight. Leads get answered instantly and our calendar stays full without hiring another receptionist.',
  },
  {
    name: 'Marcus Thorne',
    handle: '@marcus_t',
    initials: 'MT',
    tone: 'emerald',
    quote:
      'We run ads, follow-ups, and social from one dashboard now. It feels like adding a full marketing team without the salary stack.',
  },
  {
    name: 'David Chen',
    handle: '@dchen_nz',
    initials: 'DC',
    tone: 'orange',
    quote:
      'The AI employees handle the busywork so I can stay on the tools. Setup took minutes and the difference showed up the same week.',
  },
]

export const testimonialsRowB: Testimonial[] = [
  {
    name: 'Sophie Clark',
    handle: '@sophie_c',
    initials: 'SC',
    tone: 'pink',
    quote:
      'Our salon used to lose bookings after hours. Now every message gets a reply and we wake up to confirmed appointments.',
  },
  {
    name: "Liam O'Connor",
    handle: '@liam_o',
    initials: 'LO',
    tone: 'cyan',
    quote:
      'Reliable, clear, and actually useful. Boss Lab replaced three tools we were juggling and made follow-up consistent.',
  },
  {
    name: 'Elena Rodriguez',
    handle: '@elena_rod',
    initials: 'ER',
    tone: 'violet',
    quote:
      'From onboarding to daily reports, everything is transparent. Our AI team keeps leads warm while we focus on jobs.',
  },
]

export const faqs = [
  {
    question: 'What is Boss Lab AI?',
    answer:
      'Boss Lab AI gives your business a team of AI employees that answer calls, create marketing, manage social media, follow up with leads, run ads, and automate daily work — all from one dashboard.',
  },
  {
    question: 'How fast can I get started?',
    answer:
      'Most businesses are up and running in minutes. Choose a plan, set up your AI employees, and start handing off everyday tasks right away.',
  },
  {
    question: 'Do I need technical skills to use it?',
    answer:
      'No. Boss Lab is built for local business owners. You manage tasks, approve content, and review performance from a simple dashboard — no coding required.',
  },
  {
    question: 'Can it work for my industry?',
    answer:
      'Yes. Boss Lab is built for local businesses like roofers, plumbers, dentists, HVAC, salons, real estate, and many more. Your AI team adapts to the workflows you already use.',
  },
  {
    question: 'What happens if I outgrow my plan?',
    answer:
      'You can upgrade anytime from Starter to Growth or Pro as your business scales — adding more users, AI employees, and credits without switching platforms.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Your information is handled securely, and you stay in control of what’s shared, approved, and automated inside your dashboard.',
  },
] as const
