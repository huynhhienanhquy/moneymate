import { registerDeviceSchema } from '../../validators/notification.validator';

const validDevice = {
  deviceId: 'device-1',
  token: 'ExponentPushToken[1234567890]',
  platform: 'android',
};

describe('notification validators', () => {
  it('defaults device registration to the supported Expo provider', () => {
    expect(registerDeviceSchema.parse({ body: validDevice }).body.provider).toBe('expo');
  });

  it.each(['fcm', 'apns'])('rejects unsupported %s tokens at the API boundary', (provider) => {
    expect(registerDeviceSchema.safeParse({ body: { ...validDevice, provider } }).success).toBe(false);
  });
});
