import React from 'react';
import AppInput from '@/components/common/AppInput/AppInput';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  labelAction?: React.ReactNode;
}

const AuthField = ({ label, icon, trailing, labelAction, ...inputProps }: AuthFieldProps) => (
  <AppInput {...inputProps} label={label} labelAction={labelAction} leading={icon} trailing={trailing} variant="auth" />
);

export default AuthField;
