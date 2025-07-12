import { GrokTestSuite } from '@/components/grok-test/grok-test-suite';

export default function GrokTestSuitePage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Grok AI Testing Suite</h1>
        <p className="text-muted-foreground">
          Comprehensive testing of Grok's advanced code analysis, reasoning, and logic capabilities
        </p>
      </div>
      
      <GrokTestSuite />
    </div>
  );
}