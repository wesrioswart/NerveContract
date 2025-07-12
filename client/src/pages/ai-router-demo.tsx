import { MultiModelDemo } from '@/components/ai-router/multi-model-demo';

export default function AIRouterDemoPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Multi-Model AI Router</h1>
        <p className="text-muted-foreground">
          Intelligent routing between Grok 3, Claude 3.5 Sonnet, and GPT-4o based on task requirements
        </p>
      </div>
      
      <MultiModelDemo />
    </div>
  );
}