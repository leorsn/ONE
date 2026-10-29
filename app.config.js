const personalDeviceTest = process.env.NEVER_LOCAL_DEVICE_TEST === '1';
const targetSupabaseUrl = 'https://nywfoprcwbnsxybdqpma.supabase.co';
const targetPublishableKey = 'sb_publishable_FoG2PKUsPg55YaGoq_uSEg_ZPITmLaf';

function pluginName(entry) {
  return Array.isArray(entry) ? entry[0] : entry;
}

module.exports = ({ config }) => {
  // EAS profile env flags force the migration gate during config resolution,
  // even when an EAS environment overrides the defaults in project.ts.
  const releaseProfile = ['preview', 'partner-preview', 'production'].includes(process.env.EAS_BUILD_PROFILE);
  if (process.env.NEVER_REQUIRE_TARGET_SUPABASE === '1' || releaseProfile) {
    const suppliedUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    const suppliedKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
    if (suppliedUrl !== targetSupabaseUrl || suppliedKey !== targetPublishableKey) {
      throw new Error(
        'NEVER release blocked: EAS Supabase URL/publishable key must match the approved NEVER project. Review EAS preview/production environment variables before building.'
      );
    }
  }

  if (!personalDeviceTest) {
    return config;
  }

  // Personal Apple Development teams cannot sign the Push Notifications or
  // App Groups capabilities used by NEVER's production iOS configuration.
  // For local physical-device UI/UX testing only, omit the config plugins that
  // generate those entitlements. The packages remain installed and the normal
  // configuration is unchanged when NEVER_LOCAL_DEVICE_TEST is not set.
  const plugins = (config.plugins || []).filter((entry) => {
    const name = pluginName(entry);
    return name !== 'expo-notifications' && name !== 'expo-sharing';
  });

  return {
    ...config,
    plugins,
    extra: {
      ...(config.extra || {}),
      personalDeviceTest: true,
    },
  };
};
