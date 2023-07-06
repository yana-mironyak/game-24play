export function changeAnimation(gltf, manMixer, index) {
  const animations = gltf.animations;

  if (animations && animations.length > 0) {
    manMixer.stopAllAction();
    const action = manMixer.clipAction(animations[index]);
    action.reset();
    action.play();
  }
}
