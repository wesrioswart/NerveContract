/**
 * Grok Code Reviewer - Comprehensive codebase analysis using xAI's Grok
 */

import OpenAI from "openai";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const xai = new OpenAI({
  baseURL: "https://api.x.ai/v1",
  apiKey: process.env.XAI_API_KEY,
});

interface CodeFile {
  path: string;
  content: string;
  type: string;
  size: number;
}

interface CodeReview {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  technicalDebt: string[];
  securityConcerns: string[];
  performanceIssues: string[];
  architecturalAssessment: string;
  codeQuality: {
    maintainability: number;
    scalability: number;
    testability: number;
    documentation: number;
  };
}

export class GrokCodeReviewer {
  private codeFiles: CodeFile[] = [];
  private maxFileSize = 50000; // 50KB per file
  private totalCodeSize = 0;
  private maxTotalSize = 500000; // 500KB total

  /**
   * Scan and collect all relevant code files
   */
  async scanCodebase(rootPath: string): Promise<void> {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md'];
    const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'tmp', 'uploads'];
    
    this.scanDirectory(rootPath, extensions, excludeDirs);
    console.log(`📁 Scanned ${this.codeFiles.length} files (${Math.round(this.totalCodeSize / 1024)}KB)`);
  }

  private scanDirectory(dirPath: string, extensions: string[], excludeDirs: string[]): void {
    if (this.totalCodeSize > this.maxTotalSize) return;

    try {
      const items = readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = join(dirPath, item);
        const stat = statSync(itemPath);
        
        if (stat.isDirectory()) {
          if (!excludeDirs.includes(item) && !item.startsWith('.')) {
            this.scanDirectory(itemPath, extensions, excludeDirs);
          }
        } else if (stat.isFile()) {
          const ext = item.substring(item.lastIndexOf('.'));
          if (extensions.includes(ext) && stat.size < this.maxFileSize) {
            try {
              const content = readFileSync(itemPath, 'utf8');
              this.codeFiles.push({
                path: itemPath.replace(process.cwd(), ''),
                content,
                type: ext,
                size: stat.size
              });
              this.totalCodeSize += stat.size;
            } catch (error) {
              console.warn(`⚠️  Could not read file: ${itemPath}`);
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan directory: ${dirPath}`);
    }
  }

  /**
   * Analyze the complete codebase with Grok
   */
  async analyzeCodebase(): Promise<CodeReview> {
    console.log('🧠 Starting comprehensive code review with Grok...');
    
    // Group files by type for better analysis
    const fileGroups = this.groupFilesByType();
    
    // Analyze each group
    const analyses = await Promise.all([
      this.analyzeAIAgents(fileGroups.agents),
      this.analyzeFrontend(fileGroups.frontend),
      this.analyzeBackend(fileGroups.backend),
      this.analyzeDatabase(fileGroups.database),
      this.analyzeConfiguration(fileGroups.config),
      this.analyzeDocumentation(fileGroups.docs)
    ]);

    // Synthesize overall review
    const overallReview = await this.synthesizeOverallReview(analyses);
    
    console.log('✅ Code review completed');
    return overallReview;
  }

  private groupFilesByType(): Record<string, CodeFile[]> {
    return {
      agents: this.codeFiles.filter(f => f.path.includes('workflows')),
      frontend: this.codeFiles.filter(f => f.path.includes('client') || f.path.includes('components')),
      backend: this.codeFiles.filter(f => f.path.includes('server') && !f.path.includes('workflows')),
      database: this.codeFiles.filter(f => f.path.includes('schema') || f.path.includes('migration')),
      config: this.codeFiles.filter(f => f.type === '.json' || f.path.includes('config')),
      docs: this.codeFiles.filter(f => f.type === '.md')
    };
  }

  private async analyzeAIAgents(agentFiles: CodeFile[]): Promise<any> {
    if (agentFiles.length === 0) return null;

    const agentCode = agentFiles.map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a senior software architect reviewing AI agent implementations. 
          Analyze the code for: agent coordination, AI integration quality, error handling, 
          scalability, and business logic implementation. Focus on contract management domain expertise.`
        },
        {
          role: "user",
          content: `Analyze these NEC4 Contract Management AI agents:\n\n${agentCode.substring(0, 30000)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    return {
      category: 'AI Agents',
      analysis: response.choices[0].message.content,
      fileCount: agentFiles.length
    };
  }

  private async analyzeFrontend(frontendFiles: CodeFile[]): Promise<any> {
    if (frontendFiles.length === 0) return null;

    const frontendCode = frontendFiles.slice(0, 10).map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a senior frontend architect reviewing React/TypeScript applications.
          Analyze for: component architecture, state management, performance, accessibility, 
          code organization, and user experience patterns.`
        },
        {
          role: "user",
          content: `Analyze this React/TypeScript frontend:\n\n${frontendCode.substring(0, 30000)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    return {
      category: 'Frontend',
      analysis: response.choices[0].message.content,
      fileCount: frontendFiles.length
    };
  }

  private async analyzeBackend(backendFiles: CodeFile[]): Promise<any> {
    if (backendFiles.length === 0) return null;

    const backendCode = backendFiles.slice(0, 10).map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a senior backend architect reviewing Node.js/Express applications.
          Analyze for: API design, security, performance, error handling, database integration,
          and scalability patterns.`
        },
        {
          role: "user",
          content: `Analyze this Express/TypeScript backend:\n\n${backendCode.substring(0, 30000)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    return {
      category: 'Backend',
      analysis: response.choices[0].message.content,
      fileCount: backendFiles.length
    };
  }

  private async analyzeDatabase(dbFiles: CodeFile[]): Promise<any> {
    if (dbFiles.length === 0) return null;

    const dbCode = dbFiles.map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a senior database architect reviewing database schemas and migrations.
          Analyze for: schema design, relationships, indexing, performance, data integrity,
          and migration patterns.`
        },
        {
          role: "user",
          content: `Analyze this database schema and migrations:\n\n${dbCode.substring(0, 30000)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    return {
      category: 'Database',
      analysis: response.choices[0].message.content,
      fileCount: dbFiles.length
    };
  }

  private async analyzeConfiguration(configFiles: CodeFile[]): Promise<any> {
    if (configFiles.length === 0) return null;

    const configCode = configFiles.map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a senior DevOps engineer reviewing project configuration.
          Analyze for: build setup, dependencies, environment configuration, security,
          and deployment readiness.`
        },
        {
          role: "user",
          content: `Analyze this project configuration:\n\n${configCode.substring(0, 20000)}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    });

    return {
      category: 'Configuration',
      analysis: response.choices[0].message.content,
      fileCount: configFiles.length
    };
  }

  private async analyzeDocumentation(docFiles: CodeFile[]): Promise<any> {
    if (docFiles.length === 0) return null;

    const docCode = docFiles.map(f => `// ${f.path}\n${f.content}`).join('\n\n');
    
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a technical documentation specialist reviewing project documentation.
          Analyze for: completeness, clarity, technical accuracy, onboarding experience,
          and maintenance guidelines.`
        },
        {
          role: "user",
          content: `Analyze this project documentation:\n\n${docCode.substring(0, 20000)}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.1
    });

    return {
      category: 'Documentation',
      analysis: response.choices[0].message.content,
      fileCount: docFiles.length
    };
  }

  private async synthesizeOverallReview(analyses: any[]): Promise<CodeReview> {
    const validAnalyses = analyses.filter(a => a !== null);
    const allAnalyses = validAnalyses.map(a => `${a.category}:\n${a.analysis}`).join('\n\n');
    
    const response = await xai.chat.completions.create({
      model: "grok-2-1212",
      messages: [
        {
          role: "system",
          content: `You are a senior software architect providing a comprehensive code review synthesis.
          Based on the detailed analyses, provide an overall assessment with specific scores and recommendations.
          Focus on: architecture quality, technical debt, security, performance, maintainability, and business value.
          
          Return a structured assessment covering:
          - Overall quality score (1-10)
          - Key strengths and weaknesses
          - Critical recommendations
          - Technical debt assessment
          - Security and performance concerns
          - Code quality metrics`
        },
        {
          role: "user",
          content: `Synthesize this NEC4 Contract Management Platform analysis:\n\n${allAnalyses}`
        }
      ],
      max_tokens: 3000,
      temperature: 0.1
    });

    const synthesis = response.choices[0].message.content;
    
    // Parse the synthesis into structured review
    return this.parseReviewSynthesis(synthesis);
  }

  private parseReviewSynthesis(synthesis: string): CodeReview {
    // Extract key metrics and recommendations from the synthesis
    // This is a simplified parsing - in production, you'd want more sophisticated parsing
    
    return {
      overallScore: this.extractScore(synthesis),
      strengths: this.extractList(synthesis, 'strengths'),
      weaknesses: this.extractList(synthesis, 'weaknesses'),
      recommendations: this.extractList(synthesis, 'recommendations'),
      technicalDebt: this.extractList(synthesis, 'technical debt'),
      securityConcerns: this.extractList(synthesis, 'security'),
      performanceIssues: this.extractList(synthesis, 'performance'),
      architecturalAssessment: synthesis,
      codeQuality: {
        maintainability: this.extractScore(synthesis, 'maintainability'),
        scalability: this.extractScore(synthesis, 'scalability'),
        testability: this.extractScore(synthesis, 'testability'),
        documentation: this.extractScore(synthesis, 'documentation')
      }
    };
  }

  private extractScore(text: string, category?: string): number {
    const patterns = [
      new RegExp(`${category}.*?([0-9](?:\.[0-9])?)/10`, 'i'),
      new RegExp(`${category}.*?([0-9](?:\.[0-9])?)`, 'i'),
      /overall.*?([0-9](?:\.[0-9])?)/i,
      /score.*?([0-9](?:\.[0-9])?)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const score = parseFloat(match[1]);
        return Math.min(Math.max(score, 0), 10);
      }
    }
    
    return 7; // Default score
  }

  private extractList(text: string, category: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    let inSection = false;
    
    for (const line of lines) {
      if (line.toLowerCase().includes(category.toLowerCase())) {
        inSection = true;
        continue;
      }
      
      if (inSection) {
        if (line.startsWith('- ') || line.startsWith('• ') || line.match(/^\d+\./)) {
          items.push(line.replace(/^[-•\d.\s]+/, '').trim());
        } else if (line.trim() === '' || line.toLowerCase().includes('recommendations') || 
                   line.toLowerCase().includes('assessment')) {
          inSection = false;
        }
      }
    }
    
    return items.slice(0, 5); // Limit to 5 items
  }

  /**
   * Generate a comprehensive review report
   */
  generateReport(review: CodeReview): string {
    return `
# 🧠 Grok Code Review Report - NEC4 Contract Management Platform

## Overall Assessment
**Score: ${review.overallScore}/10**

## 🎯 Key Strengths
${review.strengths.map(s => `- ${s}`).join('\n')}

## ⚠️ Areas for Improvement
${review.weaknesses.map(w => `- ${w}`).join('\n')}

## 📋 Priority Recommendations
${review.recommendations.map(r => `- ${r}`).join('\n')}

## 🔧 Technical Debt
${review.technicalDebt.map(t => `- ${t}`).join('\n')}

## 🔒 Security Concerns
${review.securityConcerns.map(s => `- ${s}`).join('\n')}

## ⚡ Performance Issues
${review.performanceIssues.map(p => `- ${p}`).join('\n')}

## 📊 Code Quality Metrics
- **Maintainability**: ${review.codeQuality.maintainability}/10
- **Scalability**: ${review.codeQuality.scalability}/10
- **Testability**: ${review.codeQuality.testability}/10
- **Documentation**: ${review.codeQuality.documentation}/10

## 🏗️ Architectural Assessment
${review.architecturalAssessment}

---
*Generated by Grok AI Code Reviewer*
`;
  }
}