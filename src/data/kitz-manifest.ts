export interface AgentDef {
  name: string
  fn: string
}

export interface AgentTeamManifest {
  name: string
  displayName: string
  lead: string
  agents: AgentDef[]
  capabilities: string[]
  customerFacing: boolean
}

export interface SOPManifest {
  slug: string
  title: string
  owner: string
}

export interface KitzManifest {
  name: string
  version: string
  description: string
  mission: string
  tagline: string
  targetAudience: string
  activationTarget: string
  capabilities: {
    agentTeams: number
    totalAgents: number
    tools: number
    sops: number
    playbooks: number
    languages: string[]
  }
  agentTeams: AgentTeamManifest[]
  sops: SOPManifest[]
  governance: {
    draftFirst: boolean
    aiBatteryDailyLimit: number
    roiMinimum: string
    killSwitch: boolean
    auditTrail: boolean
  }
  endpoints: {
    api: string
    whatsapp: string
    workspace: string
    discovery: string
  }
  economicModel: {
    businessOwnerShare: string
    kitzShare: string
    reinvestedShare: string
  }
}

export const KITZ_MANIFEST: KitzManifest = {
  name: 'KITZ',
  version: '0.1.0',
  description: 'AI Business OS for small businesses',
  mission: 'AI agents that help run your business',
  tagline: 'Your hustle deserves infrastructure',
  targetAudience: 'Small business owners in Latin America',
  activationTarget: 'Under 10 minutes to first value',

  capabilities: {
    agentTeams: 18,
    totalAgents: 102,
    tools: 81,
    sops: 6,
    playbooks: 2,
    languages: ['en', 'es', 'pt'],
  },

  agentTeams: [
    // ── Customer-facing teams (shown by default) ──
    {
      name: 'sales-crm',
      displayName: 'Sales & CRM',
      lead: 'The Closer',
      agents: [
        { name: 'Lead Checker', fn: 'Scores inbound leads by fit, intent, and engagement signals' },
        { name: 'Pipeline Mover', fn: 'Moves deals through stages and flags stalled opportunities' },
        { name: 'Follow-Up Writer', fn: 'Drafts personalized follow-up messages for each lead' },
        { name: 'Deal Maker', fn: 'Generates proposals and checkout links to close deals' },
        { name: 'Quote Builder', fn: 'Generates price quotes from order history and templates' },
        { name: 'Win/Loss Analyst', fn: 'Analyzes closed deals to find winning and losing patterns' },
      ],
      capabilities: ['Lead scoring', 'Pipeline management', 'Outreach drafting', 'Deal closing', 'Quote generation', 'Win/loss analysis'],
      customerFacing: true,
    },
    {
      name: 'whatsapp-comms',
      displayName: 'WhatsApp & Comms',
      lead: 'The Connector',
      agents: [
        { name: 'Flow Builder', fn: 'Designs multi-step WhatsApp conversation flows' },
        { name: 'Message Writer', fn: 'Creates reusable message templates for common replies' },
        { name: 'Delivery Tracker', fn: 'Tracks message delivery status and retries failures' },
        { name: 'Escalation Spotter', fn: 'Routes unanswered or urgent messages to humans' },
        { name: 'QR Login Bot', fn: 'Manages WhatsApp QR login sessions and reconnections' },
        { name: 'Chat Analyzer', fn: 'Analyzes conversation patterns and sentiment trends' },
      ],
      capabilities: ['Chat flow design', 'Message templates', 'Delivery tracking', 'Escalation', 'QR login', 'Conversation analysis'],
      customerFacing: true,
    },
    {
      name: 'marketing-growth',
      displayName: 'Marketing & Growth',
      lead: 'The Megaphone',
      agents: [
        { name: 'Content Machine', fn: 'Generates social posts, ads, and product descriptions' },
        { name: 'Search Guru', fn: 'Analyzes keywords and optimizes content for search visibility' },
        { name: 'Campaign Launcher', fn: 'Plans, schedules, and tracks marketing campaigns' },
        { name: 'Social Scheduler', fn: 'Schedules posts across platforms and monitors engagement' },
        { name: 'A/B Tester', fn: 'Runs A/B tests on landing pages, copy, and offers' },
        { name: 'Audience Builder', fn: 'Segments audiences based on behavior and demographics' },
      ],
      capabilities: ['Content creation', 'SEO optimization', 'Campaign management', 'Social scheduling', 'A/B testing', 'Audience segmentation'],
      customerFacing: true,
    },
    {
      name: 'growth-hacking',
      displayName: 'Growth Hacking',
      lead: 'The Growth Hacker',
      agents: [
        { name: 'Hook Specialist', fn: 'Reduces time-to-first-value for new users' },
        { name: 'Loyalty Keeper', fn: 'Identifies at-risk users and recommends win-back actions' },
        { name: 'Referral Builder', fn: 'Builds and tracks referral programs and viral loops' },
        { name: 'Funnel Architect', fn: 'Maps and optimizes conversion funnels end-to-end' },
        { name: 'Onboarding Tracker', fn: 'Tracks user progress through onboarding milestones' },
        { name: 'Viral Loop Tester', fn: 'Tests and measures viral growth loops and share mechanics' },
      ],
      capabilities: ['Activation optimization', 'Retention analysis', 'Referral programs', 'Funnel design', 'Onboarding tracking', 'Viral loops'],
      customerFacing: true,
    },
    {
      name: 'customer-success',
      displayName: 'Customer Success',
      lead: 'The Listener',
      agents: [
        { name: 'Ticket Router', fn: 'Classifies and routes support tickets to the right team' },
        { name: 'Happy Checker', fn: 'Sends CSAT surveys and tracks satisfaction trends' },
        { name: 'Churn Spotter', fn: 'Flags customers likely to leave based on behavior patterns' },
        { name: 'Feedback Collector', fn: 'Collects and summarizes customer feedback across channels' },
        { name: 'CSAT Analyst', fn: 'Deep-dives into satisfaction scores to find improvement areas' },
        { name: 'Escalation Handler', fn: 'Manages escalated tickets with priority routing and SLAs' },
      ],
      capabilities: ['Ticket routing', 'Satisfaction tracking', 'Churn prediction', 'Feedback analysis', 'CSAT analysis', 'Escalation handling'],
      customerFacing: true,
    },
    {
      name: 'finance-billing',
      displayName: 'Finance & Billing',
      lead: 'The Money Manager',
      agents: [
        { name: 'Invoice Bot', fn: 'Generates and sends invoices automatically on order completion' },
        { name: 'Revenue Tracker', fn: 'Tracks income streams and calculates revenue metrics' },
        { name: 'Cost Cutter', fn: 'Analyzes spending and recommends cost reductions' },
        { name: 'Compliance Checker', fn: 'Verifies financial operations meet Panama regulations' },
        { name: 'Forecast Bot', fn: 'Predicts revenue trends and generates financial forecasts' },
      ],
      capabilities: ['Invoicing', 'Revenue tracking', 'Cost optimization', 'Compliance', 'Revenue forecasting'],
      customerFacing: true,
    },
    {
      name: 'education-onboarding',
      displayName: 'Education & Onboarding',
      lead: 'The Teacher',
      agents: [
        { name: 'Tutorial Maker', fn: 'Creates step-by-step guides for platform features' },
        { name: 'Doc Writer', fn: 'Writes and maintains help documentation and knowledge base' },
        { name: 'Video Scripter', fn: 'Scripts tutorial and explainer videos for users' },
        { name: 'Answer Bot', fn: 'Answers common questions from the knowledge base instantly' },
        { name: 'Course Designer', fn: 'Designs structured learning paths for business skills' },
      ],
      capabilities: ['Tutorial creation', 'Help docs', 'Video scripts', 'FAQ management', 'Course design'],
      customerFacing: true,
    },

    // ── Infrastructure teams (hidden by default, toggle to show) ──
    {
      name: 'content-brand',
      displayName: 'Content & Brand',
      lead: 'Brand Guardian',
      agents: [
        { name: 'Copy Writer', fn: 'Writes marketing copy, taglines, and product descriptions' },
        { name: 'Translator', fn: 'Translates content between English and Spanish' },
        { name: 'Voice Keeper', fn: 'Ensures all content matches the KITZ brand tone and style' },
        { name: 'Asset Organizer', fn: 'Organizes and versions brand assets like logos and templates' },
        { name: 'Style Guardian', fn: 'Enforces brand style guidelines across all content' },
      ],
      capabilities: ['Copywriting', 'Translation (ES/EN)', 'Brand voice', 'Asset management', 'Style enforcement'],
      customerFacing: false,
    },
    {
      name: 'strategy-intel',
      displayName: 'Strategy & Intel',
      lead: 'The Scout',
      agents: [
        { name: 'Competitor Watcher', fn: 'Monitors competitor pricing, features, and positioning' },
        { name: 'Market Scanner', fn: 'Scans market data for opportunities and threats' },
        { name: 'Opportunity Finder', fn: 'Identifies new revenue opportunities from market signals' },
        { name: 'Trend Spotter', fn: 'Detects emerging trends relevant to the business' },
        { name: 'Pricing Analyst', fn: 'Analyzes pricing strategies and recommends adjustments' },
      ],
      capabilities: ['Competitor tracking', 'Market scanning', 'Opportunity detection', 'Trend analysis', 'Pricing analysis'],
      customerFacing: false,
    },
    {
      name: 'platform-eng',
      displayName: 'Platform Engineering',
      lead: 'The Architect',
      agents: [
        { name: 'API Designer', fn: 'Designs and documents REST/GraphQL API endpoints' },
        { name: 'Database Admin', fn: 'Manages database schemas, migrations, and performance' },
        { name: 'Infra Ops', fn: 'Provisions and maintains cloud infrastructure and services' },
        { name: 'Service Mesh', fn: 'Manages inter-service communication and load balancing' },
        { name: 'Capacity Planner', fn: 'Forecasts infrastructure needs and plans scaling' },
        { name: 'Latency Monitor', fn: 'Tracks response times and flags performance degradation' },
      ],
      capabilities: ['API design', 'Database admin', 'Infrastructure', 'Service mesh', 'Capacity planning', 'Latency monitoring'],
      customerFacing: false,
    },
    {
      name: 'backend',
      displayName: 'Backend Engineering',
      lead: 'The Builder',
      agents: [
        { name: 'Data Modeler', fn: 'Designs data schemas and entity relationships' },
        { name: 'Integration Eng', fn: 'Builds and maintains third-party API integrations' },
        { name: 'Security Guard', fn: 'Implements authentication, encryption, and access control' },
        { name: 'System Designer', fn: 'Architects system components and data flow patterns' },
        { name: 'Migration Runner', fn: 'Executes and validates database schema migrations' },
        { name: 'Cache Optimizer', fn: 'Tunes cache strategies for optimal hit rates' },
      ],
      capabilities: ['Data modeling', 'Integrations', 'Security', 'System design', 'Migrations', 'Cache optimization'],
      customerFacing: false,
    },
    {
      name: 'frontend',
      displayName: 'Frontend Engineering',
      lead: 'The Builder',
      agents: [
        { name: 'UI Architect', fn: 'Designs component hierarchies and UI state management' },
        { name: 'Component Dev', fn: 'Builds reusable React components with Tailwind styling' },
        { name: 'Speed Freak', fn: 'Profiles and optimizes render performance and bundle size' },
        { name: 'Access Checker', fn: 'Ensures WCAG compliance and keyboard accessibility' },
        { name: 'Design System Bot', fn: 'Audits and enforces design system token usage' },
      ],
      capabilities: ['UI architecture', 'Component dev', 'Performance', 'Accessibility', 'Design system'],
      customerFacing: false,
    },
    {
      name: 'devops-ci',
      displayName: 'DevOps & CI/CD',
      lead: 'The Architect',
      agents: [
        { name: 'Pipeline Eng', fn: 'Builds and maintains CI/CD pipelines for all services' },
        { name: 'Container Ops', fn: 'Manages Docker containers and orchestration configs' },
        { name: 'Monitor Bot', fn: 'Sets up alerts, dashboards, and health checks' },
        { name: 'Release Manager', fn: 'Coordinates deployments and manages release schedules' },
        { name: 'Incident Responder', fn: 'Triages production incidents and coordinates fixes' },
      ],
      capabilities: ['CI/CD pipelines', 'Containers', 'Monitoring', 'Releases', 'Incident response'],
      customerFacing: false,
    },
    {
      name: 'qa-testing',
      displayName: 'QA & Testing',
      lead: 'The Builder',
      agents: [
        { name: 'Test Architect', fn: 'Designs test strategies and coverage requirements' },
        { name: 'E2E Runner', fn: 'Executes end-to-end tests across the full stack' },
        { name: 'Regression Bot', fn: 'Detects regressions by comparing builds automatically' },
        { name: 'Load Tester', fn: 'Simulates traffic to find performance bottlenecks' },
        { name: 'Flaky Test Hunter', fn: 'Detects and quarantines intermittently failing tests' },
        { name: 'Coverage Tracker', fn: 'Monitors test coverage and flags uncovered code paths' },
      ],
      capabilities: ['Test architecture', 'E2E testing', 'Regression detection', 'Load testing', 'Flaky test detection', 'Coverage tracking'],
      customerFacing: false,
    },
    {
      name: 'ai-ml',
      displayName: 'AI & Machine Learning',
      lead: 'The Architect',
      agents: [
        { name: 'Prompt Eng', fn: 'Writes and optimizes prompts for all LLM interactions' },
        { name: 'Model Evaluator', fn: 'Benchmarks model outputs for quality and cost efficiency' },
        { name: 'RAG Specialist', fn: 'Builds retrieval-augmented generation pipelines' },
        { name: 'Fine-Tune Ops', fn: 'Manages fine-tuning datasets and model training runs' },
        { name: 'Cost Tracker', fn: 'Tracks AI spend per model, team, and feature' },
        { name: 'Benchmark Runner', fn: 'Runs model quality benchmarks and compares providers' },
      ],
      capabilities: ['Prompt engineering', 'Model evaluation', 'RAG systems', 'Fine-tuning', 'Cost tracking', 'Benchmarking'],
      customerFacing: false,
    },
    {
      name: 'legal-compliance',
      displayName: 'Legal & Compliance',
      lead: 'The Money Manager',
      agents: [
        { name: 'Panama Compliance', fn: 'Validates operations against Panama business regulations' },
        { name: 'Privacy Auditor', fn: 'Audits data handling for privacy law compliance' },
        { name: 'Data Retention', fn: 'Enforces data retention and deletion policies' },
        { name: 'TOS Monitor', fn: 'Tracks terms of service changes from third-party providers' },
        { name: 'Audit Logger', fn: 'Logs all agent actions for compliance auditing' },
        { name: 'Fact Checker', fn: 'Verifies all outbound content for accuracy, flags unsourced claims for human review' },
      ],
      capabilities: ['Panama compliance', 'Privacy auditing', 'Data retention', 'TOS monitoring', 'Audit logging', 'Fact checking'],
      customerFacing: false,
    },
    {
      name: 'governance-pmo',
      displayName: 'Governance & PMO',
      lead: 'The Operator',
      agents: [
        { name: 'Sprint Planner', fn: 'Plans sprints and assigns work to agent teams' },
        { name: 'Progress Tracker', fn: 'Tracks task completion and reports on velocity' },
        { name: 'Resource Allocator', fn: 'Balances workload across teams to prevent bottlenecks' },
        { name: 'Risk Monitor', fn: 'Identifies operational risks and recommends mitigations' },
        { name: 'Velocity Tracker', fn: 'Measures sprint velocity and predicts delivery timelines' },
        { name: 'Momentum Guardian', fn: 'Ensures task continuity — restarts stalled/failed processes, retries with backoff, never lets work drop' },
      ],
      capabilities: ['Sprint planning', 'Progress tracking', 'Resource allocation', 'Risk monitoring', 'Velocity tracking', 'Momentum enforcement'],
      customerFacing: false,
    },
    {
      name: 'coaches',
      displayName: 'Coaching & Training',
      lead: 'The Teacher',
      agents: [
        { name: 'Onboarding Coach', fn: 'Guides new users through their first 10 minutes' },
        { name: 'Playbook Coach', fn: 'Teaches business playbooks tailored to the user\'s industry' },
        { name: 'Process Coach', fn: 'Helps users set up and refine business processes' },
        { name: 'Skill Trainer', fn: 'Trains other agents on new tools and capabilities' },
        { name: 'Performance Reviewer', fn: 'Reviews agent performance and recommends improvements' },
      ],
      capabilities: ['Onboarding coaching', 'Playbook guidance', 'Process coaching', 'Agent training', 'Performance reviews'],
      customerFacing: false,
    },
  ],

  sops: [
    { slug: 'new-customer-onboarding', title: 'New Customer Onboarding', owner: 'The Growth Hacker' },
    { slug: 'ai-battery-management', title: 'AI Battery Management', owner: 'The Money Manager' },
    { slug: 'whatsapp-response-sla', title: 'WhatsApp Response SLA', owner: 'The Connector' },
    { slug: 'order-fulfillment', title: 'Order Fulfillment', owner: 'The Operator' },
    { slug: 'inbox-triage', title: 'Inbox Triage', owner: 'The Connector' },
    { slug: 'payment-collection', title: 'Payment Collection', owner: 'The Money Manager' },
  ],

  governance: {
    draftFirst: true,
    aiBatteryDailyLimit: 5,
    roiMinimum: '2x',
    killSwitch: true,
    auditTrail: true,
  },

  endpoints: {
    api: '/api/kitz',
    whatsapp: '/api/whatsapp',
    workspace: '/api/workspace',
    discovery: '/.well-known/kitz.json',
  },

  economicModel: {
    businessOwnerShare: '45%',
    kitzShare: '5%',
    reinvestedShare: '50%',
  },
}
