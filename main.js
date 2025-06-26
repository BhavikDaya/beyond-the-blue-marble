import * as THREE from 'https://esm.sh/three@0.160.1';
import { OrbitControls } from 'https://esm.sh/three@0.160.1/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'https://esm.sh/three@0.160.1/examples/jsm/loaders/OBJLoader.js';

let scene, camera, renderer, controls; // Scene setup variables
let targetBody = null; // The current target selected by the user
let asteroidBelt = null;
let kuiperBelt = null;
let isFollowing = false; // Flag for the camera to track the object that the user clicks
let isPaused = false;
let trailToggle = false;
let speedModifier = 1;
let sunLight = null; // The sun's point light
let cockpitMode = false; // Free-roam mode
let cockpitCamera = null;
let backgroundMusic = null;
let lastFrameTime = 0; // Frame timing to optimise performance
let ship; // Space ship object for free-roam
let shipVelocity = new THREE.Vector3();
let shipDirection = new THREE.Vector3();
let spaceMissionTarget = new THREE.Vector3(); // Position of artificial space objects e.g. ISS
let celestialBodies = []; // Array of all celestial objects
let bodyData = []; // JSON date for the celestial objects
let keys = {}; // Keyboard input

// Camera transition animation 
let cameraTransition = {
    isActive: false,
    startTime: null,
    duration: 6000,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3()
}

//
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map(); // Cache textures
let frameCount = 0;
const frameInterval = 1000 / 60; // Target 60 frames per second
// Level of detail distances. 100 for highest.
const lodDistances = {
    High: 100,
    Medium: 500,
    Low: 1500
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); // Mouse interactions
const shipScale = 0.3; // Ship size

// Load data about the celestial bodies from the JSON file
async function loadCelestialDB () {
    try{
        const response = await fetch('./celestialDB.json');
        if (!response.ok) throw new Error(`Error HTTP ${response.status}`);
        bodyData = await response.json();
        init();
    } catch (error) {
        console.error('Failed to load the database: ', error);
        document.body.innerHTML = '<h3>Failed to load the database.</h3>';
    }
}
loadCelestialDB();

