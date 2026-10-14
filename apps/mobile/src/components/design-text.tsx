import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
} from 'react-native';

const families: Record<string, string> = {
  '400': 'BeVietnamPro-Regular',
  '500': 'BeVietnamPro-Medium',
  '600': 'BeVietnamPro-SemiBold',
  '700': 'BeVietnamPro-Bold',
  '800': 'BeVietnamPro-ExtraBold',
  '900': 'BeVietnamPro-ExtraBold',
  bold: 'BeVietnamPro-Bold',
  normal: 'BeVietnamPro-Regular',
};

export function Text({ style, children, ...props }: TextProps) {
  const flat = StyleSheet.flatten(style);
  const amount =
    typeof children === 'string' &&
    (flat?.fontSize || 0) >= 22 &&
    /^[+−\-\d.\s]+[đ₫]$/.test(children.trim());
  return (
    <NativeText
      {...props}
      style={[
        style,
        {
          fontFamily:
            families[String(flat?.fontWeight || '400')] || families['400'],
          fontWeight: 'normal',
        },
      ]}
    >
      {amount ? (
        <>
          {children.slice(0, -1)}
          <NativeText
            style={{ fontSize: Math.round((flat?.fontSize || 22) * 0.6) }}
          >
            {children.slice(-1)}
          </NativeText>
        </>
      ) : (
        children
      )}
    </NativeText>
  );
}

export function TextInput({ style, ...props }: TextInputProps) {
  const flat = StyleSheet.flatten(style);
  return (
    <NativeTextInput
      {...props}
      style={[
        style,
        {
          fontFamily:
            families[String(flat?.fontWeight || '400')] || families['400'],
          fontWeight: 'normal',
        },
      ]}
    />
  );
}
