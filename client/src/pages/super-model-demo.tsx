import { SuperModelDemo } from '@/components/ai-router/super-model-demo';

export default function SuperModelDemoPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Super Model AI</h1>
        <p className="text-muted-foreground">
          Combine Grok 3, Claude 3.5 Sonnet, and GPT-4o for enhanced AI capabilities with intelligent fusion strategies
        </p>
      </div>
      
      <SuperModelDemo />
    </div>
  );
}