// Configure the background music
function loadAudio () {
    if (!backgroundMusic) {
        backgroundMusic = new Audio('./sounds/background.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5;
    }
    return backgroundMusic;
}

// Load the textures and cache them to improve performance
function loadTexture (path) {
    if (textureCache.has(path)) {
        return textureCache.get(path);
    }
    const texture = textureLoader.load(path);
    textureCache.set(path, texture);
    return texture;
}

// Initialises the scene, camera and renderer
// Sets up event listeners and the UI
function init() {
    document.body.style.opacity = '0'; // Smooth fade-in loading

    scene = new THREE.Scene(); 
    scene.background = new THREE.Color(0x0000c); // Navy color for the space background

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.00001, 200000);
    camera.position.set(0, 25, 40); // New camera with FOV 75 at this starting xyz position

    renderer = new THREE.WebGLRenderer({ // WebGL renderer with optimisations
        canvas: document.getElementById('solarCanvas'), 
        antialias: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.addEventListener('click', onClick, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace; // Enable soft shadows and optimise for the current display

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1.2;
    controls.maxDistance = 2600; // Orbit controls for camera movement

    document.addEventListener('click' || 'mousemove', () => {
        const bm = loadAudio();
        try{
            bm.play();
        } catch (error) {
            console.error('Failed to load audio: ', error);
        }
    }, {once: true}); // Start to play the background music (if loaded successfully) when the user clicks the canvas
    
    // Keyboard listeners for ship controls
    window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
   
    const playPause = document.getElementById('playPause');
    playPause.addEventListener('click', () => {
        isPaused = !isPaused;
        playPause.textContent = isPaused ? 'Play ':'Pause'; // Event listener for the play/pause button
    });

    document.getElementById('X').addEventListener('click', () => {
        document.getElementById('infoPane').classList.remove('visible'); // Event listener for the close button on the information pane
    })

    const trailToggleButton = document.getElementById('trailToggle');
    trailToggleButton.addEventListener('click', () => {
        trailToggle = !trailToggle;
        trailToggleButton.textContent = trailToggle ? 'Trails On':'Trails Off';
        celestialBodies.forEach(({trail}) => {
            if (trail) trail.visible = !trailToggle; // Event listenter for show/hide orbital trails button
        });
    });

    const cockpitButton = document.getElementById('cockpitButton');
    cockpitButton.addEventListener('click', () => {
        cockpitMode = !cockpitMode;
        cockpitButton.textContent = cockpitMode ? 'Exit freeroam':'Enter freeroam';
        controls.enabled = !cockpitMode; // Event listener for the enter/exit freeroam button
        if (cockpitMode && !cockpitCamera) {
            createCockpitCamera();
        }
    });

    const speedSlider = document.getElementById('speedSlider');
    speedSlider.addEventListener('input', (e) => {
        speedModifier = 1;
        speedModifier = Math.pow(2, parseFloat(e.target.value));

        if (speedModifier >= 1){
        document.getElementById('speedDisplay').textContent = (speedModifier + '').substring(0, 1) + 'x';
        }
        else
        {
            document.getElementById('speedDisplay').textContent = (speedModifier + '').substring(0, 4) + 'x';
        }
    }); // Event listener and animation speed slider with exponential scaling with speed displayed on page

    const sidebar = document.getElementById('sidebar');
    const title = document.getElementById('sidebarTitle');
    title.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    }); // Collapse or show the sidebar that shows celestial objects in the JSON file

    const ambientLight = new THREE.AmbientLight(0x333333, 7);
    scene.add(ambientLight); // Add ambient light

    createShip();
    createStarField(); // Create the starfield background and the controllable ship

    bodyData.forEach(data => createCelestialBody(data)); // Create every celestial body in the JSON file

    setTimeout(() => {
    celestialBodies.forEach(body => {
        const sbl = document.getElementById('sidebarList');
        const li = document.createElement('li');
        li.textContent = body.data.name.charAt(0).toUpperCase() + body.data.name.slice(1);
        li.style.cursor = 'pointer';
        li.style.padding = '8px 5px';
        li.style.borderBottom = '1px solid #444';

        li.addEventListener('mouseenter', () => li.style.backgroundColor = '#555');
        li.addEventListener('mouseleave', () => li.style.backgroundColor = 'transparent');

        li.addEventListener('click', () => {flyToObject(body);});
        sbl.appendChild(li);
    });
    }, 2500); // Populate the side bar with the list of celestial bodies and click to fly to the celestial body

    asteroidBelt = createBelts(); // Create the asteroid and Kuiper belts
    
    window.addEventListener('resize', onWindowResize, false);
    animate();

    setTimeout(() => {
       const uiElements = document.querySelectorAll('#sidebar, #sidebarTitle, #playPause, #trailToggle, #speedDisplay, #cockpitButton');
       uiElements.forEach(element => {
        element.style.transition = 'opacity 0.5s ease-in-out';
        element.style.opacity = '1';
        document.body.style.transition = 'opacity 2s ease-in-out';
        document.body.style.opacity = '1';
       });
    }, 150); // Fade the UI elements in after loading
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    if (cockpitCamera) {
        cockpitCamera.aspect = window.innerWidth / window.innerHeight;
        cockpitCamera.updateProjectionMatrix;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
} // Readjust aspect ratio and render size with changes in window sizes

// Move the ship relative to its orientation with the appropriate keyboard inputs
function updateShipMovement (change) {
    shipDirection.set(0, 0, 0);
    if (keys['arrowup']) shipDirection.y += 0.2;
    if (keys['arrowdown']) shipDirection.y -= 0.2;
    if (keys['arrowleft']) {
        ship.rotation.y += 0.015;
    }
    if (keys['arrowright']) {
        ship.rotation.y -= 0.015;
    }
    if (keys['w']) shipDirection.z -= 0.2;
    if (keys['s']) shipDirection.z += 0.2;
    if (keys['a']) shipDirection.x -= 0.2;
    if (keys['d']) shipDirection.x += 0.2;
    if (keys['q']) ship.rotation.z += 0.02; 
    if (keys['e']) ship.rotation.z -= 0.02;
    if (keys['r']) ship.rotation.x += 0.02;
    if (keys['f']) ship.rotation.x -= 0.02; 

    shipDirection.normalize();
    shipVelocity.copy(shipDirection).multiplyScalar(10 * change);
    const move = shipVelocity.clone().applyQuaternion(ship.quaternion);
    ship.position.add(move);
}

// Ease camera movement for smoother transitions
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Increase or decreased the level of detail depending on camera distance to improve performance
function updateLOD () {
    const cameraPosition = camera.position;

    celestialBodies.forEach(({mesh, data}) => {
        const distance = cameraPosition.distanceTo(mesh.position);

        if (distance > lodDistances.Low) {
            if (mesh.geometry.parameters.widthSegments > 8) {
                const newGeometry = new THREE.SphereGeometry(data.size, 8, 8);
                mesh.geometry.dispose();
                mesh.geometry = newGeometry;
            }
        }
        else if (distance > lodDistances.Medium) {
            if (mesh.geometry.parameters.widthSegments != 16) {
                const newGeometry = new THREE.SphereGeometry(data.size, 16, 16);
                mesh.geometry.dispose();
                mesh.geometry = newGeometry;
            }
        }
        else if (distance < lodDistances.High) {
            if (mesh.geometry.parameters.widthSegments != 32) {
                const newGeometry = new THREE.SphereGeometry(data.size, 32, 32);
                mesh.geometry.dispose();
                mesh.geometry = newGeometry;
            }
        }
    });
}

const clock = new THREE.Clock();

// Main animation function
function animate (currentTime) {
    requestAnimationFrame(animate);
    const change = clock.getDelta(); // Change in time for frame-rate independence
    frameCount++;

    if (currentTime - lastFrameTime >= frameInterval) {

    if (frameCount % 60 == 0) {
        updateLOD();
    } // Update level of detail every 60 frames

    celestialBodies.forEach(({mesh, pivot, data}) => {

        if (data.corona && camera.position.distanceTo(mesh.position) < lodDistances.High) {
            const sunCorona = mesh.children.find(child => child instanceof THREE.Sprite);
            const scale = 15 + Math.sin(Date.now() * 0.002) * 1;
            sunCorona.scale.set(scale, scale, 0.002);
        } // Animate the corona to expand and contract if the camera is near

        if (!isPaused) {
            if (data.rotationSpeed) {
                mesh.rotation.y += data.rotationSpeed * speedModifier;
            }
            if (pivot && data.orbitSpeed) {
                pivot.rotation.y += data.orbitSpeed * speedModifier;
            }
            if (data.precessionSpeed) {
                mesh.rotation.y += data.precessionSpeed * speedModifier;
            }
            if (data.rings && camera.position.distanceTo(mesh.position) < lodDistances.High) {
                mesh.children.find(child => child.geometry?.type == 'RingGeometry').rotation.z += 0.025 * speedModifier;
            }
        } // Animate the main orbits/rotations/precession of all objects if not paused
    });

    if (!isPaused) {
        asteroidBelt.asteroids.rotation.y += 0.0005 * speedModifier;
        asteroidBelt.kuiperBelt.rotation.y += 0.0005 * speedModifier; // Animate the belt movements if not paused
    }

    // If user has clicked on a celestial object, then guide camera movement to it
    if (isFollowing && targetBody) {
        const targetPos = new THREE.Vector3();
        targetBody.mesh.getWorldPosition(targetPos);
        
        // Calculate where the camera is in relation to the clicked object and the offset
        const matrixWorld = targetBody.pivot ? targetBody.pivot.matrixWorld : targetBody.mesh.matrixWorld;
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.extractRotation(matrixWorld);
        const scale = targetBody.data.size;
        const zoomFactor = 2;
        const localOffset = new THREE.Vector3(scale * zoomFactor, scale * zoomFactor * 0.6, scale * zoomFactor);
        const worldOffset = localOffset.clone().applyMatrix4(rotationMatrix); 
        const desiredCameraPos = targetPos.clone().add(worldOffset);

        // Then initiate the camera transition
        if (cameraTransition.isActive) {
            const elapsed = performance.now() - cameraTransition.startTime;
            const progress = Math.min(elapsed / cameraTransition.duration, 1);
        
            const easedProgress = easeInOutCubic(progress);
        
            camera.position.lerpVectors(
                cameraTransition.startPosition, 
                desiredCameraPos, 
                easedProgress 
            );
            controls.target.lerpVectors(
                cameraTransition.startTarget,
                targetPos,
                easedProgress  
            );
        
            if (progress >= 1) {
                cameraTransition.isActive = false;
            }
        } 
        else 
        {
        camera.position.lerp(desiredCameraPos, 0.1); // continue to follow after the transition
        controls.target.lerp(targetPos, 0.1);
        }
    }

    if (cockpitMode) {
        updateShipMovement(change);
        controls.enabled = false;
        document.getElementById('cockpitControls').classList.add('visible');
        document.getElementById('infoPane').classList.remove('visible');
        setTimeout(() => {
        document.getElementById("sidebar").style.display = 'none';
        }, 10); // If in free roam, aka cockpit mode, hide certain UI elements
        
        if (frameCount % 2 == 0) {
            const shake = 0.00002;
            cockpitCamera.position.x = cockpitCamera.position.x + ((Math.sin(Date.now() * 0.01) * shake));
            cockpitCamera.position.y = cockpitCamera.position.y + (Math.cos(Date.now() * 0.015) * shake * 0.5);
        }
        renderer.render(scene, cockpitCamera);
        return; // Add camera shaske
    }
    else
    {
        document.getElementById("sidebar").style.display = 'block';
        document.getElementById('cockpitControls').classList.remove('visible');
    }
    controls.update();
    renderer.render(scene, camera);
}
}

// Dispose of geometries, materials and textures once done to free memory
function dispose () {
    // Dispose of the celestial bodies
    celestialBodies.forEach(({mesh}) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach( mat => {
                    if (mat.map) mat.map.dispose();
                    mat.dispose();
                });
            }
            else 
            {
                if (mesh.material.map) mesh.material.map.dispose();
                mesh.material.dispose();
            }
        }
        // Dispose of child objects e.g. moons, rings, atmospheres, corona, ISS
        mesh.children.forEach(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (child.material.map) child.material.map.dispose();
                child.material.dispose();
            }
        });
    });

    // Dispose of belts
    if (asteroidBelt) {
        if (asteroidBelt.asteroids) {
            asteroidBelt.asteroids.geometry.dispose();
            asteroidBelt.asteroids.material.dispose();
        }
        if (asteroidBelt.kuiperBelt) {
            asteroidBelt.kuiperBelt.geometry.dispose();
            asteroidBelt.kuiperBelt.material.dispose();
        }
    }
    // Clear the cache of textures
    textureCache.forEach(texture => texture.dispose());
    textureCache.clear();

    // Clear the renderer
    if (renderer) {
        renderer.dispose();
    }
}

