import * as THREE from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { AnimationMixer } from "three";
import { getRandomColor } from "./public/utils/random-color";
import { changeAnimation } from "./public/utils/animation";
import { getHand, getText } from "./public/utils/hand";

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
let brainModel: THREE.Object3D;
let brainModels: THREE.Object3D[] = [];
let gltf: GLTF;
let manGltf: GLTF;
let minPositionByZ: number;
let isGameStart = false;
let isMovingLeft = false;
let isMovingRight = false;
let manOriginalColor: THREE.Color;
let trackBoundingBox: THREE.Box3;
let hand: THREE.Object3D<THREE.Event>;
let text: THREE.Object3D<THREE.Event>;
let fingerStartPosition = { x: 0, y: 0 };

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
    trackBoundingBox = new THREE.Box3().setFromObject(trackModel);

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
    manGltf = loadedGltf;
    manModel = manGltf.scene;
    manMixer = new THREE.AnimationMixer(manModel);

    const manMaterial = new THREE.MeshStandardMaterial({});

    manOriginalColor = manMaterial.color.clone();

    manModel.scale.set(1.3, 1.3, 1.3);
    manModel.position.set(0, 0, -4);
    manModel.rotation.y = Math.PI;
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
    changeAnimation(manGltf, manMixer, 3);
    brainsGenerator();
  });

  hand = getHand(scene);
  text = getText(scene);
  camera.position.set(0, 12, 9);

  document.addEventListener("touchstart", handleTouchStart);
  document.addEventListener("touchmove", handleTouchMove);
  document.addEventListener("touchend", handleTouchEnd);

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

function handleTouchStart(event: TouchEvent) {
  const touch = event.touches[0];
  fingerStartPosition.x = touch.clientX;
  fingerStartPosition.y = touch.clientY;
  isGameStart = true;
  changeAnimation(manGltf, manMixer, 4);
  console.log("down");
}

function handleTouchMove(event: TouchEvent) {
  const touch = event.touches[0];
  const deltaX = touch.clientX - fingerStartPosition.x;
  console.log("slkdrjf");

  if (deltaX > 0) {
    isMovingRight = true;
    isMovingLeft = false;
    console.log("право");
  } else if (deltaX < 0) {
    isMovingLeft = true;
    isMovingRight = false;
    console.log("ліво");
  } else {
    isMovingLeft = false;
    isMovingRight = false;
  }
}

function handleTouchEnd() {
  // Закінчення торкання
  isMovingLeft = false;
  isMovingRight = false;
  console.log("up");
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const speed = 0.5;

  if (manMixer) {
    manMixer.update(delta);
  }

  if (isGameStart) {
    const manBoundingBox = manHitbox.setFromObject(manModel);
    scene.remove(hand);
    scene.remove(text);

    if (isMovingLeft) {
      const manBoundingBox = new THREE.Box3().setFromObject(manModel);
      const manWidth = manBoundingBox.max.x - manBoundingBox.min.x;
      if (manModel.position.x >= trackBoundingBox.min.x - manWidth) {
        manModel.position.x -= speed / 2;
      }
    } else if (isMovingRight) {
      const manBoundingBox = new THREE.Box3().setFromObject(manModel);
      const manWidth = manBoundingBox.max.x - manBoundingBox.min.x;
      if (manModel.position.x <= trackBoundingBox.max.x + manWidth) {
        manModel.position.x += speed / 2;
      }
    }

    brainModels.forEach((brain) => {
      const brainBoundingBox = new THREE.Box3().setFromObject(brain);
      const brainMesh = brain.getObjectByName("Brain_collect") as THREE.Mesh;
      const brainMaterial = brainMesh.material as THREE.MeshStandardMaterial;
      const manMesh = manModel.getObjectByName("Stickman") as THREE.Mesh;
      const manMaterial = manMesh.material as THREE.MeshStandardMaterial;
      const scale = 0.5;
      const center = new THREE.Vector3();
      brainBoundingBox.getCenter(center);
      const size = brainBoundingBox.getSize(new THREE.Vector3());
      const scaledSize = size.clone().multiplyScalar(scale);

      const min = new THREE.Vector3(
        center.x - scaledSize.x / 2,
        center.y - scaledSize.y / 2,
        center.z - scaledSize.z / 2
      );
      const max = new THREE.Vector3(
        center.x + scaledSize.x / 2,
        center.y + scaledSize.y / 2,
        center.z - scaledSize.z * 4
      );

      brainBoundingBox.set(min, max);

      brain.position.z += speed / 2;

      if (manBoundingBox.intersectsBox(brainBoundingBox)) {
        manMaterial.color.copy(brainMaterial.color);
        scene.remove(brain);
        brainModels = brainModels.filter((b) => b !== brain);
      }
    });

    const arrayPositionByZ = brainModels.map(
      (brainModel) => brainModel.position.z
    );

    minPositionByZ = Math.floor(Math.min(...arrayPositionByZ) * 10) / 10;

    if (minPositionByZ === -20) {
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
      changeAnimation(manGltf, manMixer, 4);

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

function brainsGenerator() {
  for (let i = 0; i < 4; i++) {
    brain.load("./objects/Brain.glb", function (loadedGltf) {
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
    });
  }
}

init();
