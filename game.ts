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

let manModel: THREE.Object3D;
let manMixer: AnimationMixer;
let manAnimation: AnimationClip;
let brainModel: THREE.Object3D;
let brainModels: THREE.Object3D[] = [];
let gltf: GLTF;
let isKeyPressed = false;
let isMovingLeft = false;
let isMovingRight = false;
let isAnimationPlaying = false;

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const speed = 0.2;

  if (manMixer) {
    manMixer.update(delta);
  }
  if (isKeyPressed) {
    brainModels.forEach((brain) => {
      brain.position.z += speed;
    });
  }
  if (isMovingLeft) {
    manModel.position.x -= speed;
    brainModels.forEach((brain) => {
      brain.position.z += speed;
    });
  } else if (isMovingRight) {
    manModel.position.x += speed;
    brainModels.forEach((brain) => {
      brain.position.z += speed;
    });
  }

  renderer.render(scene, camera);
}

animate();

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

    manModel.position.set(0, 4, 0);
    // manModel.rotation.y = Math.PI;
    manModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        shadowLight.shadow.camera.left = -20;
        shadowLight.shadow.camera.right = 40;
        shadowLight.shadow.camera.top = 40;
        shadowLight.shadow.camera.bottom = -40;
      }
    });

    changeAnimation(3);

    scene.add(manModel);
  });

  const trackWidth = 10; //х
  const trackHeight = 5; //у
  const trackLength = -25;

  brainsGenerator(trackWidth, trackHeight, trackLength);

  camera.position.set(0, 12, 9);

  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
}

function handleKeyDown(event: KeyboardEvent) {
  const keyCode = event.code;

  if (!isKeyPressed) {
    switch (keyCode) {
      case "ArrowUp":
        isKeyPressed = true;
        changeAnimation(4);
        brainModels.map((brain) => {
          brain.position.z += 1;
        });
        break;
      case "ArrowLeft":
        isMovingLeft = true;
        if (!isAnimationPlaying) {
          changeAnimation(4);
          isAnimationPlaying = true;
        }
        break;
      case "ArrowRight":
        isMovingRight = true;
        if (!isAnimationPlaying) {
          changeAnimation(4);
          isAnimationPlaying = true;
        }
        break;
    }
  }
}

function handleKeyUp(event: KeyboardEvent) {
  const keyCode = event.code;

  switch (keyCode) {
    case "ArrowUp":
      isKeyPressed = false;
      changeAnimation(3);
      break;
    case "ArrowLeft":
      isMovingLeft = false;
      if (!isMovingRight) {
        isAnimationPlaying = false;
      }
      break;
    case "ArrowRight":
      isMovingRight = false;
      if (!isMovingLeft) {
        isAnimationPlaying = false;
      }
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

function brainsGenerator(
  trackWidth: number,
  trackHeight: number,
  trackLength: number
) {
  brain.load("./objects/Brain.glb", function (loadedGltf) {
    for (let i = 0; i < 3; i++) {
      gltf = loadedGltf;
      brainModel = gltf.scene.clone();

      const brainColor = getRandomColor();
      const brainMaterial = new THREE.MeshStandardMaterial({
        color: brainColor,
      });

      brainModel.scale.set(1.5, 1.5, 1.5);

      const randomX = Math.random() * trackWidth - trackWidth / 2;
      const randomZ = Math.random() * trackLength;
      const randomY = trackHeight;
      // const randomY = trackHeight * Math.floor(Math.random() * 3) + 9;

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
