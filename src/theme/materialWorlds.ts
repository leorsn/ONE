import type { ImageSourcePropType } from 'react-native';
import type { ThemeId } from './editions';

/** Storage IDs remain stable; displayed names reflect the approved six worlds. */
export const materialWorldAssets: Record<ThemeId, ImageSourcePropType> = {
  platinum: require('../../assets/material-worlds/platinum.png'),
  monolith: require('../../assets/material-worlds/monolith.png'),
  archive: require('../../assets/material-worlds/archive.png'),
  aurora: require('../../assets/material-worlds/aurora.png'),
  tactile: require('../../assets/material-worlds/canyon.png'),
  orbit: require('../../assets/material-worlds/tidal.png')
};
