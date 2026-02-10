export const DATA_MODE = 'SIMULATION';

export const isSimulationMode = () => {
  return DATA_MODE === 'SIMULATION';
};

export const getDataModeConfig = () => {
  return {
    mode: DATA_MODE,
    isSimulation: true,
    requiresSecrets: false,
    externalAPIs: false,
    description: 'Pure simulation mode - No external API calls, No secrets required'
  };
};

console.log('🔒 [DATA MODE] SIMULATION MODE ENABLED (Hardcoded)');
console.log('📋 [DATA MODE] Config:', getDataModeConfig());