window.addEventListener('beforeunload', dispose()); // Call the dispose function on unloading

// 
function onClick (event) {
    speedModifier = 1; // Reset the speed when clicking 
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1; // Mouse coordinates to device coordinates 
    
    setTimeout(() => {
        infoPane.classList.remove('visible');
    }, 10); // Hide the info panel

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(
        celestialBodies.map(obj => obj.mesh), true
    ); // Cast a ray from the camera to the clicked position

    // If the clicked area was that of a celestial body, change the color as a visual confirmation and get its data
    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        clickedObject.material.color.set(0xFF0000);
        setTimeout(()=> {
        clickedObject.material.color.set(0xFFFFFF);
        }, 50);

        targetBody = celestialBodies.find(obj => obj.mesh == clickedObject);

        if (targetBody) {
            flyToObject(targetBody);
        }
    } 
    else // Or else if the user clicks empty space, then hide the info pane, no target body is then selected, camera does not track a target
    {
        const infoPane = document.getElementById("infoPane");
        infoPane.style.display = 'none';
        targetBody = null;
        isFollowing = false;
        cameraTransition.isActive = false;
    }
    
}

// Function to create celestial bodies from the information in the JSON file
function createCelestialBody(data, parentGroup = scene) {
    const texture = loadTexture(data.texture);

    const geometry = new THREE.SphereGeometry(data.size, 32, 32); // Make a sphere
    const isSun = data.name.toLowerCase() == 'sun';

    const material = isSun
        ? new THREE.MeshBasicMaterial({map: texture})
        : new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.1, 
            metalness: 0
        }); // If its the sun, use a basic mesh material instead of standard, because it contains a point light that must be emitted

    const mesh = new THREE.Mesh(geometry, material);

    if (isSun) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;

        const light = new THREE.PointLight(0xFFFFFF, 2, 0, 0.05);
        light.position.copy(mesh.position);
        light.castShadow = true;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 28000;

        scene.add(light);
        scene.add(mesh);
        sunLight = {light, mesh};
    }
    else // Or else, enable shadows
    {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }

    if (data.axialTilt) {
        mesh.rotation.z = data.axialTilt;
        mesh.rotation.y += data.precessionSpeed;
    } // Apply axial tilt and precession

    const orbitalPlane = new THREE.Group();
    const pivot = new THREE.Group(); // Create an orbital system

    if (data.isSpaceMissionObject) { // If it's a custom 3D obkect e.g. the ISS, create it and apply its properties
        const loader = new OBJLoader();
        loader.load(data.texture, obj => {
            const spaceObject = obj;
            const downSize = data.size / 1000;
            spaceObject.scale.set(downSize, downSize, downSize);

            const orbitalPlane = new THREE.Group();
            const pivot = new THREE.Group();

            const offset = data.orbitOffset;
            orbitalPlane.position.set(offset.x, offset.y, offset.z);

            if (data.orbitalTilt) orbitalPlane.rotation.x = data.orbitalTilt;

            spaceObject.position.x = data.distance;

            pivot.add(spaceObject);
            orbitalPlane.add(pivot);
            parentGroup.add(orbitalPlane);
        
            celestialBodies.push({ mesh: spaceObject, pivot, orbitalPlane, data });
        });
        return;
    }

    if (data.orbitalTilt) {
        orbitalPlane.rotation.x = data.orbitalTilt;
    } // Apply the orbital tilt 
    orbitalPlane.add(pivot);

    if (data.distance != undefined) {
        mesh.position.x = data.distance;
        pivot.add(mesh);
        parentGroup.add(orbitalPlane);
    }
    else
    {
        parentGroup.add(mesh);
    } // Position the object at its orbital distance

    if (data.corona) {
        const corona = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: new THREE.TextureLoader().load('./images/corona.png'),
                color: 0xFFCC66,
                opacity: 0.6,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                alphaTest: 0.1
            })
        );
        corona.scale.set(15, 15, 0.002);
        mesh.add(corona);
    } // It the celestial body has a corona, create a corona

    if (data.atmosphere) {
        const atmosphere = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: new THREE.TextureLoader().load(data.atmosphere),
                opacity: 0.4,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                depthTest: false,
                alphaTest: 0.001
            })
        );
        atmosphere.scale.set(data.size+2, data.size+2, 1);
        mesh.add(atmosphere);
    } // If the body has an atmosphere, create it

    if (data.trail && data.distance != undefined) {
        const trailGeometry = new THREE.RingGeometry(data.distance - 0.04, data.distance + 0.04, 128);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: 0xADD8E6, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.4
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI / 2;
        orbitalPlane.add(trail);

        const lastBodyIndex = celestialBodies.length;
        setTimeout(() => {
            if (celestialBodies[lastBodyIndex]) {
                celestialBodies[lastBodyIndex].trail = trail;
            }
        }, 0);
    } // If the object has an orbital trail, create it and in the path of the celestial body

    if (data.moons && Array.isArray(data.moons) && data.moons.name != 'ISS') {
        data.moons.forEach(moonData => createCelestialBody(moonData, mesh));
    } // Recursively create moons

    if (data.rings) {
        const ringsTexture = new THREE.TextureLoader().load(data.rings.texture);
        const ringsGeometry = new THREE.RingGeometry(data.rings.innerRadius, data.rings.outerRadius, 32);
        const ringsMaterial = new THREE.MeshBasicMaterial({
            map: ringsTexture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1,
        });
        const ringsMesh = new THREE.Mesh(ringsGeometry, ringsMaterial);
        ringsMesh.rotation.x = Math.PI / 2;
        ringsMesh.rotation.z = data.rings.tilt || 0;
        mesh.add(ringsMesh);
    }
    celestialBodies.push({mesh, pivot, data});
    return mesh;
} // If the object has rings, create ring shapes, make them visible from both sides (top and bottom)

