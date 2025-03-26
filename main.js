import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333333);

// Camera setup with narrower FOV for closer view
const camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 0.1, 1000);
const initialCameraZ = 2;
camera.position.set(0, 0.5, initialCameraZ);

// Initialize zoom variables
let currentZoom = initialCameraZ;
let targetZoom = initialCameraZ;

// Add raycaster for interactions
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let laptopMesh = null;
let grassMesh = null;

// Add tooltip
const tooltipDiv = document.createElement('div');
tooltipDiv.style.position = 'absolute';
tooltipDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
tooltipDiv.style.color = 'white';
tooltipDiv.style.padding = '10px';
tooltipDiv.style.borderRadius = '5px';
tooltipDiv.style.fontFamily = 'Arial, sans-serif';
tooltipDiv.style.fontSize = '14px';
tooltipDiv.style.pointerEvents = 'none';
tooltipDiv.style.display = 'none';
tooltipDiv.style.zIndex = '1000';
document.body.appendChild(tooltipDiv);

// Renderer setup with better quality settings
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// Enhanced lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Main directional light positioned above and behind camera
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 10); // Position light high up and behind camera
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
directionalLight.shadow.bias = -0.001;
scene.add(directionalLight);

// Add fill lights for better illumination
const fillLight1 = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight1.position.set(-5, 5, 0);
scene.add(fillLight1);

const fillLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
fillLight2.position.set(5, 5, 0);
scene.add(fillLight2);

// Load the GLB model
const loader = new GLTFLoader();
let model;
const loadingElement = document.getElementById('loading');
const progressElement = document.getElementById('progress');

loadingElement.style.display = 'block';

loader.load(
    '/ROOMWORKINGGIRL.glb',
    (gltf) => {
        model = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Calculate appropriate scale based on bounding box
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.7 / maxDim;
        model.scale.setScalar(scale);
        
        // Position model to be perfectly centered
        model.position.set(0, 0, 0);
        
        // Find interactive meshes
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Improve material quality
                if (child.material) {
                    child.material.roughness = 0.8;
                    child.material.metalness = 0.2;
                }
                
                // Look for laptop mesh
                if (child.name.toLowerCase().includes('laptop') || 
                    child.name.toLowerCase().includes('computer') ||
                    child.name.toLowerCase().includes('screen')) {
                    laptopMesh = child;
                    if (child.material) {
                        child.material.emissive = new THREE.Color(0x222222);
                    }
                }
                
                // Look for grass/ground mesh
                if (child.name.toLowerCase().includes('grass') || 
                    child.name.toLowerCase().includes('ground') ||
                    child.name.toLowerCase().includes('floor')) {
                    grassMesh = child;
                    if (child.material) {
                        child.material.emissive = new THREE.Color(0x222222);
                    }
                }
            }
        });
        
        scene.add(model);
        loadingElement.style.display = 'none';
        
        // Update light position relative to model
        updateLightPosition();
    },
    (xhr) => {
        const percentComplete = Math.round((xhr.loaded / xhr.total) * 100);
        progressElement.textContent = `${percentComplete}%`;
    },
    (error) => {
        console.error('Error loading model:', error);
        loadingElement.textContent = 'Error loading model';
    }
);

// Handle clicks on interactive elements
function onMouseClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check laptop intersection
    if (laptopMesh) {
        const laptopIntersects = raycaster.intersectObject(laptopMesh, true);
        if (laptopIntersects.length > 0) {
            // Navigate to laptop page
            window.location.href = 'laptop.html';
            return;
        }
    }
    
    // Check grass intersection
    if (grassMesh) {
        const grassIntersects = raycaster.intersectObject(grassMesh, true);
        if (grassIntersects.length > 0) {
            // Navigate to grass page
            window.location.href = 'grass.html';
            return;
        }
    }
}

