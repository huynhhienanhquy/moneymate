import React from 'react';
import AppInput from '@/components/common/AppInput/AppInput';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  labelAction?: React.ReactNode;
}

/**
 * Render the auth field interface.
 *
 * Use it to keep the auth field workflow's presentation and interactions in one reusable UI boundary.
 * @param props - The properties that configure this React component.
 * @returns The rendered auth field interface.
 */
const AuthField = ({ label, icon, trailing, labelAction, ...inputProps }: AuthFieldProps) => (
  <AppInput {...inputProps} label={label} labelAction={labelAction} leading={icon} trailing={trailing} variant="auth" />
);

export default AuthField;
