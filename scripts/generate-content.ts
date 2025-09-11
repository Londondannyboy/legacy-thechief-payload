import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Chief of Staff content topics
const contentTopics = [
  {
    title: 'How to Become a Chief of Staff: Complete Career Guide',
    slug: 'how-to-become-chief-of-staff-career-guide',
    description: 'A comprehensive guide on the path to becoming a Chief of Staff, including required skills, experience, and career progression strategies.',
    keywords: ['career path', 'skills', 'experience', 'qualification']
  },
  {
    title: 'Chief of Staff Salary Guide: What to Expect in 2024',
    slug: 'chief-of-staff-salary-guide-2024',
    description: 'Detailed salary benchmarks for Chief of Staff roles across industries, company sizes, and geographic locations.',
    keywords: ['salary', 'compensation', 'benefits', 'negotiation']
  },
  {
    title: 'Day in the Life of a Chief of Staff',
    slug: 'day-in-life-chief-of-staff',
    description: 'A detailed look at the daily responsibilities, challenges, and rewards of being a Chief of Staff.',
    keywords: ['daily tasks', 'responsibilities', 'workflow', 'time management']
  },
  {
    title: 'Chief of Staff vs COO: Understanding the Differences',
    slug: 'chief-of-staff-vs-coo-differences',
    description: 'Clear comparison between Chief of Staff and Chief Operating Officer roles, responsibilities, and career trajectories.',
    keywords: ['COO', 'comparison', 'operations', 'leadership']
  },
  {
    title: 'Building Executive Relationships as Chief of Staff',
    slug: 'building-executive-relationships-chief-of-staff',
    description: 'Strategies for developing strong working relationships with CEOs and executive teams.',
    keywords: ['relationship building', 'executive partnership', 'trust', 'communication']
  },
  {
    title: 'Chief of Staff Interview Questions and Answers',
    slug: 'chief-of-staff-interview-questions',
    description: 'Common interview questions for Chief of Staff positions and how to answer them effectively.',
    keywords: ['interview', 'questions', 'preparation', 'hiring']
  },
  {
    title: 'The Strategic Role of a Chief of Staff in Startups',
    slug: 'chief-of-staff-role-startups',
    description: 'How Chiefs of Staff drive growth and operational excellence in startup environments.',
    keywords: ['startup', 'growth', 'scale', 'entrepreneurship']
  },
  {
    title: 'Essential Tools and Software for Chiefs of Staff',
    slug: 'essential-tools-software-chief-of-staff',
    description: 'The technology stack and tools that make Chiefs of Staff more effective.',
    keywords: ['tools', 'software', 'productivity', 'technology']
  },
  {
    title: 'Managing Cross-Functional Teams as Chief of Staff',
    slug: 'managing-cross-functional-teams',
    description: 'Best practices for leading and coordinating teams across different departments.',
    keywords: ['team management', 'leadership', 'coordination', 'collaboration']
  },
  {
    title: 'Chief of Staff Career Transitions: What Comes Next',
    slug: 'chief-of-staff-career-transitions',
    description: 'Common career paths and opportunities after serving as a Chief of Staff.',
    keywords: ['career progression', 'next role', 'transitions', 'opportunities']
  }
]

