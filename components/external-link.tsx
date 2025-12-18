import { Href, Link } from 'expo-router';
import { Linking, Platform } from 'react-native';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
       {/* Check if on a native platform (Android/iOS) AND not in the Web environment.*/}
        if (Platform.OS !== 'web') {
          {/* Prevent Expo Router's default linking behavior */}
          event.preventDefault();

          {/* CRASH FIX: Use safer Linking.openURL instead of expo-web-browser --- */}
          try {
            const supported = await Linking.canOpenURL(href);
            if (supported) {
              await Linking.openURL(href);
            } else {
              console.error(`Don't know how to open URL: ${href}`);
            }
          } catch (error) {
            console.error('Failed to open URL using Linking:', error);
          }
         {/* ----------------------------------------------------------------------- */}
        }
      }}
    />
  );
}
