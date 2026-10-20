import { Text, type TextProps } from 'react-native';

import { contentTextStyle } from '@/lib/rtl';
import { theme } from '@/theme';

/** Text for trip content (names, notes). Direction follows the string itself, not the English UI. */
export function ContentText({ children, style, ...rest }: TextProps & { children: string | null | undefined }) {
  return (
    <Text
      style={[
        { color: theme.colors.text, fontSize: theme.font.size.md, fontFamily: theme.font.regular },
        contentTextStyle(children),
        style,
      ]}
      {...rest}>
      {children}
    </Text>
  );
}