// Function to create the asteroid and Kuiper belts
function createBelts(numAsteroids = 500, numKuiperBelt = 200, innerRadius = 32, outerRadius = 45, kuiperInnerRadius = 460, kuiperOuterRadius = 960) {
    const size = 0.05;
    const kuiperSize = 0.5;
    const geometry = new THREE.SphereGeometry(size, 4, 4);
    const kuiperGeometry = new THREE.SphereGeometry(kuiperSize, 4, 4);
    const material = new THREE.MeshBasicMaterial({color: 0x86775f});
    const kuiperMaterial = new THREE.MeshBasicMaterial({color: 0xBDDEEC});
    const asteroids = new THREE.InstancedMesh(geometry, material, numAsteroids);
    const kuiperBelt = new THREE.InstancedMesh(kuiperGeometry, kuiperMaterial, numKuiperBelt); // Setup up geometries and materials for both belts

    const temp = new THREE.Object3D();

    for (let i = 0; i < numAsteroids; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 5;

        temp.position.set(x, y, z);
        temp.rotation.set(Math.random(), Math.random(), Math.random());
        temp.updateMatrix();
        asteroids.setMatrixAt(i, temp.matrix); // Create the asteroids
    }
    for (let j = 0; j < numKuiperBelt; j++) {
        const angle = Math.random() * Math.PI * 2;
        const kuiperRadius = kuiperInnerRadius + Math.random() * (kuiperOuterRadius - kuiperInnerRadius);

        const kuiperX = Math.cos(angle) * kuiperRadius;
        const kuiperZ = Math.sin(angle) * kuiperRadius;
        const kuiperY = (Math.random() - 0.5) * 15;

        temp.position.set(kuiperX, kuiperY, kuiperZ);
        temp.rotation.set(Math.random(), Math.random(), Math.random());
        temp.updateMatrix();
        kuiperBelt.setMatrixAt(j, temp.matrix); // Create the Kuiper belt asteroids
    }
    asteroids.instanceMatrix.needsUpdate = true;
    kuiperBelt.instanceMatrix.needsUpdate = true;
    scene.add(asteroids);
    scene.add(kuiperBelt); // Add them to the scene
    return {asteroids, kuiperBelt}; 
}

