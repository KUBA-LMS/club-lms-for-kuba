import React from 'react';
import { View, TextInput, StyleSheet, Platform, Pressable, TextInput as RNTextInput } from 'react-native';
import { SearchIcon } from '../icons';
import { colors } from '../../constants';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onTap?: () => void;
  inputRef?: React.RefObject<RNTextInput | null>;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  onTap,
  inputRef,
  placeholder = 'Search Event or Provider'
}: SearchBarProps) {
  return (
    <Pressable style={styles.container} onPress={onTap}>
      <View style={styles.iconWrapper}>
        <SearchIcon size={20} color={colors.gray900} />
      </View>
      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.text.secondary}
        returnKeyType="search"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrapper: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'NotoSansKR-Regular',
    fontSize: 16,
    color: colors.text.primary,
    padding: 0,
  },
});
