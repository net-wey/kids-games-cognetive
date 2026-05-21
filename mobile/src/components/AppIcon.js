import React from 'react';
import { Text } from 'react-native';

const ICONS = {
  add: '+',
  albums: '▦',
  'alert-circle': '!',
  'arrow-back': '‹',
  'at-outline': '@',
  bulb: '◉',
  'bulb-outline': '◎',
  calculator: '#',
  calendar: '□',
  'calendar-outline': '□',
  checkmark: '✓',
  'checkmark-circle': '✓',
  'chevron-forward': '›',
  close: '×',
  'close-circle': '×',
  contrast: '◐',
  cube: '▣',
  'cube-outline': '□',
  'eye-outline': '◉',
  footsteps: '↟',
  'game-controller': '▣',
  'game-controller-outline': '▢',
  grid: '▦',
  happy: '☺',
  heart: '♥',
  help: '?',
  home: '⌂',
  'home-outline': '⌂',
  'information-circle': 'i',
  'lock-closed-outline': '●',
  'log-out-outline': '↪',
  'mail-outline': '✉',
  move: '↕',
  people: '●●',
  'people-outline': '○○',
  person: '●',
  'person-add': '+●',
  'person-circle': '●',
  'person-outline': '○',
  refresh: '↻',
  school: '⌂',
  search: '⌕',
  shield: '◆',
  'shield-outline': '◇',
  star: '★',
  'stats-chart': '▥',
  'stats-chart-outline': '▤',
  time: '◷',
  trash: '⌧',
  'trash-outline': '⌧',
  'trending-up': '↗',
  trophy: '★',
  'trophy-outline': '☆',
  warning: '!',
};

const AppIcon = ({ name, size = 24, color = '#111', style }) => {
  const normalizedName = String(name || '');
  const symbol = ICONS[normalizedName] || ICONS[normalizedName.replace(/-outline$/, '')] || '•';
  const fontSize = Math.max(10, size);

  return (
    <Text
      accessibilityRole="image"
      accessibilityLabel={normalizedName}
      style={[
        {
          color,
          fontSize,
          lineHeight: fontSize,
          fontWeight: '800',
          textAlign: 'center',
          includeFontPadding: false,
        },
        style,
      ]}
    >
      {symbol}
    </Text>
  );
};

export const Ionicons = AppIcon;
export default AppIcon;
