import { Linking } from 'react-native';
import { DeepLinkOption } from '../types';

export async function openStreamingSearch(option: DeepLinkOption) {
  const canOpen = await Linking.canOpenURL(option.app);
  if (canOpen) {
    return Linking.openURL(option.app);
  }

  return Linking.openURL(option.web);
}

export async function openStreamingTitle(option: DeepLinkOption) {
  if (option.directApp) {
    const canOpenDirect = await Linking.canOpenURL(option.directApp);
    if (canOpenDirect) {
      return Linking.openURL(option.directApp);
    }
  }

  if (option.directWeb) {
    return Linking.openURL(option.directWeb);
  }

  return openStreamingSearch(option);
}