function createStarField (count = 250, radius = 2800) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2; // Azimuth angle
        const phi = Math.acos((Math.random() * 2) - 1); // Polar angle
        const r = radius; // Equidistant from the origin (0, 0, 0)

        const x =  r * Math.sin(phi) * Math.cos(theta);
        const y =  r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi); // Convert to Cartesian coordinates 

        positions.push(x, y, z); // Add coordinates to the positions array
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 15,
        sizeAttenuation: true
    }); // Create star mesh
    const stars = new THREE.Points(geometry, material); 
    scene.add(stars); 
}

// Function to initiate the camera transition and to follow the target body
function flyToObject(listMesh) {
    targetBody = listMesh; // Target body is the mesh that is passed from the onClick methods or on a sidebar click
    isFollowing = true;

    cameraTransition.isActive = true; // Camera transition is now active
    cameraTransition.startTime = performance.now();
    cameraTransition.startPosition.copy(camera.position);
    cameraTransition.startTarget.copy(controls.target);

    if (listMesh.data.status == 'Moon') {
        document.getElementById("speedSlider").hidden = true;
        document.getElementById('speedDisplay').hidden = true;
        speedModifier = 0.3;
    } // If the target body is a moon, slow the speed down and hide the speed controls
    else
    {
        document.getElementById("speedSlider").hidden = false;
        document.getElementById('speedDisplay').hidden = false;
        speedModifier = 1; // Else normal speed. I made this decision as the moons usually move too quickly for the camera to keep up
    }
    if (!listMesh.data.isSpaceMissionObject) {
        showInfoPane(listMesh); // If it target body is not a custom 3D object, show the information pane 
    }
    else
    {
        infoPane.classList.remove('visible');
    }
}