// Update tooltip position and content
function updateTooltip(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    let hoveredObject = null;
    let tooltipText = '';

    // Check laptop intersection
    if (laptopMesh) {
        const laptopIntersects = raycaster.intersectObject(laptopMesh, true);
        if (laptopIntersects.length > 0) {
            hoveredObject = laptopMesh;
            tooltipText = 'Click to learn about technology and workspace';
        }
    }

    // Check grass intersection
    if (grassMesh && !hoveredObject) {
        const grassIntersects = raycaster.intersectObject(grassMesh, true);
        if (grassIntersects.length > 0) {
            hoveredObject = grassMesh;
            tooltipText = 'Click to explore nature and environment';
        }
    }

    // Update tooltip visibility and content
    if (hoveredObject) {
        tooltipDiv.style.display = 'block';
        tooltipDiv.style.left = event.clientX + 10 + 'px';
        tooltipDiv.style.top = event.clientY + 10 + 'px';
        tooltipDiv.textContent = tooltipText;
        document.body.style.cursor = 'pointer';

        // Highlight the hovered object
        hoveredObject.material.emissive = new THREE.Color(0x444444);

        // Reset other objects
        if (hoveredObject === laptopMesh && grassMesh) {
            grassMesh.material.emissive = new THREE.Color(0x222222);
        } else if (hoveredObject === grassMesh && laptopMesh) {
            laptopMesh.material.emissive = new THREE.Color(0x222222);
        }
    } else {
        // Reset everything when not hovering
        tooltipDiv.style.display = 'none';
        document.body.style.cursor = 'default';
        if (laptopMesh) laptopMesh.material.emissive = new THREE.Color(0x222222);
        if (grassMesh) grassMesh.material.emissive = new THREE.Color(0x222222);
    }
}

// Add event listeners
window.addEventListener('click', onMouseClick);
window.addEventListener('mousemove', updateTooltip);

// Improved orbit controls with inertia
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let modelRotation = { x: 0, y: 0 };
let rotationVelocity = { x: 0, y: 0 };
const dampingFactor = 0.95;

function updateModelRotation() {
    if (!isDragging && (Math.abs(rotationVelocity.x) > 0.0001 || Math.abs(rotationVelocity.y) > 0.0001)) {
        modelRotation.x += rotationVelocity.x;
        modelRotation.y += rotationVelocity.y;
        
        // Apply damping
        rotationVelocity.x *= dampingFactor;
        rotationVelocity.y *= dampingFactor;
        
        if (model) {
            model.rotation.x = modelRotation.x;
            model.rotation.y = modelRotation.y;
        }
    }
}

document.addEventListener('mousedown', (event) => {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
    // Reset velocity when starting new drag
    rotationVelocity = { x: 0, y: 0 };
});

document.addEventListener('mousemove', (event) => {
    if (isDragging && model) {
        const deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };

        const rotationSpeed = 0.005;
        rotationVelocity = {
            x: deltaMove.y * rotationSpeed,
            y: deltaMove.x * rotationSpeed
        };

        modelRotation.x += rotationVelocity.x;
        modelRotation.y += rotationVelocity.y;

        // Limit vertical rotation
        modelRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, modelRotation.x));

        model.rotation.x = modelRotation.x;
        model.rotation.y = modelRotation.y;

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
});

// Adjusted zoom parameters
const minZoom = 0.8;    // Minimum zoom
const maxZoom = 12;     // Maximum zoom
const zoomSpeed = 0.12; // Zoom speed

// Smoother zoom handling with centered focus
document.addEventListener('wheel', (event) => {
    event.preventDefault();
    const zoomDelta = event.deltaY * 0.004;
    targetZoom = Math.max(minZoom, Math.min(maxZoom, targetZoom + zoomDelta));
}, { passive: false });

function updateZoom() {
    if (Math.abs(currentZoom - targetZoom) > 0.01) {
        currentZoom += (targetZoom - currentZoom) * zoomSpeed;
        camera.position.z = currentZoom;
        // Keep camera focused on exact center while zooming
        camera.lookAt(new THREE.Vector3(0, 0.1, 0));
        updateLightPosition();
    }
}

// Keep light position relative to camera
function updateLightPosition() {
    directionalLight.position.set(camera.position.x + 5, camera.position.y + 10, camera.position.z + 5);
}

// Enhanced animation loop with smoother updates
function animate() {
    requestAnimationFrame(animate);
    updateModelRotation();
    updateZoom();
    renderer.render(scene, camera);
}

// Track mouse movement for hover effect
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

window.addEventListener('mousemove', onMouseMove);

// Improved window resize handling
function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', handleResize);

animate();