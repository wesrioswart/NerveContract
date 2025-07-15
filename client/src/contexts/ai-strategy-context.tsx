import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ModelHealth {
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  lastCheck: Date;
  errorCount: number;
}

export interface ModelStrategy {
  preferredModels: string[];
  fusionStrategy: 'voting' | 'weighted' | 'sequential' | 'hybrid';
  cacheTimeout: number;
  requireConsensus: boolean;
}

export interface AIStrategyContextType {
  activeModels: ('claude' | 'grok' | 'gpt4o')[];
  fusionStrategy: 'voting' | 'weighted' | 'sequential' | 'hybrid';
  routeStrategies: Map<string, ModelStrategy>;
  modelHealth: {
    claude: ModelHealth;
    grok: ModelHealth;
    gpt4o: ModelHealth;
  };
  updateStrategy: (route: string, strategy: ModelStrategy) => void;
  getOptimalStrategy: (route: string) => ModelStrategy;
  trackModelPerformance: (model: string, duration: number, success: boolean) => void;
}

const defaultModelHealth: ModelHealth = {
  status: 'healthy',
  latency: 0,
  lastCheck: new Date(),
  errorCount: 0
};

const defaultRouteStrategies = new Map<string, ModelStrategy>([
  ['/compensation-events', {
    preferredModels: ['claude', 'grok'],
    fusionStrategy: 'weighted',
    cacheTimeout: 300000,
    requireConsensus: true
  }],
  ['/early-warnings', {
    preferredModels: ['grok', 'claude'],
    fusionStrategy: 'hybrid',
    cacheTimeout: 180000,
    requireConsensus: true
  }],
  ['/ai-assistant', {
    preferredModels: ['gpt4o', 'claude'],
    fusionStrategy: 'sequential',
    cacheTimeout: 60000,
    requireConsensus: false
  }],
  ['/super-model-demo', {
    preferredModels: ['claude', 'grok', 'gpt4o'],
    fusionStrategy: 'hybrid',
    cacheTimeout: 120000,
    requireConsensus: false
  }],
  ['/ai-reports', {
    preferredModels: ['gpt4o', 'claude'],
    fusionStrategy: 'sequential',
    cacheTimeout: 300000,
    requireConsensus: false
  }]
]);

const AIStrategyContext = createContext<AIStrategyContextType | undefined>(undefined);

export function AIStrategyProvider({ children }: { children: React.ReactNode }) {
  const [activeModels, setActiveModels] = useState<('claude' | 'grok' | 'gpt4o')[]>(['claude', 'grok', 'gpt4o']);
  const [fusionStrategy, setFusionStrategy] = useState<'voting' | 'weighted' | 'sequential' | 'hybrid'>('weighted');
  const [routeStrategies, setRouteStrategies] = useState<Map<string, ModelStrategy>>(defaultRouteStrategies);
  const [modelHealth, setModelHealth] = useState({
    claude: { ...defaultModelHealth },
    grok: { ...defaultModelHealth },
    gpt4o: { ...defaultModelHealth }
  });

  // Monitor model health
  useEffect(() => {
    const checkModelHealth = async () => {
      const healthChecks = await Promise.allSettled([
        checkModelStatus('claude'),
        checkModelStatus('grok'),
        checkModelStatus('gpt4o')
      ]);

      const newHealth = { ...modelHealth };
      
      healthChecks.forEach((result, index) => {
        const modelName = ['claude', 'grok', 'gpt4o'][index] as keyof typeof modelHealth;
        
        if (result.status === 'fulfilled') {
          newHealth[modelName] = {
            ...result.value,
            lastCheck: new Date()
          };
        } else {
          newHealth[modelName] = {
            ...defaultModelHealth,
            ...(modelHealth[modelName] || {}),
            status: 'down',
            errorCount: (modelHealth[modelName]?.errorCount || 0) + 1,
            lastCheck: new Date()
          };
        }
      });

      setModelHealth(newHealth);
      
      // Auto-adjust active models based on health
      const healthyModels = Object.entries(newHealth)
        .filter(([_, health]) => health.status === 'healthy')
        .map(([model, _]) => model as 'claude' | 'grok' | 'gpt4o');
      
      if (healthyModels.length > 0) {
        setActiveModels(healthyModels);
      }
    };

    // Initial check
    checkModelHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkModelHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkModelStatus = async (model: string): Promise<ModelHealth> => {
    const startTime = Date.now();
    
    try {
      // Simple health check - could be expanded to actual API calls
      const response = await fetch('/api/ai/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      
      const latency = Date.now() - startTime;
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        latency,
        lastCheck: new Date(),
        errorCount: 0
      };
    } catch (error) {
      return {
        status: 'down',
        latency: Date.now() - startTime,
        lastCheck: new Date(),
        errorCount: 1
      };
    }
  };

  const updateStrategy = (route: string, strategy: ModelStrategy) => {
    setRouteStrategies(prev => new Map(prev.set(route, strategy)));
  };

  const getOptimalStrategy = (route: string): ModelStrategy => {
    // Find the most specific route match
    const matchingRoute = Array.from(routeStrategies.keys())
      .filter(routePattern => route.includes(routePattern))
      .sort((a, b) => b.length - a.length)[0];
    
    if (matchingRoute) {
      const strategy = routeStrategies.get(matchingRoute)!;
      
      // Filter preferred models based on health
      const healthyPreferred = strategy.preferredModels.filter(model => 
        modelHealth[model as keyof typeof modelHealth]?.status === 'healthy'
      );
      
      return {
        ...strategy,
        preferredModels: healthyPreferred.length > 0 ? healthyPreferred : strategy.preferredModels
      };
    }
    
    // Default strategy
    return {
      preferredModels: activeModels,
      fusionStrategy: 'weighted',
      cacheTimeout: 120000,
      requireConsensus: false
    };
  };

  const trackModelPerformance = (model: string, duration: number, success: boolean) => {
    setModelHealth(prev => ({
      ...prev,
      [model]: {
        ...prev[model as keyof typeof prev],
        latency: duration,
        lastCheck: new Date(),
        errorCount: success ? Math.max(0, prev[model as keyof typeof prev].errorCount - 1) : prev[model as keyof typeof prev].errorCount + 1,
        status: success ? 
          (duration > 5000 ? 'degraded' : 'healthy') : 
          (prev[model as keyof typeof prev].errorCount > 3 ? 'down' : 'degraded')
      }
    }));
  };

  return (
    <AIStrategyContext.Provider value={{
      activeModels,
      fusionStrategy,
      routeStrategies,
      modelHealth,
      updateStrategy,
      getOptimalStrategy,
      trackModelPerformance
    }}>
      {children}
    </AIStrategyContext.Provider>
  );
}

export function useAIStrategy() {
  const context = useContext(AIStrategyContext);
  if (context === undefined) {
    throw new Error('useAIStrategy must be used within an AIStrategyProvider');
  }
  return context;
}