-- seed.sql
-- Seed data for local development: 3 companies, 3 published snapshots, 10 jobs

-- Companies
INSERT INTO companies (id, name, slug, careers_url) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp', 'acme-corp', 'https://example.com/acme/careers'),
  ('22222222-2222-2222-2222-222222222222', 'Globex', 'globex', 'https://example.com/globex/careers'),
  ('33333333-3333-3333-3333-333333333333', 'Initech', 'initech', 'https://example.com/initech/careers');

-- Snapshots (one published per company)
INSERT INTO snapshots (id, company_id, status, job_count) VALUES
  ('aaaa1111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'published', 4),
  ('aaaa2222-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'published', 3),
  ('aaaa3333-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333333', 'published', 3);

-- Jobs for Acme Corp (4 jobs)
INSERT INTO jobs (job_key, snapshot_id, company_id, title, department_tag, department_raw, location, salary_raw, description, job_url, first_seen_at) VALUES
(
  'acme-fe-001',
  'aaaa1111-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Senior Frontend Engineer',
  'Engineering',
  'Engineering',
  'San Francisco, CA',
  '$160,000 - $200,000',
  '## About the Role

We are looking for a **Senior Frontend Engineer** to join our growing team at Acme Corp.

### Responsibilities

- Build and maintain our React-based web application
- Collaborate with design and product teams
- Mentor junior engineers
- Participate in architecture decisions

### Requirements

- 5+ years of experience with React and TypeScript
- Strong understanding of web performance optimization
- Experience with modern CSS frameworks
- Excellent communication skills',
  'https://example.com/acme/jobs/senior-fe',
  now() - interval '2 days'
),
(
  'acme-pm-001',
  'aaaa1111-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Product Manager',
  'Product',
  'Product',
  'New York, NY',
  NULL,
  '## Product Manager

Join Acme Corp as a **Product Manager** to lead our core platform product.

### What You Will Do

- Define product strategy and roadmap
- Work closely with engineering and design
- Conduct user research and competitive analysis
- Drive feature prioritization using data

### What We Look For

- 3+ years of product management experience
- Strong analytical skills
- Experience with B2B SaaS products
- Ability to communicate complex ideas clearly',
  'https://example.com/acme/jobs/pm',
  now() - interval '5 days'
),
(
  'acme-sales-001',
  'aaaa1111-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Account Executive',
  'Sales',
  'Sales',
  NULL,
  '$120,000 - $180,000 OTE',
  '## Account Executive

We are hiring an **Account Executive** to help grow our enterprise customer base.

### Responsibilities

- Manage full sales cycle from prospecting to close
- Build relationships with enterprise decision-makers
- Achieve quarterly revenue targets
- Collaborate with solutions engineering on demos

### Requirements

- 3+ years of B2B SaaS sales experience
- Track record of exceeding quota
- Strong presentation and negotiation skills
- Experience with CRM tools (Salesforce preferred)',
  'https://example.com/acme/jobs/ae',
  now() - interval '1 day'
),
(
  'acme-design-001',
  'aaaa1111-0000-0000-0000-000000000001',
  '11111111-1111-1111-1111-111111111111',
  'Product Designer',
  'Design',
  'Design',
  'San Francisco, CA',
  NULL,
  '## Product Designer

Acme Corp is looking for a **Product Designer** to shape the future of our platform.

### What You Will Do

- Design end-to-end user experiences
- Create wireframes, prototypes, and high-fidelity designs
- Conduct usability testing
- Maintain and evolve our design system

### Qualifications

- 4+ years of product design experience
- Proficiency with Figma
- Portfolio demonstrating strong interaction design
- Experience designing for B2B products',
  'https://example.com/acme/jobs/designer',
  now() - interval '3 days'
);

-- Jobs for Globex (3 jobs)
INSERT INTO jobs (job_key, snapshot_id, company_id, title, department_tag, department_raw, location, salary_raw, description, job_url, first_seen_at) VALUES
(
  'globex-be-001',
  'aaaa2222-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'Backend Engineer',
  'Engineering',
  'Platform Engineering',
  'Remote (US)',
  '$140,000 - $180,000',
  '## Backend Engineer

Globex is hiring a **Backend Engineer** to build scalable APIs and services.

### Responsibilities

- Design and implement RESTful and GraphQL APIs
- Optimize database queries and data models
- Build and maintain CI/CD pipelines
- Participate in on-call rotation

### Requirements

- 3+ years with Node.js or Python
- Experience with PostgreSQL and Redis
- Familiarity with cloud platforms (AWS or GCP)
- Strong problem-solving skills',
  'https://example.com/globex/jobs/backend',
  now() - interval '4 days'
),
(
  'globex-mktg-001',
  'aaaa2222-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'Marketing Manager',
  'Marketing',
  'Growth Marketing',
  'New York, NY',
  NULL,
  '## Marketing Manager

Join Globex as a **Marketing Manager** to drive our growth initiatives.

### What You Will Do

- Plan and execute multi-channel marketing campaigns
- Manage content calendar and social media presence
- Analyze campaign performance and optimize spend
- Collaborate with sales on lead generation

### What We Look For

- 4+ years of B2B marketing experience
- Experience with marketing automation tools
- Data-driven mindset with strong analytical skills
- Excellent writing and communication abilities',
  'https://example.com/globex/jobs/marketing-mgr',
  now() - interval '6 days'
),
(
  'globex-data-001',
  'aaaa2222-0000-0000-0000-000000000002',
  '22222222-2222-2222-2222-222222222222',
  'Data Analyst',
  'Data',
  'Data & Analytics',
  'Remote (US)',
  NULL,
  '## Data Analyst

Globex is looking for a **Data Analyst** to turn data into actionable insights.

### Responsibilities

- Build dashboards and reports for key business metrics
- Conduct ad-hoc analysis to support decision-making
- Partner with product and engineering on data models
- Maintain data documentation and definitions

### Requirements

- 2+ years of data analysis experience
- Proficiency with SQL and Python
- Experience with BI tools (Looker, Tableau, or similar)
- Strong communication skills for presenting findings',
  'https://example.com/globex/jobs/data-analyst',
  now() - interval '7 days'
);

-- Jobs for Initech (3 jobs)
INSERT INTO jobs (job_key, snapshot_id, company_id, title, department_tag, department_raw, location, salary_raw, description, job_url, first_seen_at) VALUES
(
  'initech-ops-001',
  'aaaa3333-0000-0000-0000-000000000003',
  '33333333-3333-3333-3333-333333333333',
  'Operations Manager',
  'Operations',
  'Business Operations',
  'Austin, TX',
  '$110,000 - $140,000',
  '## Operations Manager

Initech is hiring an **Operations Manager** to streamline our internal processes.

### Responsibilities

- Oversee day-to-day business operations
- Identify process improvements and implement automation
- Manage vendor relationships and contracts
- Report on operational KPIs to leadership

### Requirements

- 5+ years of operations experience in a tech company
- Strong project management skills
- Experience with workflow automation tools
- Ability to work cross-functionally',
  'https://example.com/initech/jobs/ops-mgr',
  now() - interval '3 days'
),
(
  'initech-cs-001',
  'aaaa3333-0000-0000-0000-000000000003',
  '33333333-3333-3333-3333-333333333333',
  'Customer Success Manager',
  'Customer Success',
  'Customer Success',
  NULL,
  NULL,
  '## Customer Success Manager

Join Initech as a **Customer Success Manager** to ensure our customers achieve their goals.

### What You Will Do

- Onboard new customers and drive product adoption
- Build strong relationships with key stakeholders
- Monitor customer health metrics and proactively address risks
- Identify upsell and expansion opportunities

### Qualifications

- 3+ years of customer success or account management experience
- Experience with SaaS platforms
- Strong empathy and relationship-building skills
- Comfortable using data to drive decisions',
  'https://example.com/initech/jobs/csm',
  now() - interval '8 days'
),
(
  'initech-swe-001',
  'aaaa3333-0000-0000-0000-000000000003',
  '33333333-3333-3333-3333-333333333333',
  'Full-Stack Engineer',
  'Engineering',
  'Engineering',
  'Austin, TX',
  '$150,000 - $190,000',
  '## Full-Stack Engineer

Initech is looking for a **Full-Stack Engineer** to build and ship product features end-to-end.

### Responsibilities

- Develop features across the frontend and backend
- Write clean, tested, and well-documented code
- Participate in code reviews and technical discussions
- Contribute to system design and architecture

### Requirements

- 4+ years of full-stack development experience
- Proficiency with React and Node.js
- Experience with relational databases
- Passion for building great user experiences',
  'https://example.com/initech/jobs/fullstack',
  now() - interval '1 day'
);
