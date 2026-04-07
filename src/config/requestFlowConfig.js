// Request flow configuration - controls which request flows are available
// This allows enabling/disabling each flow independently
// Later, this can be driven by admin settings/database

export const REQUEST_FLOWS = {
  agent: {
    enabled: true,
    name: 'AI-Assisted Request',
    description: 'Let our AI assistant guide you through the process',
    icon: 'Bot', // lucide icon name
    color: 'hsl(var(--primary))',
  },
  manual: {
    enabled: true,
    name: 'Manual Entry',
    description: 'Fill in the details manually yourself',
    icon: 'FileText', // lucide icon name
    color: '#fb923c',
  },
}

// Get only enabled flows
export const getEnabledFlows = () => {
  return Object.entries(REQUEST_FLOWS)
    .filter(([_, config]) => config.enabled)
    .map(([key, config]) => ({ id: key, ...config }))
}

// Check if specific flow is enabled
export const isFlowEnabled = (flowId) => {
  return REQUEST_FLOWS[flowId]?.enabled || false
}
