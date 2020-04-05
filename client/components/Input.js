import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

const Input = React.forwardRef(({ label, style, ...rest }, ref) => {
  return (
    <View style={[style, styles.container]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...rest} ref={ref} />
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  container: {
    fontSize: 17,
  },
  label: {
    fontFamily: 'Fugaz-One',
    color: '#F38BA6',
    paddingLeft: 16,
    paddingRight: 16,
  },
  input: {
    fontFamily: 'Work-Sans',
    borderRadius: 50,
    borderColor: '#F38BA6',
    borderStyle: 'solid',
    borderWidth: 1,
    height: 42,
    paddingLeft: 16,
    paddingRight: 16,
  },
});
