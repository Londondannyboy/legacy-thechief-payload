import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const chiefOfStaffContent = {
  slug: 'executive-assistant-vs-chief-of-staff-key-differences',
  title: 'Executive Assistant vs Chief of Staff: Key Differences',
  meta: {
    title: 'Executive Assistant vs Chief of Staff: Key Differences | TheChief',
    description: 'Understand the key differences between an Executive Assistant and a Chief of Staff. Learn about responsibilities, skills, and career paths.',
    image: null
  },
  hero: {
    type: 'none'
  },
  layout: [
    {
      blockType: 'content',
      columns: [
        {
          size: 'full',
          richText: {
            root: {
              type: 'root',
              children: [
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ text: 'The Strategic Difference' }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'The most fundamental difference lies in the strategic nature of the roles. A Chief of Staff operates as a strategic partner to the executive, often participating in high-level decision-making, leading strategic initiatives, and representing the executive in critical meetings. They serve as a force multiplier, extending the executive\'s reach and capacity for strategic thinking.'
                  }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'An Executive Assistant, while invaluable, typically focuses on administrative excellence. They manage schedules, coordinate meetings, handle correspondence, and ensure the smooth operation of the executive\'s office. Their expertise lies in organizational efficiency and administrative mastery.'
                  }]
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ text: 'Scope of Responsibilities' }]
                },
                {
                  type: 'heading',
                  tag: 'h3',
                  children: [{ text: 'Chief of Staff Responsibilities:' }]
                },
                {
                  type: 'list',
                  listType: 'unordered',
                  children: [
                    { type: 'listitem', children: [{ text: 'Leading cross-functional initiatives and special projects' }] },
                    { type: 'listitem', children: [{ text: 'Facilitating executive team meetings and strategic planning sessions' }] },
                    { type: 'listitem', children: [{ text: 'Serving as a liaison between the executive and other departments' }] },
                    { type: 'listitem', children: [{ text: 'Analyzing business metrics and preparing strategic recommendations' }] },
                    { type: 'listitem', children: [{ text: 'Managing organizational change initiatives' }] },
                    { type: 'listitem', children: [{ text: 'Representing the executive in their absence' }] }
                  ]
                },
                {
                  type: 'heading',
                  tag: 'h3',
                  children: [{ text: 'Executive Assistant Responsibilities:' }]
                },
                {
                  type: 'list',
                  listType: 'unordered',
                  children: [
                    { type: 'listitem', children: [{ text: 'Managing complex calendars and scheduling' }] },
                    { type: 'listitem', children: [{ text: 'Coordinating travel arrangements and itineraries' }] },
                    { type: 'listitem', children: [{ text: 'Processing expense reports and administrative paperwork' }] },
                    { type: 'listitem', children: [{ text: 'Managing correspondence and communications' }] },
                    { type: 'listitem', children: [{ text: 'Organizing meetings and preparing materials' }] },
                    { type: 'listitem', children: [{ text: 'Maintaining filing systems and databases' }] }
                  ]
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ text: 'Decision-Making Authority' }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'Chiefs of Staff often have delegated decision-making authority in specific areas. They may approve budgets, make hiring decisions for certain roles, or greenlight projects within defined parameters. This authority enables them to act as a true extension of the executive.'
                  }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'Executive Assistants typically have decision-making authority limited to administrative matters - choosing meeting venues, managing office supplies, or coordinating logistics. While these decisions are important for operational efficiency, they don\'t directly impact business strategy.'
                  }]
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ text: 'Career Trajectories' }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'The Chief of Staff role is often a stepping stone to senior executive positions. Many Chiefs of Staff transition to roles such as COO, VP of Operations, or even CEO. The strategic exposure and cross-functional experience make them well-prepared for executive leadership.'
                  }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'Executive Assistants may advance to senior EA roles supporting C-suite executives, Office Manager positions, or transition to specialized administrative leadership roles. Some EAs do transition to Chief of Staff positions, leveraging their deep understanding of executive needs.'
                  }]
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ text: 'Compensation Differences' }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'Compensation reflects the strategic value and scope of responsibilities. Chiefs of Staff typically earn between $150,000 to $300,000+ in major markets, with some in tech companies or finance exceeding $400,000 with bonuses and equity.'
                  }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'Executive Assistants generally earn between $60,000 to $120,000, with senior EAs in major markets or supporting C-suite executives potentially earning up to $150,000.'
                  }]
                },
                {
                  type: 'heading',
                  tag: 'h2',
                  children: [{ text: 'Which Role Is Right for Your Organization?' }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'Consider a Chief of Staff when you need strategic leverage, someone to drive initiatives, and a partner in organizational leadership. This role makes sense for executives managing complex organizations, rapid growth, or transformation initiatives.'
                  }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'An Executive Assistant is ideal when you need exceptional administrative support, calendar management, and someone to handle the operational details that keep an executive\'s office running smoothly.'
                  }]
                },
                {
                  type: 'paragraph',
                  children: [{ 
                    text: 'Many successful executives employ both - leveraging the EA for administrative excellence and the Chief of Staff for strategic partnership. This combination allows the executive to focus on the highest-value activities while ensuring both operational and strategic needs are met.'
                  }]
                }
              ]
            }
          }
        }
      ]
    }
  ],
  publishedAt: new Date().toISOString()
}

async function migrateContent() {
  const payload = await getPayload({ config })

  try {
    console.log('Starting content migration...')
    
    // Create main article page
    const page = await payload.create({
      collection: 'pages',
      data: chiefOfStaffContent
    })
    
    console.log(`✓ Created page: ${page.title}`)
    
    // Create a blog post version as well
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: chiefOfStaffContent.title,
        slug: chiefOfStaffContent.slug,
        content: chiefOfStaffContent.layout[0].columns[0].richText,
        meta: chiefOfStaffContent.meta,
        publishedAt: chiefOfStaffContent.publishedAt,
        authors: [],
        categories: []
      }
    })
    
    console.log(`✓ Created post: ${post.title}`)
    
    // Update header navigation
    const header = await payload.findGlobal({
      slug: 'header'
    })
    
    await payload.updateGlobal({
      slug: 'header',
      data: {
        ...header,
        navItems: [
          {
            link: {
              type: 'reference',
              label: 'Home',
              reference: {
                relationTo: 'pages',
                value: null
              },
              url: '/'
            }
          },
          {
            link: {
              type: 'reference',
              label: 'EA vs Chief of Staff',
              reference: {
                relationTo: 'pages',
                value: page.id
              }
            }
          },
          {
            link: {
              type: 'reference',
              label: 'Blog',
              reference: {
                relationTo: 'pages',
                value: null
              },
              url: '/posts'
            }
          }
        ]
      }
    })
    
    console.log('✓ Updated header navigation')
    
    console.log('\n✅ Migration completed successfully!')
    console.log(`View your content at: http://localhost:3002/${chiefOfStaffContent.slug}`)
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
  
  process.exit(0)
}

migrateContent()