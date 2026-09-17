const fs = require('fs');
const path = require('path');
const { IOSConfig, withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const WORDMARK_ICON_NAME = 'NeverWordmark';
const WORDMARK_ICON_SOURCE = path.join('assets', 'icons', 'never-wordmark.png');

function withNeverAppIcons(config) {
  config = withXcodeProject(config, (config) => {
    const projectName = config.modRequest.projectName;
    if (!projectName) return config;

    const { target } = IOSConfig.XcodeUtils.getApplicationNativeTarget({
      project: config.modResults,
      projectName,
    });
    const configurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      config.modResults,
      target.buildConfigurationList
    );

    for (const [, buildConfig] of configurations) {
      const buildSettings = buildConfig.buildSettings || {};
      const current = parseBuildSettingList(
        buildSettings.ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES
      );
      const iconNames = [...new Set([...current, WORDMARK_ICON_NAME])].join(' ');

      buildSettings.ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = `"${iconNames}"`;
      buildSettings.ASSETCATALOG_COMPILER_INCLUDE_ALL_APPICON_ASSETS = 'YES';
      buildConfig.buildSettings = buildSettings;
    }

    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
      const source = path.join(projectRoot, WORDMARK_ICON_SOURCE);

      if (!fs.existsSync(source)) {
        throw new Error(`Missing NEVER alternate icon asset: ${WORDMARK_ICON_SOURCE}`);
      }

      const assetRoot = path.join(projectRoot, 'ios', projectName, 'Images.xcassets');
      const appIconSetPath = path.join(assetRoot, `${WORDMARK_ICON_NAME}.appiconset`);
      const filename = `${WORDMARK_ICON_NAME}-1024.png`;

      await fs.promises.rm(appIconSetPath, { recursive: true, force: true });
      await fs.promises.mkdir(appIconSetPath, { recursive: true });
      await fs.promises.copyFile(source, path.join(appIconSetPath, filename));
      await fs.promises.writeFile(
        path.join(appIconSetPath, 'Contents.json'),
        JSON.stringify(
          {
            images: [
              {
                filename,
                idiom: 'universal',
                platform: 'ios',
                size: '1024x1024',
              },
            ],
            info: { author: 'xcode', version: 1 },
          },
          null,
          2
        )
      );

      return config;
    },
  ]);

  return config;
}

function parseBuildSettingList(value) {
  if (!value || typeof value !== 'string') return [];
  return value
    .replace(/[()"']/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = withNeverAppIcons;
