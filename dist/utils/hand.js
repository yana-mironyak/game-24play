import * as THREE from "three";

export function getHand(scene) {
  const hand = new THREE.TextureLoader();
  const handTexture = hand.load("./objects/Tutorial_Hand.png");
  const handMaterial = new THREE.MeshBasicMaterial({
    map: handTexture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const handMesh = new THREE.Mesh(geometry, handMaterial);
  handMesh.position.set(0, 3.5, 0);
  scene.add(handMesh);

  const clock = new THREE.Clock();
  let direction = 1;
  const speed = 5;

  function animateHand() {
    const delta = clock.getDelta();

    const movement = speed * direction * delta;
    handMesh.position.x += movement;

    if (handMesh.position.x >= 2) {
      direction = -1;
    } else if (handMesh.position.x <= -2) {
      direction = 1;
    }

    requestAnimationFrame(animateHand);
  }

  animateHand();

  return handMesh;
}

export function getText(scene) {
  const text = new THREE.TextureLoader();
  const textTexture = text.load("./objects/Tutorial_SWIPE TO START.png");
  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(5, 1);
  const textMesh = new THREE.Mesh(geometry, textMaterial);
  textMesh.position.set(0, 5, 0);
  scene.add(textMesh);

  return textMesh;
}