// Function to populate the information pane with the JSON data of the celestial object
function showInfoPane (body) {
    const infoPane = document.getElementById("infoPane");
    const objectInfo  = body.data;
    const infoTitle = document.getElementById("infoTitle");
    const infoStatus = document.getElementById("status");
    const infoSize = document.getElementById("infoSize");
    const infoDistance = document.getElementById("infoDistance");
    const infoMoonDistance = document.getElementById("infoMoonDistance");
    const infoOrbit = document.getElementById("orbit");
    const infoDay = document.getElementById("day");
    const infoTemp = document.getElementById("temp");
    const infoAtmos = document.getElementById("atmosComp");
    const infoMoon = document.getElementById("moonNum");
    const infoFact = document.getElementById("funFact");

    setTimeout(() => {
    infoPane.classList.add("visible");
    }, 10); 

    infoTitle.textContent = objectInfo.name.charAt(0).toUpperCase() + objectInfo.name.slice(1);
    infoStatus.textContent = objectInfo.status;
    infoSize.textContent = 'Diameter: ' + objectInfo.diameter + ' km';

    if(objectInfo.distanceFromSun != undefined) {
        infoDistance.textContent = 'Distance from sun: ' + objectInfo.distanceFromSun + ' million km';
        infoDistance.style.display = 'block';
    }
    else
    {
        infoDistance.style.display = 'none';
    }
    if (objectInfo.distanceFromPlanet != undefined) {
        infoMoonDistance.textContent = 'Distance from planet: ' + objectInfo.distanceFromPlanet + ' million km';
    }
    else
    {
        infoMoonDistance.style.display = 'none';
    }
    if (objectInfo.orbit) {
        infoOrbit.textContent = 'Orbital period: ' + objectInfo.orbit + ' earth days';
    }
    else
    {
        infoOrbit.textContent = '';
    }

    infoDay.textContent = 'Rotational period: ' + objectInfo.day;
    infoTemp.textContent = 'Temperatures: ' + objectInfo.temp;
    infoAtmos.textContent = 'Atmosphere: ' + objectInfo.atmosComp;

    if (objectInfo.moons != undefined || objectInfo.moonNum != null) {
        infoMoon.textContent = 'Moons: ' + objectInfo.moonNum;
    }
    else
    {
        infoMoon.textContent = '';
    }

    infoFact.textContent = 'Fun fact: ' + objectInfo.funFact;
    infoPane.style.display = 'block';
}

