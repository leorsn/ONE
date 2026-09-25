const baseExpo = require('./app.json').expo;

const personalDeviceTest = process.env.NEVER_LOCAL_DEVICE_TEST === '1';

function pluginName(entry) {
  return Array.isArray(entry) ? entry[0] : entry;
}

module.exports = () => {
  if (!personalDeviceTest) {
    return baseExpo;
  }

  // Personal Apple Development teams cannot sign the Push Notifications or
  // App Groups capabilities used by NEVER's production iOS configuration.
  // For local physical-device UI/UX testing only, omit the config plugins that
  // generate those entitlements. The packages remain installed and the normal
  // configuration is unchanged when NEVER_LOCAL_DEVICE_TEST is not set.
  const plugins = (baseExpo.plugins || []).filter((entry) => {
    const name = pluginName(entry);
    return name !== 'expo-notifications' && name !== 'expo-sharing';
  });

  return {
    ...baseExpo,
    plugins,
    extra: {
      ...(baseExpo.extra || {}),
      personalDeviceTest: true,
    },
  };
};
