import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimationClip, AnimationMixer } from "three";

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  100,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

document.body.appendChild(renderer.domElement);

const track = new GLTFLoader();
const man = new GLTFLoader();
const brain = new GLTFLoader();
const clock = new THREE.Clock();
const manHitbox = new THREE.Box3();

let manModel: THREE.Object3D;
let manMixer: AnimationMixer;
let manAnimation: AnimationClip;
let brainModel: THREE.Object3D;
let brainModels: THREE.Object3D[] = [];
let gltf: GLTF;
let minPositionByZ: number;
// let crossPosition: number;
let isGameStart = false;
let isMovingLeft = false;
let isMovingRight = false;
let manOriginalColor: THREE.Color;

async function init() {
  scene.background = new THREE.Color(0xabcdef);

  const light = new THREE.DirectionalLight(0x888888, 1);

  scene.add(light);

  const shadowLight = new THREE.DirectionalLight(0xffffff, 1);
  shadowLight.position.set(1, 9, 11);
  shadowLight.castShadow = true;
  shadowLight.shadow.mapSize.width = 1024;
  shadowLight.shadow.mapSize.height = 1024;
  shadowLight.shadow.camera.left = -40;
  shadowLight.shadow.camera.right = 40;
  shadowLight.shadow.camera.top = 40;
  shadowLight.shadow.camera.bottom = -40;

  scene.add(shadowLight);

  track.load("./objects/TrackFloor.glb", function (loadedGltf) {
    gltf = loadedGltf;
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load("./objects/sand-texture.jpg");
    const trackModel = gltf.scene;

    trackModel.scale.set(2, 3, 8);
    trackModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const material = new THREE.MeshPhongMaterial({ map: texture });
    const mesh = trackModel.children[0] as THREE.Mesh;

    mesh.material = material;

    scene.add(trackModel);
  });

  man.load("./objects/Stickman.glb", function (loadedGltf) {
    gltf = loadedGltf;
    manModel = gltf.scene;
    const manMaterial = new THREE.MeshStandardMaterial({});

    manOriginalColor = manMaterial.color;

    manModel.scale.set(1.3, 1.3, 1.3);
    manModel.position.set(0, 0, -4);
    // manModel.rotation.y = Math.PI;
    manModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        shadowLight.shadow.camera.left = -20;
        shadowLight.shadow.camera.right = 40;
        shadowLight.shadow.camera.top = 40;
        shadowLight.shadow.camera.bottom = -40;
        child.material = manMaterial;
      }
    });

    scene.add(manModel);

    changeAnimation(3);
    brainsGenerator();
  });

  camera.position.set(0, 12, 9);

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const speed = 0.2;

  if (manMixer) {
    manMixer.update(delta);
  }

  if (isMovingLeft) {
    manModel.position.x -= speed / 2;
  } else if (isMovingRight) {
    manModel.position.x += speed / 2;
  }

  if (isGameStart) {
    const manBoundingBox = manHitbox.setFromObject(manModel);

    changeAnimation(4);

    brainModels.forEach((brain) => {
      const brainBoundingBox = new THREE.Box3().setFromObject(brain);

      brain.position.z += speed;

      if (manBoundingBox.intersectsBox(brainBoundingBox)) {
        const brainMesh = brain.getObjectByName("Brain_collect") as THREE.Mesh;
        const brainMaterial = brainMesh.material as THREE.MeshStandardMaterial;
        manOriginalColor.copy(brainMaterial.color);
        manOriginalColor = brainMaterial.color;
      } else {
      }
    });

    const arrayPositionByZ = brainModels.map(
      (brainModel) => brainModel.position.z
    );

    minPositionByZ = Math.floor(Math.min(...arrayPositionByZ) * 10) / 10;
    // console.log(minPositionByZ);

    if (minPositionByZ === -25) {
      brainsGenerator();
    }
  }

  renderer.render(scene, camera);
}

animate();

function handleKeyDown(event: KeyboardEvent) {
  const keyCode = event.code;

  switch (keyCode) {
    case "ArrowLeft":
      isMovingLeft = true;
      break;
    case "ArrowRight":
      isMovingRight = true;
      break;
    case "ArrowUp":
      isGameStart = true;
      changeAnimation(4);
      break;
  }
}

function handleKeyUp(event: KeyboardEvent) {
  const keyCode = event.code;

  switch (keyCode) {
    case "ArrowLeft":
      isMovingLeft = false;
      break;
    case "ArrowRight":
      isMovingRight = false;
      break;
  }
}

function changeAnimation(index: number) {
  const animations = gltf.animations;
  if (animations && animations.length) {
    manMixer = new AnimationMixer(manModel);
    manAnimation = animations[index];

    const action = manMixer.clipAction(manAnimation);

    action.play();
  }
}

function brainsGenerator() {
  brain.load("./objects/Brain.glb", function (loadedGltf) {
    for (let i = 0; i < 2; i++) {
      gltf = loadedGltf;
      brainModel = gltf.scene.clone();

      const brainColor = getRandomColor();
      const brainMaterial = new THREE.MeshStandardMaterial({
        color: brainColor,
      });

      brainModel.scale.set(2, 2, 2);
      const trackWidth = 16;
      const trackHeight = 1;
      const trackLength = -40;

      const randomX = Math.round(Math.random() * trackWidth - trackWidth / 2);
      const randomY = trackHeight;
      const randomZ = Math.round(Math.random() * trackLength - 20);

      brainModel.position.set(randomX, randomY, randomZ);

      brainModel.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.material = brainMaterial;
        }
      });

      scene.add(brainModel);

      brainModels.push(brainModel);
    }
  });
}

function getRandomColor() {
  const colors = [0x0000ff, 0xffa500, 0x800080];
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

init();
