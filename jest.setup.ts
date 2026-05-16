jest.mock('react-native-vision-camera', () => ({
  Camera: (props: object) => {
    const React = require('react');
    const {View} = require('react-native');
    return React.createElement(View, props);
  },
  useCameraDevice: () => ({id: 'back', position: 'back'}),
  useCameraPermission: () => ({
    hasPermission: true,
    requestPermission: jest.fn(() => Promise.resolve(true)),
  }),
  useCodeScanner: (config: object) => config,
}));
