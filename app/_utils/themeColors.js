// Theme color system for dynamic coloring
export const themeColors = {
  red: {
    primary: 'bg-red-900',
    light: 'bg-red-100',
    border: 'border-red-200',
    text: 'text-red-900',
    button: 'bg-red-900 hover:bg-red-800',
    footer: 'bg-red-900',
  },
  yellow: {
    primary: 'bg-yellow-900',
    light: 'bg-yellow-100',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    button: 'bg-yellow-900 hover:bg-yellow-800',
    footer: 'bg-yellow-900',
  },
  green: {
    primary: 'bg-green-900',
    light: 'bg-green-100',
    border: 'border-green-200',
    text: 'text-green-900',
    button: 'bg-green-900 hover:bg-green-800',
    footer: 'bg-green-900',
  },
  blue: {
    primary: 'bg-blue-900',
    light: 'bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-900',
    button: 'bg-blue-900 hover:bg-blue-800',
    footer: 'bg-blue-900',
  },
  purple: {
    primary: 'bg-purple-900',
    light: 'bg-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-900',
    button: 'bg-purple-900 hover:bg-purple-800',
    footer: 'bg-purple-900',
  },
  orange: {
    primary: 'bg-orange-900',
    light: 'bg-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-900',
    button: 'bg-orange-900 hover:bg-orange-800',
    footer: 'bg-orange-900',
  },
};

export const themeNames = ['red', 'yellow', 'green', 'blue', 'purple', 'orange'];

export const getRandomTheme = () => {
  const randomIndex = Math.floor(Math.random() * themeNames.length);
  return themeNames[randomIndex];
};
