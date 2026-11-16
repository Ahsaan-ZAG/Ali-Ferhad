import test from 'node:test';
import assert from 'node:assert/strict';
import { MOTION_DURATION, MOTION_EASE, MOTION_STAGGER } from './motion-tokens';
import { resolveRouteTransition } from '../transitions/route-transition';

test('motion tokens obey calm luxury editorial duration budgets', () => {
  assert.ok(MOTION_DURATION.micro >= 0.12 && MOTION_DURATION.micro <= 0.18);
  assert.ok(MOTION_DURATION.ui >= 0.18 && MOTION_DURATION.ui <= 0.28);
  assert.ok(MOTION_DURATION.standard >= 0.45 && MOTION_DURATION.standard <= 0.7);
  assert.ok(MOTION_DURATION.editorial >= 0.7 && MOTION_DURATION.editorial <= 1.1);
  assert.ok(MOTION_DURATION.hero >= 0.9 && MOTION_DURATION.hero <= 1.5);
  assert.ok(MOTION_STAGGER.cards > 0 && MOTION_EASE.editorial.length > 0);
});

test('resolveRouteTransition assigns editorial styles per route context', () => {
  const pdp = resolveRouteTransition({
    fromPath: '/shop',
    toPath: '/products/double-faced-ivory-cashmere-coat',
    imagePayload: {
      imageUrl: '/src/assets/images/product_coat_ivory_1794838444893.jpg',
      alt: 'Coat',
      rect: { top: 100, left: 80, width: 320, height: 420 },
    },
  });
  assert.equal(pdp.style, 'image-reveal');

  const about = resolveRouteTransition({
    fromPath: '/',
    toPath: '/about',
  });
  assert.equal(about.style, 'editorial-fade');

  const directional = resolveRouteTransition({
    fromPath: '/collections/autumn-architecture',
    toPath: '/collections/noir-capsule',
  });
  assert.equal(directional.style, 'directional');
  assert.equal(directional.direction, 'forward');

  const curtain = resolveRouteTransition({
    fromPath: '/',
    toPath: '/collections/noir-capsule',
  });
  assert.equal(curtain.style, 'curtain');
  assert.equal(curtain.curtainTone, 'charcoal');

  const reduced = resolveRouteTransition({
    fromPath: '/',
    toPath: '/collections/noir-capsule',
    reducedMotion: true,
  });
  assert.equal(reduced.style, 'editorial-fade');
});
