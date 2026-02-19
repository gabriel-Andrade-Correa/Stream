import { Linking } from 'react-native';
import { DeepLinkOption } from '../types';

export async function openStreamingLink(option: DeepLinkOption) {
  const canOpen = await Linking.canOpenURL(option.app);
  if (canOpen) {
    return Linking.openURL(option.app);
  }

  return Linking.openURL(option.web);
}
