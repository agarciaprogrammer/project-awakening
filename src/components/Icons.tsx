import { PixelSprite } from './Pixel';

const ICONS: Record<string, string[]> = {
  home: ['....x....', '...xxx...', '..xxxxx..', '.xxxxxxx.', 'xxxxxxxxx', '.xx...xx.', '.xx.x.xx.', '.xx.x.xx.', '.xxxxxxx.'],
  map: ['xx..xx...', 'x.xxx.xx.', 'x..x...xx', 'x..x....x', 'x..x.x..x', 'x..x....x', 'x..x...xx', 'xx.xx.xx.', '..xx.xx..'],
  scroll: ['.xxxxxxx.', 'x.......x', '.x.xxx.x.', '.x.....x.', '.x.xxx.x.', '.x.....x.', '.x.xx..x.', 'x.......x', '.xxxxxxx.'],
  gear: ['...x.x...', '.x.xxx.x.', '..xxxxx..', 'xxx...xxx', '.xx...xx.', 'xxx...xxx', '..xxxxx..', '.x.xxx.x.', '...x.x...'],
  check: ['........x', '.......xx', '......xx.', 'x....xx..', 'xx..xx...', '.xxxx....', '..xx.....'],
  plus: ['..x..', '..x..', 'xxxxx', '..x..', '..x..'],
  minus: ['.....', '.....', 'xxxxx', '.....', '.....'],
  close: ['x...x', '.x.x.', '..x..', '.x.x.', 'x...x'],
  up: ['..x..', '.xxx.', 'xxxxx', '..x..', '..x..'],
  down: ['..x..', '..x..', 'xxxxx', '.xxx.', '..x..'],
  lock: ['..xxx..', '.x...x.', '.x...x.', 'xxxxxxx', 'xxx.xxx', 'xxx.xxx', 'xxxxxxx'],
  fist: ['..xxxx...', '.xxxxxxx.', 'xxxxxxxxx', 'xx.x.x.xx', 'xxxxxxxxx', 'xxxxxxxx.', '.xxxxxxx.', '..xxxxx..', '..xxxxx..'],
  boot: ['...xxx...', '...x.x...', '...x.x...', '...x.x...', '...x.xx..', '..xx..xx.', '.xx....xx', 'xxxxxxxxx', 'xxxxxxxxx'],
  star: ['....x....', '....x....', '...xxx...', 'xxxxxxxxx', '.xxxxxxx.', '..xxxxx..', '.xxx.xxx.', '.xx...xx.', 'x.......x'],
  trash: ['..xxx..', 'xxxxxxx', '.......', '.xxxxx.', '.x.x.x.', '.x.x.x.', '.xxxxx.'],
  moon: ['..xxx..', '.xx....', 'xx.....', 'xx.....', 'xx.....', '.xx....', '..xxx..'],
};

export type IconName = keyof typeof ICONS;

export function Icon({ name, className, color = 'currentColor' }: { name: IconName; className?: string; color?: string }) {
  return <PixelSprite rows={ICONS[name]} palette={{ x: color }} className={`icon ${className ?? ''}`} />;
}
