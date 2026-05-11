import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 基准尺寸 (iPhone 11 Pro)
const baseWidth = 375;
const baseHeight = 812;

// 根据屏幕宽度计算缩放比例
const scaleWidth = SCREEN_WIDTH / baseWidth;
const scaleHeight = SCREEN_HEIGHT / baseHeight;
const scale = Math.min(scaleWidth, scaleHeight);

/**
 * 根据屏幕宽度按比例缩放
 * @param {number} size - 基准尺寸
 * @returns {number} - 缩放后的尺寸
 */
export const wp = (size) => {
  const newSize = size * scaleWidth;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 根据屏幕高度按比例缩放
 * @param {number} size - 基准尺寸
 * @returns {number} - 缩放后的尺寸
 */
export const hp = (size) => {
  const newSize = size * scaleHeight;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * 缩放字体大小
 * @param {number} size - 基准字体大小
 * @returns {number} - 缩放后的字体大小
 */
export const fs = (size) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

/**
 * 检测设备类型
 */
export const isTablet = () => {
  const aspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH;
  return (
    (Platform.OS === 'ios' && !Platform.isPad && aspectRatio < 1.6) ||
    (Platform.isPad) ||
    (SCREEN_WIDTH >= 768)
  );
};

/**
 * 检测是否为小屏幕设备
 */
export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375;
};

/**
 * Проверка на веб-платформу с большим экраном
 */
export const isWebLargeScreen = () => {
  return Platform.OS === 'web' && SCREEN_WIDTH > 768;
};

/**
 * Максимальная ширина контейнера для веб-версии
 */
export const getMaxContainerWidth = () => {
  if (SCREEN_WIDTH >= 1920) return 600;  // Full HD и выше - еще больше уменьшено
  if (SCREEN_WIDTH >= 1600) return 550;  // Большие мониторы - еще больше уменьшено
  if (SCREEN_WIDTH >= 1200) return 500;  // Средние мониторы - еще больше уменьшено
  if (SCREEN_WIDTH >= 1024) return 480;  // Планшеты landscape - уменьшено
  if (SCREEN_WIDTH >= 768) return 450;   // Планшеты portrait - уменьшено
  return '100%'; // Мобильные устройства
};

/**
 * Масштаб для элементов на десктопе (чтобы элементы не были слишком большими)
 */
export const getDesktopScale = () => {
  if (!isWebLargeScreen()) return 1;
  // На больших экранах более агрессивно уменьшаем размеры элементов
  if (SCREEN_WIDTH >= 1920) return 0.6;  // 40% уменьшение
  if (SCREEN_WIDTH >= 1600) return 0.65; // 35% уменьшение
  if (SCREEN_WIDTH >= 1200) return 0.7;  // 30% уменьшение
  if (SCREEN_WIDTH >= 1024) return 0.75; // 25% уменьшение
  return 0.8; // 20% уменьшение для планшетов
};

/**
 * 获取设备尺寸信息
 */
export const getDeviceInfo = () => {
  return {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isTablet: isTablet(),
    isSmallDevice: isSmallDevice(),
    scale: scale,
  };
};

/**
 * 响应式间距
 */
export const spacing = {
  xs: wp(4),
  sm: wp(8),
  md: wp(16),
  lg: wp(24),
  xl: wp(32),
};

/**
 * 响应式字体大小
 */
export const fontSizes = {
  xs: fs(10),
  sm: fs(12),
  md: fs(14),
  lg: fs(16),
  xl: fs(18),
  xxl: fs(20),
  xxxl: fs(24),
  huge: fs(32),
};

/**
 * 响应式边框半径
 */
export const borderRadius = {
  sm: wp(4),
  md: wp(8),
  lg: wp(12),
  xl: wp(16),
};

export default {
  wp,
  hp,
  fs,
  isTablet,
  isSmallDevice,
  isWebLargeScreen,
  getMaxContainerWidth,
  getDesktopScale,
  getDeviceInfo,
  spacing,
  fontSizes,
  borderRadius,
};


