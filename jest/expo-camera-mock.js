// Jest has no camera. Stub expo-camera with "permission not yet granted" so the
// scan screen renders its explainer and code-entry fallback.
module.exports = {
  CameraView: () => null,
  useCameraPermissions: () => [
    { granted: false, canAskAgain: true, status: 'undetermined' },
    () => Promise.resolve(),
  ],
};
