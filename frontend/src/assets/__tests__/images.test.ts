import { APP_IMAGES } from '@/assets/images';

describe('APP_IMAGES', () => {
  it('exposes the public MoneyMate logo path', () => {
    expect(APP_IMAGES.logo).toBe('/logo.png');
  });
});
