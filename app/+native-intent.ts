import { recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import { resolveOneNativePath } from '@/src/native/deepLinks';

export async function redirectSystemPath({
  path,
  initial
}: {
  path: string;
  initial: boolean;
}) {
  const resolution = resolveOneNativePath(path);

  if (resolution.kind === 'share') {
    await recordNativeAcceptanceEvent('share_intent', initial ? 'cold-start' : 'warm-start');
  } else if (
    resolution.kind === 'auth_callback' ||
    resolution.kind === 'password_reset' ||
    resolution.kind === 'acceptance'
  ) {
    await recordNativeAcceptanceEvent('deep_link_received', `${resolution.kind}:${initial ? 'cold-start' : 'warm-start'}`);
  }

  return resolution.route;
}