// Generate detailed content for each topic
function generateDetailedContent(topic: typeof contentTopics[0]) {
  const content = {
    introduction: `The role of Chief of Staff has become increasingly vital in modern organizations. ${topic.description} This comprehensive guide will provide you with actionable insights and practical strategies.`,
    
    sections: [
      {
        heading: 'Understanding the Fundamentals',
        content: `When exploring ${topic.title.toLowerCase()}, it's essential to start with a solid foundation. The Chief of Staff role has evolved significantly over the past decade, becoming a critical position in organizations ranging from startups to Fortune 500 companies. This evolution reflects the increasing complexity of modern business and the need for strategic coordination at the highest levels.`
      },
      {
        heading: 'Key Considerations',
        content: `Several factors make this topic particularly relevant for aspiring and current Chiefs of Staff. ${topic.keywords.map(k => `Understanding ${k}`).join(', ')} are all crucial elements that contribute to success in this role. Each of these areas requires careful attention and continuous development.`
      },
      {
        heading: 'Practical Applications',
        content: `The practical implications of ${topic.title.toLowerCase()} extend beyond theoretical knowledge. Successful Chiefs of Staff must be able to translate concepts into action, driving real organizational change and delivering measurable results. This requires a combination of strategic thinking, operational excellence, and exceptional interpersonal skills.`
      },
      {
        heading: 'Industry Insights',
        content: `Different industries approach the Chief of Staff role in unique ways. Technology companies often emphasize agility and innovation, while traditional corporations may focus more on process optimization and stakeholder management. Understanding these nuances is crucial for tailoring your approach to your specific organizational context.`
      },
      {
        heading: 'Best Practices and Recommendations',
        content: `Based on extensive research and interviews with successful Chiefs of Staff, several best practices emerge. First, establish clear communication channels with all stakeholders. Second, develop robust systems for tracking and measuring progress. Third, maintain flexibility while ensuring consistency in execution. These practices form the foundation of effective Chief of Staff leadership.`
      },
      {
        heading: 'Common Challenges and Solutions',
        content: `Every Chief of Staff faces challenges, from managing competing priorities to navigating organizational politics. The key is to approach these challenges systematically, leveraging data-driven decision-making while maintaining strong relationships across the organization. Building resilience and adaptability are essential for long-term success.`
      },
      {
        heading: 'Future Outlook',
        content: `The Chief of Staff role continues to evolve with changing business dynamics. Emerging trends include increased focus on digital transformation, greater emphasis on diversity and inclusion, and the integration of AI and automation tools. Staying ahead of these trends positions Chiefs of Staff as invaluable strategic partners.`
      },
      {
        heading: 'Conclusion',
        content: `Mastering ${topic.title.toLowerCase()} is a journey that requires continuous learning and adaptation. By focusing on the fundamentals while remaining open to innovation, Chiefs of Staff can drive significant organizational impact. The insights shared in this guide provide a roadmap for excellence in this dynamic and rewarding role.`
      }
    ]
  }
  
  return content
}

// Convert content to Payload rich text format
function createRichTextContent(content: ReturnType<typeof generateDetailedContent>) {
  const children = [
    {
      type: 'paragraph',
      children: [{ text: content.introduction }]
    }
  ]
  
  // Add each section
  content.sections.forEach(section => {
    children.push(
      {
        type: 'heading',
        tag: 'h2' as const,
        children: [{ text: section.heading }]
      } as any,
      {
        type: 'paragraph',
        children: [{ text: section.content }]
      }
    )
  })
  
  return {
    root: {
      type: 'root',
      children,
      direction: null,
      format: '',
      indent: 0,
      version: 1
    }
  } as any
}

async function generateContent() {
  const payload = await getPayload({ config })
  
  console.log('🚀 Starting content generation...\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (const topic of contentTopics) {
    try {
      console.log(`📝 Generating: ${topic.title}`)
      
      const detailedContent = generateDetailedContent(topic)
      const richText = createRichTextContent(detailedContent)
      
      // Create the page
      const page = await payload.create({
        collection: 'pages',
        data: {
          title: topic.title,
          slug: topic.slug,
          hero: {
            type: 'none'
          },
          layout: [
            {
              blockType: 'content',
              columns: [
                {
                  size: 'full',
                  richText
                }
              ]
            }
          ],
          meta: {
            title: `${topic.title} | TheChief`,
            description: topic.description,
            image: null
          },
          publishedAt: new Date().toISOString()
        }
      })
      
      // Also create as a blog post
      const post = await payload.create({
        collection: 'posts',
        data: {
          title: topic.title,
          slug: topic.slug,
          content: richText,
          meta: {
            title: `${topic.title} | TheChief Blog`,
            description: topic.description,
            image: null
          },
          publishedAt: new Date().toISOString(),
          authors: [],
          categories: []
        }
      })
      
      console.log(`   ✅ Created page: /${page.slug}`)
      console.log(`   ✅ Created post: /posts/${post.slug}`)
      successCount++
      
    } catch (error) {
      console.error(`   ❌ Error creating content for: ${topic.title}`)
      console.error(`      ${error.message}`)
      errorCount++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 Content Generation Complete!')
  console.log('='.repeat(50))
  console.log(`✅ Successfully created: ${successCount * 2} items (${successCount} pages, ${successCount} posts)`)
  if (errorCount > 0) {
    console.log(`❌ Errors encountered: ${errorCount}`)
  }
  console.log('\n🌐 View your content at:')
  console.log('   Local: http://localhost:3002')
  console.log('   Production: https://thechief.quest')
  console.log('   Admin: https://thechief.quest/admin')
  
  process.exit(0)
}

// Run the generation
generateContent().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})