const targetSupabaseUrl = 'https://nywfoprcwbnsxybdqpma.supabase.co';
const targetPublishableKey = 'sb_publishable_FoG2PKUsPg55YaGoq_uSEg_ZPITmLaf';

function pluginName(entry) {
  return Array.isArray(entry) ? entry[0] : entry;
}

module.exports = ({ config }) => {
  const personalDeviceTest = process.env.NEVER_LOCAL_DEVICE_TEST === '1';
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

  // Local iPhone testing needs no Expo/EAS account. The built-in public defaults
  // are valid here, but an inherited shell .env must never silently send a
  // test account or attachment to the retired ONE or KENTON backend.
  if (personalDeviceTest) {
    const localUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
    const localKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
    if ((localUrl && localUrl !== targetSupabaseUrl) ||
        (localKey && localKey !== targetPublishableKey)) {
      throw new Error(
        'NEVER local device test blocked: Supabase environment overrides do not match the approved NEVER project.'
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
