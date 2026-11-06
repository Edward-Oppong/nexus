import React from 'react';
import { useTheme, ThemeMode } from '../../app/providers/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  collapsed?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ collapsed = false }) => {
  const { themeMode, resolvedTheme, setThemeMode } = useTheme();

  if (collapsed) {
    return (
      <button
        onClick={() => setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
        title={`Current: ${themeMode} (${resolvedTheme}). Click to toggle.`}
        aria-label="Toggle light/dark theme"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-subtle)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--bg-subtle)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        {resolvedTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    );
  }

  const options: Array<{ mode: ThemeMode; label: string; icon: React.ReactNode }> = [
    { mode: 'light', label: 'Light', icon: <Sun size={13} /> },
    { mode: 'dark', label: 'Dark', icon: <Moon size={13} /> },
    { mode: 'system', label: 'Auto', icon: <Monitor size={13} /> },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '3px',
        borderRadius: '8px',
        backgroundColor: 'var(--bg-subtle)',
        border: '1px solid var(--border-subtle)',
        gap: '2px',
        width: '100%',
      }}
      role="group"
      aria-label="Theme mode selector"
    >
      {options.map(({ mode, label, icon }) => {
        const isSelected = themeMode === mode;
        return (
          <button
            key={mode}
            onClick={() => setThemeMode(mode)}
            aria-pressed={isSelected}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              padding: '5px 8px',
              borderRadius: '6px',
              border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
              background: isSelected ? 'var(--bg-surface)' : 'transparent',
              color: isSelected ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: isSelected ? 600 : 500,
              boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

