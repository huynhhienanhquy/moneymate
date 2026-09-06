import '../helpers/prisma-mock';
import prisma from '../../config/db';
import { NotificationRepository } from '../../repositories/notification.repository';

describe('NotificationRepository device ownership', () => {
  it('removes stale token and device bindings before creating the current owner', async () => {
    const tx = {
      deviceToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        upsert: jest.fn().mockResolvedValue({ id: 'binding-2', userId: 'user-2' }),
      },
    };
    (prisma.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));

    const repository = new NotificationRepository();
    await repository.registerDevice('user-2', {
      deviceId: 'phone-1',
      token: 'ExponentPushToken[same-phone]',
      platform: 'android',
      provider: 'expo',
    });

    expect(tx.deviceToken.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-2',
        deviceId: 'phone-1',
        provider: 'expo',
        token: { not: 'ExponentPushToken[same-phone]' },
      },
    });
    expect(tx.deviceToken.upsert).toHaveBeenCalledWith({
      where: { token: 'ExponentPushToken[same-phone]' },
      update: expect.objectContaining({ userId: 'user-2', deviceId: 'phone-1', isActive: true }),
      create: expect.objectContaining({ userId: 'user-2', deviceId: 'phone-1' }),
    });
  });

  it('only returns Expo tokens to the Expo push sender', async () => {
    (prisma.deviceToken.findMany as jest.Mock).mockResolvedValue([]);

    await new NotificationRepository().findActiveDeviceTokens('user-1');

    expect(prisma.deviceToken.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isActive: true, provider: 'expo' },
      select: { id: true, token: true },
    });
  });
});