// Function to create the 3D ship
function createShip() {
    const shipGroup = new THREE.Group(); // Make a group to hold the components and attributes
    const geom = new THREE.ConeGeometry(0.2, 0.6, 6);
    const mater = new THREE.MeshBasicMaterial({color: 0xFFFFFF});
    mater.side = THREE.DoubleSide;
    const placeholderShipMesh = new THREE.Mesh(geom, mater); 
    placeholderShipMesh.rotation.x = Math.PI / 2; 
    shipGroup.add(placeholderShipMesh); // First create a placeholder cone whilst the ship model is attempted to be loaded

    ship = shipGroup;
    ship.position.set(0, 0, 30);
    scene.add(ship); // STarting position of the ship

        const loader = new OBJLoader();
        loader.load(
            './models/spaceship.obj', // Load this 3D object, scale it, rotate it to face the sun and remove the placeholder ship
            function (obj) {

                const loadedRocketModel = obj;

                loadedRocketModel.rotation.y = Math.PI;
                loadedRocketModel.scale.set(0.005, 0.005, 0.005);
                loadedRocketModel.position.set(0, 0, 0); 

                shipGroup.remove(placeholderShipMesh);
                shipGroup.add(loadedRocketModel);
                geom.dispose();
                mater.dispose();
        });
}

// Function to create a camera with a narrow FOV for the free roam AKA cockpit mode
function createCockpitCamera () {
    cockpitCamera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.01, 200000);
    cockpitCamera.position.set(0, 0.01, 0.1);
    ship.add(cockpitCamera);
}