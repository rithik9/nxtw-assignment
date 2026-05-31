import React from 'react';

export default function Button({ label, onClick, variant = 'primary', disabled = false, type = 'button', style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      style={style}
    >
      {label}
    </button>
  );
}
