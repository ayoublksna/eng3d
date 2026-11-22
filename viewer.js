import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("#canvas");
const viewer = document.querySelector("#viewer");
const loaderElement = document.querySelector("#loader");
const progressElement = document.querySelector("#progress");
const errorElement = document.querySelector("#error");
const resetButton = document.querySelector("#reset-view");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#161a18");

const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 10000);
camera.position.set(4, 3, 6);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
pmremGenerator.dispose();

scene.add(new THREE.HemisphereLight("#f4f1df", "#314036", 1.35));

const keyLight = new THREE.DirectionalLight("#fff4dc", 3.2);
keyLight.position.set(5, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.1;
keyLight.shadow.camera.far = 100;
keyLight.shadow.bias = -0.0003;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight("#aebfb3", 1.1);
rimLight.position.set(-6, 4, -5);
scene.add(rimLight);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = true;
controls.screenSpacePanning = true;
controls.minDistance = 0.05;
controls.maxDistance = 10000;
controls.maxPolarAngle = Math.PI * 0.88;

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(100, 64),
  new THREE.MeshStandardMaterial({
    color: "#1b201d",
    roughness: 0.92,
    metalness: 0,
  }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -0.02;
scene.add(ground);

let model;
let defaultCameraPosition = camera.position.clone();
let defaultTarget = controls.target.clone();

function resize() {
  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function frameObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const sphere = box.getBoundingSphere(new THREE.Sphere());

  object.position.sub(center);

  const fittedBox = new THREE.Box3().setFromObject(object);
  const fittedSize = fittedBox.getSize(new THREE.Vector3());
  const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
  controls.target.copy(fittedCenter);

  const radius = Math.max(sphere.radius, size.length() * 0.5);
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const distance = (radius / Math.sin(fov / 2)) * 1.08;

  const direction = new THREE.Vector3(0.75, 0.48, 1).normalize();
  camera.position.copy(fittedCenter).add(direction.multiplyScalar(distance));
  camera.near = Math.max(distance / 1000, 0.001);
  camera.far = Math.max(distance * 100, 10000);
  camera.updateProjectionMatrix();

  controls.minDistance = Math.max(radius * 0.03, 0.001);
  controls.maxDistance = Math.max(radius * 8, distance * 4);
  controls.target.copy(fittedCenter);
  controls.update();

  ground.position.y = fittedBox.min.y - 0.015;
  ground.scale.setScalar(Math.max(fittedSize.x, fittedSize.z) * 0.06);
  defaultCameraPosition = camera.position.clone();
  defaultTarget = controls.target.clone();

  if (fittedSize.y > radius * 1.5) {
    ground.visible = false;
  }
}

function configureObject(object) {
  object.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.geometry) child.geometry.computeBoundingSphere();

    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!material) continue;
      material.envMapIntensity = 1;
      material.needsUpdate = true;
    }
  });
}

const loader = new GLTFLoader();
loader.load(
  "./al-aqmar_mosque__-_cairo__egypt.glb",
  (gltf) => {
    model = gltf.scene;
    configureObject(model);
    scene.add(model);
    frameObject(model);

    loaderElement.classList.add("loaded");
  },
  (event) => {
    if (event.total) {
      progressElement.textContent = `${Math.round((event.loaded / event.total) * 100)}%`;
    }
  },
  () => {
    loaderElement.hidden = true;
    errorElement.hidden = false;
  },
);

resetButton.addEventListener("click", () => {
  camera.position.copy(defaultCameraPosition);
  controls.target.copy(defaultTarget);
  controls.update();
});

window.addEventListener("resize", resize);
resize();

function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
