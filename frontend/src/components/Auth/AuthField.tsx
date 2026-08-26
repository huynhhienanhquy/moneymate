import React from 'react';

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  labelAction?: React.ReactNode;
}

const AuthField = ({ label, icon, trailing, labelAction, ...inputProps }: AuthFieldProps) => (
  <label className="auth-field" htmlFor={inputProps.id}>
    <span className="auth-label-row"><span>{label}</span>{labelAction}</span>
    <span className="auth-input-wrap">{icon}<input {...inputProps} />{trailing}</span>
  </label>
);

export default AuthField;
