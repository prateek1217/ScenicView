import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import './index.css';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
// import AirplaneExperience from './components/AirplaneExperience';
import axios from 'axios';

// First, let's dynamically import Three.js to avoid build issues
let THREE: any = null;

const loadThreeJS = async () => {
  if (!THREE) {
    try {
      THREE = await import('three');
    } catch (error) {
      console.error('Failed to load Three.js:', error);
    }
  }
  return THREE;
};

// 3D AirplaneExperience Component with Three.js
interface AirplaneExperienceProps {
  selectedSeat?: string;
  onSeatChange?: (seat: string) => void;
}

// Seat positions in 3D space (relative to airplane interior)
const SEAT_POSITIONS_3D: { [key: string]: { position: [number, number, number], target: [number, number, number], row: number, side: string } } = {
  'A1': { position: [-1.5, 1.2, 4], target: [0, 1, 0], row: 1, side: 'Left' },
  'B1': { position: [-0.5, 1.2, 4], target: [0, 1, 0], row: 1, side: 'Left' },
  'C1': { position: [0.5, 1.2, 4], target: [0, 1, 0], row: 1, side: 'Right' },
  'D1': { position: [1.5, 1.2, 4], target: [0, 1, 0], row: 1, side: 'Right' },
  'A2': { position: [-1.5, 1.2, 2], target: [0, 1, 0], row: 2, side: 'Left' },
  'B2': { position: [-0.5, 1.2, 2], target: [0, 1, 0], row: 2, side: 'Left' },
  'C2': { position: [0.5, 1.2, 2], target: [0, 1, 0], row: 2, side: 'Right' },
  'D2': { position: [1.5, 1.2, 2], target: [0, 1, 0], row: 2, side: 'Right' },
  'A3': { position: [-1.5, 1.2, 0], target: [0, 1, 0], row: 3, side: 'Left' },
  'B3': { position: [-0.5, 1.2, 0], target: [0, 1, 0], row: 3, side: 'Left' },
  'C3': { position: [0.5, 1.2, 0], target: [0, 1, 0], row: 3, side: 'Right' },
  'D3': { position: [1.5, 1.2, 0], target: [0, 1, 0], row: 3, side: 'Right' },
  'A4': { position: [-1.5, 1.2, -2], target: [0, 1, 0], row: 4, side: 'Left' },
  'B4': { position: [-0.5, 1.2, -2], target: [0, 1, 0], row: 4, side: 'Left' },
  'C4': { position: [0.5, 1.2, -2], target: [0, 1, 0], row: 4, side: 'Right' },
  'D4': { position: [1.5, 1.2, -2], target: [0, 1, 0], row: 4, side: 'Right' },
  'A5': { position: [-1.5, 1.2, -4], target: [0, 1, 0], row: 5, side: 'Left' },
  'B5': { position: [-0.5, 1.2, -4], target: [0, 1, 0], row: 5, side: 'Left' },
  'C5': { position: [0.5, 1.2, -4], target: [0, 1, 0], row: 5, side: 'Right' },
  'D5': { position: [1.5, 1.2, -4], target: [0, 1, 0], row: 5, side: 'Right' },
};

const AirplaneExperience: React.FC<AirplaneExperienceProps> = ({ selectedSeat, onSeatChange }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>();
  const rendererRef = useRef<any>();
  const cameraRef = useRef<any>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isThreeLoaded, setIsThreeLoaded] = useState(false);

  // Load Three.js and initialize scene
  useEffect(() => {
    const initThreeJS = async () => {
      try {
        const threeModule = await loadThreeJS();
        if (!threeModule) throw new Error('Failed to load Three.js');
        
        setIsThreeLoaded(true);
        setTimeout(() => {
          initializeScene(threeModule);
        }, 100);
      } catch (err) {
        setError('Failed to load 3D engine. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initThreeJS();
  }, []);

  const initializeScene = (THREE: any) => {
    if (!mountRef.current) return;

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x87CEEB); // Sky blue
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 2, 6);
      cameraRef.current = camera;

      // Enhanced Renderer setup for professional quality
      const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setClearColor(0x87CEEB, 1);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.shadowMap.autoUpdate = true;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;

      mountRef.current.appendChild(renderer.domElement);

      // Enhanced Lighting setup for professional look
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);

      // Main directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      directionalLight.shadow.camera.left = -10;
      directionalLight.shadow.camera.right = 10;
      directionalLight.shadow.camera.top = 10;
      directionalLight.shadow.camera.bottom = -10;
      scene.add(directionalLight);

      // Additional fill light for better illumination
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
      fillLight.position.set(-5, 5, -5);
      scene.add(fillLight);

      // Rim light for better definition
      const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
      rimLight.position.set(0, 5, -10);
      scene.add(rimLight);

      // Create airplane interior
      createAirplaneInterior3D(scene, THREE);

      // Create skybox/environment
      createSkybox3D(scene, THREE);

      // Setup controls
      setupControls(camera, renderer.domElement, THREE);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      // Handle window resize
      const handleResize = () => {
        if (mountRef.current && camera && renderer) {
          camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        }
      };

      window.addEventListener('resize', handleResize);

      setIsLoading(false);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    } catch (err) {
      setError('Failed to initialize 3D scene. Please refresh the page.');
      setIsLoading(false);
    }
  };

  const createAirplaneInterior3D = (scene: any, THREE: any) => {
    // Simple basic airplane structure
    createBasicFuselage3D(scene, THREE);
    createBasicWings3D(scene, THREE);
    createBasicTail3D(scene, THREE);
    createBasicCockpit3D(scene, THREE);
    
    // Simple interior components
    createBasicCabinInterior3D(scene, THREE);
    createBasicSeats3D(scene, THREE);
    createBasicWindows3D(scene, THREE);
    createBasicOverheadCompartments3D(scene, THREE);
    createBasicCabinWalls3D(scene, THREE);
    createBasicCeiling3D(scene, THREE);
  };

  const createSeats3D = (scene: any, THREE: any) => {
    Object.entries(SEAT_POSITIONS_3D).forEach(([seatId, seatData]) => {
      // Enhanced Seat base with better materials
      const seatGeometry = new THREE.BoxGeometry(0.45, 0.12, 0.45);
      const seatMaterial = new THREE.MeshPhongMaterial({ 
        color: selectedSeat === seatId ? 0x3498db : 0x2c3e50,
        shininess: 20
      });
      const seat = new THREE.Mesh(seatGeometry, seatMaterial);
      seat.position.set(...seatData.position);
      seat.position.y = 0.5;
      seat.castShadow = true;
      seat.receiveShadow = true;
      seat.userData = { seatId };
      scene.add(seat);

      // Enhanced Seat back with better shape
      const backGeometry = new THREE.BoxGeometry(0.45, 0.9, 0.08);
      const seatBack = new THREE.Mesh(backGeometry, seatMaterial);
      seatBack.position.set(...seatData.position);
      seatBack.position.y = 0.95;
      seatBack.position.z -= 0.2;
      seatBack.castShadow = true;
      scene.add(seatBack);

      // Add seat armrests
      const armrestGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.4);
      const armrestMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x34495e,
        shininess: 30
      });
      
      // Left armrest
      const leftArmrest = new THREE.Mesh(armrestGeometry, armrestMaterial);
      leftArmrest.position.set(...seatData.position);
      leftArmrest.position.x -= 0.25;
      leftArmrest.position.y = 0.65;
      leftArmrest.castShadow = true;
      scene.add(leftArmrest);
      
      // Right armrest
      const rightArmrest = new THREE.Mesh(armrestGeometry, armrestMaterial);
      rightArmrest.position.set(...seatData.position);
      rightArmrest.position.x += 0.25;
      rightArmrest.position.y = 0.65;
      rightArmrest.castShadow = true;
      scene.add(rightArmrest);

      // Enhanced Seat label with better styling
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 256;
      canvas.height = 128;
      
      // Create gradient background
      const gradient = context.createLinearGradient(0, 0, 0, 128);
      gradient.addColorStop(0, selectedSeat === seatId ? '#3498db' : '#34495e');
      gradient.addColorStop(1, selectedSeat === seatId ? '#2980b9' : '#2c3e50');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 256, 128);
      
      // Add border
      context.strokeStyle = '#ffffff';
      context.lineWidth = 4;
      context.strokeRect(2, 2, 252, 124);
      
      // Add text
      context.fillStyle = '#ffffff';
      context.font = 'bold 32px Arial';
      context.textAlign = 'center';
      context.fillText(seatId, 128, 75);
      
      // Add subtitle
      context.font = '16px Arial';
      context.fillText(`Row ${seatData.row}`, 128, 100);

      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
      });
      const labelGeometry = new THREE.PlaneGeometry(0.4, 0.2);
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(...seatData.position);
      label.position.y = 1.6;
      scene.add(label);
    });
  };

  const createWindows3D = (scene: any, THREE: any) => {
    // Enhanced window geometry with frame
    const windowFrameGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.05);
    const windowFrameMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x34495e,
      shininess: 40
    });
    
    const windowGlassGeometry = new THREE.PlaneGeometry(0.6, 0.4);
    const windowGlassMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.8,
      shininess: 100
    });

    // Left side windows with frames
    for (let i = 0; i < 6; i++) {
      // Window frame
      const windowFrame = new THREE.Mesh(windowFrameGeometry, windowFrameMaterial);
      windowFrame.position.set(-2.1, 0.5, 4 - i * 1.5);
      windowFrame.castShadow = true;
      scene.add(windowFrame);
      
      // Window glass
      const windowGlass = new THREE.Mesh(windowGlassGeometry, windowGlassMaterial);
      windowGlass.position.set(-2.1, 0.5, 4 - i * 1.5);
      windowGlass.rotation.y = Math.PI / 2;
      scene.add(windowGlass);
    }

    // Right side windows with frames
    for (let i = 0; i < 6; i++) {
      // Window frame
      const windowFrame = new THREE.Mesh(windowFrameGeometry, windowFrameMaterial);
      windowFrame.position.set(2.1, 0.5, 4 - i * 1.5);
      windowFrame.castShadow = true;
      scene.add(windowFrame);
      
      // Window glass
      const windowGlass = new THREE.Mesh(windowGlassGeometry, windowGlassMaterial);
      windowGlass.position.set(2.1, 0.5, 4 - i * 1.5);
      windowGlass.rotation.y = -Math.PI / 2;
      scene.add(windowGlass);
    }
  };

  const createOverheadCompartments3D = (scene: any, THREE: any) => {
    const compartmentGeometry = new THREE.BoxGeometry(4.2, 0.5, 0.8);
    const compartmentMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xe2e8f0,
      shininess: 25
    });

    for (let i = 0; i < 5; i++) {
      const compartment = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
      compartment.position.set(0, 1.9, 4 - i * 2);
      compartment.castShadow = true;
      compartment.receiveShadow = true;
      scene.add(compartment);
      
      // Add compartment handles
      const handleGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.05);
      const handleMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2c3e50,
        shininess: 50
      });
      
      const handle = new THREE.Mesh(handleGeometry, handleMaterial);
      handle.position.set(0, 1.65, 4 - i * 2);
      handle.castShadow = true;
      scene.add(handle);
    }
  };

  const createCabinWalls3D = (scene: any, THREE: any) => {
    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(14, 3);
    const wallMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf8f9fa,
      shininess: 20
    });
    
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-2.5, 0.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.position.set(2.5, 0.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);
  };

  const createCeilingPanels3D = (scene: any, THREE: any) => {
    const ceilingGeometry = new THREE.PlaneGeometry(5, 14);
    const ceilingMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xf1f5f9,
      shininess: 15
    });
    
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, 2.5, 0);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    scene.add(ceiling);
    
    // Add ceiling lights
    for (let i = 0; i < 7; i++) {
      const lightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(0, 2.4, 4 - i * 1.5);
      scene.add(light);
    }
  };

  const createAisleLighting3D = (scene: any, THREE: any) => {
    // Add aisle floor lighting
    for (let i = 0; i < 7; i++) {
      const lightGeometry = new THREE.PlaneGeometry(0.8, 0.1);
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4ade80,
        emissive: 0x4ade80,
        emissiveIntensity: 0.2
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(0, -1.15, 4 - i * 1.5);
      light.rotation.x = -Math.PI / 2;
      scene.add(light);
    }
  };

  // Basic Airplane Components
  const createBasicFuselage3D = (scene: any, THREE: any) => {
    // Simple fuselage body
    const fuselageGeometry = new THREE.CylinderGeometry(2.5, 2.2, 16, 16);
    const fuselageMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff
    });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.z = Math.PI / 2;
    scene.add(fuselage);

    // Simple nose cone
    const noseGeometry = new THREE.ConeGeometry(2.5, 3, 8);
    const noseMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 0, 9.5);
    nose.rotation.x = Math.PI / 2;
    scene.add(nose);
  };

  const createBasicWings3D = (scene: any, THREE: any) => {
    // Simple wings
    const wingGeometry = new THREE.BoxGeometry(12, 0.2, 2);
    const wingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff
    });
    
    // Left wing
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-6, 0, 0);
    scene.add(leftWing);
    
    // Right wing
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(6, 0, 0);
    scene.add(rightWing);
  };

  const createBasicTail3D = (scene: any, THREE: any) => {
    // Simple tail fin
    const tailFinGeometry = new THREE.BoxGeometry(0.1, 2, 1);
    const tailFinMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff
    });
    const tailFin = new THREE.Mesh(tailFinGeometry, tailFinMaterial);
    tailFin.position.set(0, 1, -8);
    scene.add(tailFin);
  };

  const createBasicCockpit3D = (scene: any, THREE: any) => {
    // Simple cockpit
    const cockpitGeometry = new THREE.SphereGeometry(2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x000000,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0, 8);
    cockpit.rotation.x = Math.PI;
    scene.add(cockpit);
  };

  const createBasicCabinInterior3D = (scene: any, THREE: any) => {
    // Simple cabin floor
    const floorGeometry = new THREE.PlaneGeometry(12, 4);
    const floorMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x34495e
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.2;
    scene.add(floor);
  };

  const createBasicSeats3D = (scene: any, THREE: any) => {
    Object.entries(SEAT_POSITIONS_3D).forEach(([seatId, seatData]) => {
      // Simple seat base
      const seatGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.5);
      const seatMaterial = new THREE.MeshLambertMaterial({ 
        color: selectedSeat === seatId ? 0x3498db : 0x2c3e50
      });
      const seat = new THREE.Mesh(seatGeometry, seatMaterial);
      seat.position.set(...seatData.position);
      seat.position.y = 0.5;
      seat.userData = { seatId };
      scene.add(seat);

      // Simple seat back
      const backGeometry = new THREE.BoxGeometry(0.5, 0.8, 0.1);
      const seatBack = new THREE.Mesh(backGeometry, seatMaterial);
      seatBack.position.set(...seatData.position);
      seatBack.position.y = 0.9;
      seatBack.position.z -= 0.2;
      scene.add(seatBack);

      // Simple seat label
      const labelGeometry = new THREE.PlaneGeometry(0.3, 0.15);
      const labelMaterial = new THREE.MeshLambertMaterial({ 
        color: selectedSeat === seatId ? 0x3498db : 0x2c3e50
      });
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(...seatData.position);
      label.position.y = 1.2;
      scene.add(label);
    });
  };

  const createBasicWindows3D = (scene: any, THREE: any) => {
    // Simple windows
    const windowGeometry = new THREE.PlaneGeometry(0.6, 0.4);
    const windowMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x87CEEB, 
      transparent: true, 
      opacity: 0.7 
    });

    // Left side windows
    for (let i = 0; i < 6; i++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(-2.1, 0.5, 4 - i * 1.5);
      window.rotation.y = Math.PI / 2;
      scene.add(window);
    }

    // Right side windows
    for (let i = 0; i < 6; i++) {
      const window = new THREE.Mesh(windowGeometry, windowMaterial);
      window.position.set(2.1, 0.5, 4 - i * 1.5);
      window.rotation.y = -Math.PI / 2;
      scene.add(window);
    }
  };

  const createBasicOverheadCompartments3D = (scene: any, THREE: any) => {
    // Simple overhead compartments
    for (let i = 0; i < 4; i++) {
      const compartmentGeometry = new THREE.BoxGeometry(4, 0.4, 0.8);
      const compartmentMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xe2e8f0
      });
      
      const compartment = new THREE.Mesh(compartmentGeometry, compartmentMaterial);
      compartment.position.set(0, 1.8, 4 - i * 2);
      scene.add(compartment);
    }
  };

  const createBasicCabinWalls3D = (scene: any, THREE: any) => {
    // Simple cabin walls
    const leftWallGeometry = new THREE.PlaneGeometry(12, 3);
    const wallMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xf8f9fa
    });
    
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-2.5, 0.5, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.position.set(2.5, 0.5, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
  };

  const createBasicCeiling3D = (scene: any, THREE: any) => {
    // Simple ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(5, 12);
    const ceilingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xf1f5f9
    });
    
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.position.set(0, 2.5, 0);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);
    
    // Simple ceiling lights
    for (let i = 0; i < 6; i++) {
      const lightGeometry = new THREE.SphereGeometry(0.08, 8, 8);
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(0, 2.4, 4 - i * 1.5);
      scene.add(light);
    }
  };

  const createRealisticAisleLighting3D = (scene: any, THREE: any) => {
    // Enhanced aisle floor lighting with proper aviation standards
    for (let i = 0; i < 8; i++) {
      const lightGeometry = new THREE.PlaneGeometry(1.0, 0.12);
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4ade80,
        emissive: 0x4ade80,
        emissiveIntensity: 0.3
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(0, -1.45, 6 - i * 1.8);
      light.rotation.x = -Math.PI / 2;
      scene.add(light);
    }
  };

  const createSkybox3D = (scene: any, THREE: any) => {
    // Create a simple gradient skybox
    const skyGeometry = new THREE.SphereGeometry(500, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x87CEEB, 
      side: THREE.BackSide 
    });
    const skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(skybox);

    // Add some clouds
    const cloudGeometry = new THREE.SphereGeometry(15, 16, 16);
    const cloudMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.6 
    });

    for (let i = 0; i < 8; i++) {
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      cloud.position.set(
        (Math.random() - 0.5) * 600,
        Math.random() * 80 + 20,
        (Math.random() - 0.5) * 600
      );
      cloud.scale.setScalar(Math.random() * 1.5 + 0.5);
      scene.add(cloud);
    }
  };

  const setupControls = (camera: any, domElement: HTMLElement, THREE: any) => {
    let isMouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let cameraTheta = 0;
    let cameraPhi = Math.PI / 2;
    let cameraRadius = 6;

    const updateCamera = () => {
      camera.position.x = cameraRadius * Math.sin(cameraPhi) * Math.cos(cameraTheta);
      camera.position.y = cameraRadius * Math.cos(cameraPhi) + 1;
      camera.position.z = cameraRadius * Math.sin(cameraPhi) * Math.sin(cameraTheta);
      camera.lookAt(0, 1, 0);
    };

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      cameraTheta -= deltaX * 0.01;
      cameraPhi += deltaY * 0.01;
      cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi));

      updateCamera();

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onWheel = (event: WheelEvent) => {
      cameraRadius += event.deltaY * 0.01;
      cameraRadius = Math.max(3, Math.min(15, cameraRadius));
      updateCamera();
    };

    domElement.addEventListener('mousedown', onMouseDown);
    domElement.addEventListener('mousemove', onMouseMove);
    domElement.addEventListener('mouseup', onMouseUp);
    domElement.addEventListener('wheel', onWheel);
    domElement.style.cursor = 'grab';

    domElement.addEventListener('mousedown', () => {
      domElement.style.cursor = 'grabbing';
    });
    
    domElement.addEventListener('mouseup', () => {
      domElement.style.cursor = 'grab';
    });
  };

  // Update camera position when seat changes
  useEffect(() => {
    if (selectedSeat && SEAT_POSITIONS_3D[selectedSeat] && cameraRef.current) {
      const seatData = SEAT_POSITIONS_3D[selectedSeat];
      const camera = cameraRef.current;
      
      // Move camera to seat position with offset
      const startPos = camera.position.clone();
      const endPos = new THREE.Vector3(
        seatData.position[0] + 0.2,
        seatData.position[1] + 0.5,
        seatData.position[2] + 1
      );
      
      const duration = 1500;
      const startTime = Date.now();
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(startPos, endPos, easeProgress);
        camera.lookAt(...seatData.target);
        
        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        }
      };
      
      animateCamera();
    }
  }, [selectedSeat]);

  const handleSeatSelection = (seat: string) => {
    if (onSeatChange) {
      onSeatChange(seat);
    }
  };

  if (!isThreeLoaded && !error) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛩️</div>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>Loading 3D Engine...</div>
          <div style={{ fontSize: '16px', opacity: 0.8 }}>Preparing your immersive airplane experience</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          color: 'white',
          fontSize: '18px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '20px', fontSize: '48px' }}>✈️</div>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>Loading 3D Airplane...</div>
            <div style={{ fontSize: '16px', opacity: 0.8 }}>Rendering immersive cabin experience</div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          Error: {error}
        </div>
      )}

      {/* Seat selection UI */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 100,
        minWidth: '220px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🪑 Select Your Seat</h3>
        <select
          value={selectedSeat || ''}
          onChange={(e) => handleSeatSelection(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '2px solid #3498db',
            fontSize: '16px',
            background: 'white',
            marginBottom: '15px'
          }}
        >
          <option value="">Choose a seat...</option>
          {Object.keys(SEAT_POSITIONS_3D).map(seatId => (
            <option key={seatId} value={seatId}>
              Seat {seatId} - Row {SEAT_POSITIONS_3D[seatId].row} ({SEAT_POSITIONS_3D[seatId].side})
            </option>
          ))}
        </select>
        
        {selectedSeat && (
          <div style={{
            padding: '12px',
            background: '#e8f5e8',
            borderRadius: '6px',
            color: '#2c5530'
          }}>
            <div><strong>Current View:</strong></div>
            <div>Seat {selectedSeat}</div>
            <div>Row {SEAT_POSITIONS_3D[selectedSeat]?.row}</div>
            <div>{SEAT_POSITIONS_3D[selectedSeat]?.side} Side</div>
          </div>
        )}
      </div>

      {/* Controls info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <div><strong>🎮 3D Controls:</strong></div>
        <div>• Drag to rotate view</div>
        <div>• Scroll to zoom in/out</div>
        <div>• Select seat for camera movement</div>
        <div>• Immersive 3D airplane interior</div>
      </div>

      {/* Three.js mount point */}
      <div 
        ref={mountRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          cursor: 'grab'
        }}
      />
    </div>
  );
};

// Throttle function for smooth slider performance
const throttle = (func: Function, delay: number) => {
  let timeoutId: number | null = null;
  let lastExecTime = 0;
  return (...args: any[]) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Fix for default markers
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types
interface Waypoint {
  lat: number;
  lon: number;
}

type SunCondition = 
  | 'GOLDEN_HOUR_BEFORE_SUNRISE'
  | 'SUNRISE'
  | 'DAYLIGHT'
  | 'GOLDEN_HOUR_BEFORE_SUNSET'
  | 'SUNSET'
  | 'NIGHT';

interface SunPosition {
  lat: number;
  lon: number;
  time: string;
  azimuth: number;
  elevation: number;
  condition?: SunCondition; // Optional for backward compatibility
}

interface EnhancedSunAnalysis {
  willSeeSunrise: boolean;
  willSeeSunset: boolean;
  willSeeNight: boolean;
  willSeeGoldenHour: boolean;
  sunrise?: {
    time: string;
    timeString: string;
    location: string;
    progressPercent: number;
  };
  sunset?: {
    time: string;
    timeString: string;
    location: string;
    progressPercent: number;
  };
  summary: string[];
  recommendations: string[];
  seatSuggestion: 'left' | 'right' | 'either';
  timeline: Array<{
    time: string;
    timeString: string;
    lat: number;
    lon: number;
    sunElevation: number;
    sunAzimuth: number;
    condition: 'NIGHT' | 'TWILIGHT' | 'GOLDEN_HOUR' | 'DAYLIGHT';
    progressPercent: number;
  }>;
  nightDuration?: number;
  dayDuration?: number;
  mountainCount?: number;
}

interface FlightData {
  path: Waypoint[];
  sunPositions: SunPosition[];
  recommendation: string;
  distance?: number;
  flightTime?: number;
  enhancedAnalysis?: EnhancedSunAnalysis;
}

// Airport coordinates database
const AIRPORTS: { [key: string]: [number, number] } = {
  // Indian Airports
  'DEL': [28.5562, 77.1000], // Delhi
  'BOM': [19.0896, 72.8656], // Mumbai
  'BLR': [12.9716, 77.5946], // Bangalore
  'MAA': [12.9941, 80.1709], // Chennai
  'CCU': [22.6547, 88.4467], // Kolkata
  'HYD': [17.2403, 78.4294], // Hyderabad
  'COK': [9.9312, 76.2673],  // Kochi
  'GOI': [15.3808, 73.8314], // Goa
  'AMD': [23.0725, 72.6347], // Ahmedabad
  'PNQ': [18.5679, 73.9143], // Pune
  'BHO': [23.2599, 77.4126], // Bhopal
  'JAI': [26.9124, 75.7873], // Jaipur
  'LKO': [26.7606, 80.8843], // Lucknow
  
  // International Airports
  'JFK': [40.6413, -73.7781], // New York JFK
  'LHR': [51.4700, -0.4543],  // London Heathrow
  'NRT': [35.7720, 140.3929], // Tokyo Narita
  'LAX': [33.9425, -118.4081], // Los Angeles
  'DXB': [25.2532, 55.3657],  // Dubai
  'SIN': [1.3644, 103.9915],  // Singapore
  'SYD': [-33.9461, 151.1772], // Sydney
  'CDG': [49.0097, 2.5479],   // Paris Charles de Gaulle
  'FRA': [50.0379, 8.5622],   // Frankfurt
  'HKG': [22.3080, 113.9185], // Hong Kong
  'ICN': [37.4602, 126.4407], // Seoul Incheon
  'BKK': [13.6900, 100.7501], // Bangkok
  'DOH': [25.2731, 51.6080],  // Doha
  'IST': [41.2619, 28.7414],  // Istanbul
  'MAD': [40.4719, -3.5626]   // Madrid
};

// Mountain locations for mountain view feature
const MOUNTAINS: { [key: string]: { lat: number, lon: number, name: string, elevation: number, region: string } } = {
  // Himalayas - Northern India
  'EVEREST': { lat: 27.9881, lon: 86.9250, name: 'Mount Everest', elevation: 8849, region: 'Himalayas' },
  'K2': { lat: 35.8808, lon: 76.5155, name: 'K2', elevation: 8611, region: 'Karakoram' },
  'KANCHENJUNGA': { lat: 27.7025, lon: 88.1475, name: 'Kanchenjunga', elevation: 8586, region: 'Himalayas' },
  'NANDA_DEVI': { lat: 30.3763, lon: 79.9737, name: 'Nanda Devi', elevation: 7816, region: 'Himalayas' },
  'DHAULAGIRI': { lat: 28.6967, lon: 83.4933, name: 'Dhaulagiri', elevation: 8167, region: 'Himalayas' },
  'ANNAPURNA': { lat: 28.5967, lon: 83.8203, name: 'Annapurna', elevation: 8091, region: 'Himalayas' },
  
  // Western Ghats - South & West India
  'ANAMUDI': { lat: 10.1783, lon: 77.0650, name: 'Anamudi', elevation: 2695, region: 'Western Ghats' },
  'DODDABETTA': { lat: 11.4064, lon: 76.7392, name: 'Doddabetta', elevation: 2637, region: 'Nilgiris' },
  'MULLAYANAGIRI': { lat: 13.3931, lon: 75.7185, name: 'Mullayanagiri', elevation: 1930, region: 'Western Ghats' },
  'KALSUBAI': { lat: 19.6092, lon: 73.7031, name: 'Kalsubai', elevation: 1646, region: 'Sahyadris' },
  'HARISHCHANDRAGAD': { lat: 19.5217, lon: 73.7636, name: 'Harishchandragad', elevation: 1424, region: 'Sahyadris' },
  
  // Eastern Ghats & Central India
  'MAHENDRAGIRI': { lat: 18.8503, lon: 84.2883, name: 'Mahendragiri', elevation: 1501, region: 'Eastern Ghats' },
  'ARMA_KONDA': { lat: 18.3500, lon: 82.9167, name: 'Arma Konda', elevation: 1680, region: 'Eastern Ghats' },
  'GURU_SHIKHAR': { lat: 24.5925, lon: 72.7894, name: 'Guru Shikhar', elevation: 1722, region: 'Aravalli' },
  
  // Northeast India
  'SARAMATI': { lat: 26.0000, lon: 94.7667, name: 'Saramati', elevation: 3826, region: 'Nagaland Hills' },
  'BLUE_MOUNTAIN': { lat: 23.2833, lon: 92.8167, name: 'Blue Mountain', elevation: 2157, region: 'Mizoram Hills' },
  
  // International Mountains (for international flights)
  'MONT_BLANC': { lat: 45.8326, lon: 6.8652, name: 'Mont Blanc', elevation: 4809, region: 'Alps' },
  'MATTERHORN': { lat: 45.9763, lon: 7.6586, name: 'Matterhorn', elevation: 4478, region: 'Alps' },
  'FUJI': { lat: 35.3606, lon: 138.7274, name: 'Mount Fuji', elevation: 3776, region: 'Japan' },
  'DENALI': { lat: 63.0692, lon: -151.0070, name: 'Denali', elevation: 6190, region: 'Alaska' },
  'ROCKY_MOUNTAINS': { lat: 39.7392, lon: -104.9903, name: 'Rocky Mountains', elevation: 4401, region: 'USA' },
};

// Function to get mountains visible from flight path
const getMountainsVisibleFromPath = (flightPath: Waypoint[], maxDistance: number = 200): string[] => {
  const visibleMountains: string[] = [];
  
  // Check each mountain against the flight path
  Object.entries(MOUNTAINS).forEach(([mountainKey, mountain]) => {
    // Check if mountain is within viewing distance of any point on the flight path
    const isVisible = flightPath.some(waypoint => {
      const distance = calculateDistance(waypoint.lat, waypoint.lon, mountain.lat, mountain.lon);
      return distance <= maxDistance; // Within 200km viewing distance
    });
    
    if (isVisible) {
      visibleMountains.push(mountainKey);
    }
  });
  
  return visibleMountains;
};

// Distance calculation function (great circle distance)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Simplified flight analysis function
const generateSimplifiedFlightAnalysis = (
  fromAirport: string,
  toAirport: string,
  departureTime: string,
  flightDuration: number
): FlightData => {
  console.log(`Analyzing flight: ${fromAirport} → ${toAirport}, ${departureTime}, ${flightDuration} min`);
  
  const fromCoords = AIRPORTS[fromAirport];
  const toCoords = AIRPORTS[toAirport];
  
  if (!fromCoords || !toCoords) {
    throw new Error(`Unknown airport: ${fromAirport} or ${toAirport}`);
  }

  // Parse departure time
  const depTime = new Date(departureTime);
  const arrivalTime = new Date(depTime.getTime() + flightDuration * 60 * 1000);
  
  // Generate basic flight path (5 waypoints)
  const path: Waypoint[] = [];
  for (let i = 0; i <= 4; i++) {
    const fraction = i / 4;
    const lat = fromCoords[0] + (toCoords[0] - fromCoords[0]) * fraction;
    const lon = fromCoords[1] + (toCoords[1] - fromCoords[1]) * fraction;
    path.push({ lat, lon });
  }

  // Generate basic sun analysis
  const enhancedAnalysis = generateBasicSunAnalysis(
    fromAirport,
    toAirport,
    depTime,
    arrivalTime,
    flightDuration
  );

  // Generate sun positions with correct side placement based on flight direction
  const sunPositions: SunPosition[] = path.map((waypoint, index) => {
    const timeAtWaypoint = new Date(depTime.getTime() + (index / 4) * flightDuration * 60 * 1000);
    const hour = timeAtWaypoint.getHours();
    const minute = timeAtWaypoint.getMinutes();
    const timeInMinutes = hour * 60 + minute;
    
    // Calculate flight direction
    const fromCoords = AIRPORTS[fromAirport];
    const toCoords = AIRPORTS[toAirport];
    const lonDiff = toCoords[1] - fromCoords[1]; // + means flying east, - means flying west
    
    // Simplified sun elevation based on time of day
    let elevation: number;
    if (hour >= 6 && hour <= 8) elevation = Math.random() * 10; // Sunrise
    else if (hour >= 18 && hour <= 20) elevation = Math.random() * 10; // Sunset
    else if (hour >= 9 && hour <= 17) elevation = 30 + Math.random() * 40; // Day
    else elevation = -10 - Math.random() * 20; // Night
    
    // Use departure time to determine sun position for the entire flight
    const depHour = depTime.getHours();
    const depMinute = depTime.getMinutes();
    const depTimeInMinutes = depHour * 60 + depMinute;
    
    // Define time intervals in minutes (same as in generateBasicSunAnalysis)
    const GOLDEN_HOUR_BEFORE_SUNRISE_START = 4 * 60;    // 4:00 AM
    const GOLDEN_HOUR_BEFORE_SUNRISE_END = 4 * 60 + 59; // 4:59 AM
    const SUNRISE_START = 5 * 60;                       // 5:00 AM
    const SUNRISE_END = 8 * 60;                          // 8:00 AM
    const SUN_VISIBLE_START = 8 * 60 + 1;                // 8:01 AM
    const SUN_VISIBLE_END = 17 * 60;                     // 5:00 PM
    const GOLDEN_HOUR_BEFORE_SUNSET_START = 17 * 60 + 1; // 5:01 PM
    const GOLDEN_HOUR_BEFORE_SUNSET_END = 17 * 60 + 59;  // 5:59 PM
    const SUNSET_START = 18 * 60;                        // 6:00 PM
    const SUNSET_END = 19 * 60;                          // 7:00 PM
    
    // Calculate realistic sun position based on time of day and flight direction
    let condition: SunCondition;
    let azimuth: number;
    
    // Determine condition based on time with comprehensive coverage of ALL scenarios
    // Helper function to check if time falls within a range (handles midnight wrap)
    const isTimeInRange = (time: number, start: number, end: number): boolean => {
      if (start <= end) {
        // Normal range (e.g., 5:00 AM to 8:00 AM)
        return time >= start && time <= end;
      } else {
        // Overnight range (e.g., 7:01 PM to 3:59 AM)
        return time >= start || time <= end;
      }
    };
    
    // Define ALL time periods (including night period that wraps around midnight)
    const NIGHT_START = 19 * 60 + 1; // 7:01 PM (1141 minutes)
    const NIGHT_END = 3 * 60 + 59;   // 3:59 AM (239 minutes)
    
    // Check conditions in priority order (most specific first)
    if (isTimeInRange(timeInMinutes, SUNRISE_START, SUNRISE_END)) {
      // 5:00 AM - 8:00 AM: Sunrise period
      condition = 'SUNRISE';
    } else if (isTimeInRange(timeInMinutes, GOLDEN_HOUR_BEFORE_SUNRISE_START, GOLDEN_HOUR_BEFORE_SUNRISE_END)) {
      // 4:00 AM - 4:59 AM: Golden hour before sunrise
      condition = 'GOLDEN_HOUR_BEFORE_SUNRISE';
    } else if (isTimeInRange(timeInMinutes, SUNSET_START, SUNSET_END)) {
      // 6:00 PM - 7:00 PM: Sunset period
      condition = 'SUNSET';
    } else if (isTimeInRange(timeInMinutes, GOLDEN_HOUR_BEFORE_SUNSET_START, GOLDEN_HOUR_BEFORE_SUNSET_END)) {
      // 5:01 PM - 5:59 PM: Golden hour before sunset
      condition = 'GOLDEN_HOUR_BEFORE_SUNSET';
    } else if (isTimeInRange(timeInMinutes, SUN_VISIBLE_START, SUN_VISIBLE_END)) {
      // 8:01 AM - 5:00 PM: Full daylight
      condition = 'DAYLIGHT';
    } else if (isTimeInRange(timeInMinutes, NIGHT_START, NIGHT_END)) {
      // 7:01 PM - 3:59 AM: Night period (wraps around midnight)
      condition = 'NIGHT';
    } else {
      // Fallback for any edge cases
      condition = 'DAYLIGHT';
    }
    
    // Debug logging for time condition assignment
    const timeStr = `${Math.floor(timeInMinutes/60).toString().padStart(2,'0')}:${(timeInMinutes%60).toString().padStart(2,'0')}`;
    console.log(`TIME CONDITION: ${timeStr} (${timeInMinutes}min) → ${condition}`);
    
    // Calculate realistic sun azimuth with hardcoded city pair overrides
    const isSunrise = condition === 'SUNRISE' || condition === 'GOLDEN_HOUR_BEFORE_SUNRISE';
    const isSunset = condition === 'SUNSET' || condition === 'GOLDEN_HOUR_BEFORE_SUNSET';
    
    // Try hardcoded mapping first
    let hardcodedSide: 'left' | 'right' | null = null;
    if (isSunrise) {
      hardcodedSide = getHardcodedSunSide(fromAirport, toAirport, true);
    } else if (isSunset) {
      hardcodedSide = getHardcodedSunSide(fromAirport, toAirport, false);
    }
    
    // Calculate realistic sun azimuth based on actual time and sun movement
    azimuth = calculateRealisticSunAzimuth(timeInMinutes, lonDiff, fromAirport, toAirport);
    
    console.log(`REALISTIC SUN: ${fromAirport}→${toAirport}, Time: ${Math.floor(timeInMinutes/60)}:${String(timeInMinutes%60).padStart(2,'0')}, Condition: ${condition}, Azimuth: ${azimuth.toFixed(1)}°`);
    
    return {
      lat: waypoint.lat,
      lon: waypoint.lon,
      time: timeAtWaypoint.toISOString(),
      azimuth,
      elevation,
      condition
    };
  });

  // Calculate mountain count
  const visibleMountains = getMountainsVisibleFromPath(path, 200);
  const mountainCount = visibleMountains.length;

  return {
    path,
    sunPositions,
    recommendation: enhancedAnalysis.seatSuggestion,
    enhancedAnalysis: {
      ...enhancedAnalysis,
      mountainCount
    }
  };
};

// Enhanced sun analysis based on precise time intervals
const generateBasicSunAnalysis = (
  fromAirport: string,
  toAirport: string,
  departureTime: Date,
  arrivalTime: Date,
  flightDuration: number
): EnhancedSunAnalysis => {
  
  const depHour = departureTime.getHours();
  const depMinute = departureTime.getMinutes();
  const arrHour = arrivalTime.getHours();
  const arrMinute = arrivalTime.getMinutes();
  
  console.log(`Flight time analysis: Dep ${depHour}:${depMinute.toString().padStart(2, '0')} → Arr ${arrHour}:${arrMinute.toString().padStart(2, '0')}`);
  
  // Convert times to minutes for easier comparison
  const depTimeMinutes = depHour * 60 + depMinute;
  const arrTimeMinutes = arrHour * 60 + arrMinute;
  
  // Define time intervals in minutes
  const GOLDEN_HOUR_BEFORE_SUNRISE_START = 4 * 60;    // 4:00 AM
  const GOLDEN_HOUR_BEFORE_SUNRISE_END = 4 * 60 + 59; // 4:59 AM
  const SUNRISE_START = 5 * 60;                       // 5:00 AM
  const SUNRISE_END = 8 * 60;                          // 8:00 AM
  const SUN_VISIBLE_START = 8 * 60 + 1;                // 8:01 AM
  const SUN_VISIBLE_END = 17 * 60;                     // 5:00 PM
  const GOLDEN_HOUR_BEFORE_SUNSET_START = 17 * 60 + 1; // 5:01 PM
  const GOLDEN_HOUR_BEFORE_SUNSET_END = 17 * 60 + 59;  // 5:59 PM
  const SUNSET_START = 18 * 60;                        // 6:00 PM
  const SUNSET_END = 19 * 60;                          // 7:00 PM
  const NIGHT_START = 19 * 60 + 1;                     // 7:01 PM
  const NIGHT_END = 3 * 60 + 59;                       // 3:59 AM
  
  // Initialize detection flags
  let willSeeGoldenHourBeforeSunrise = false;
  let willSeeSunrise = false;
  let willSeeSunVisible = false;
  let willSeeGoldenHourBeforeSunset = false;
  let willSeeSunset = false;
  let willSeeNight = false;
  
  // Function to check if a time interval overlaps with flight time
  // Handles ALL scenarios:
  // ✅ Same-day flights (10AM-2PM)
  // ✅ Overnight flights (4PM-2AM) 
  // ✅ Long flights (24+ hours)
  // ✅ Night period wrap-around (7:01PM-3:59AM)
  // ✅ All time periods: sunrise, sunset, golden hour, daylight, night
  const checkTimeOverlap = (startMinutes: number, endMinutes: number): boolean => {
    const flightDurationMinutes = typeof flightDuration === 'number' ? flightDuration : 0;
    
    // Calculate flight end time in minutes from start of day
    const flightEndMinutes = depTimeMinutes + flightDurationMinutes;
    
    // Handle night period (wraps around midnight: 19:01 to 3:59)
    if (startMinutes > endMinutes) {
      // For night period, check two conditions:
      // 1. Flight starts during night hours (after 19:01)
      // 2. Flight crosses midnight and continues into night hours (before 3:59)
      
      const startsInNight = depTimeMinutes >= startMinutes; // Starts after 19:01
      const endsInNight = (flightEndMinutes > 24*60) && ((flightEndMinutes - 24*60) <= endMinutes); // Crosses midnight and ends before 3:59
      const crossesMidnight = flightEndMinutes > 24*60;
      
      return startsInNight || (crossesMidnight && endsInNight);
    }
    
    // Handle regular periods (don't wrap around midnight)
    // Check if the time period overlaps with flight duration
    
    if (flightEndMinutes <= 24*60) {
      // Flight doesn't cross midnight - simple overlap check
      return (depTimeMinutes <= endMinutes) && (flightEndMinutes >= startMinutes);
    } else {
      // Flight crosses midnight - check both before and after midnight
      const overlapBeforeMidnight = (depTimeMinutes <= endMinutes) && (24*60 >= startMinutes);
      const overlapAfterMidnight = ((flightEndMinutes - 24*60) >= startMinutes) && (startMinutes >= 0);
      return overlapBeforeMidnight || overlapAfterMidnight;
    }
  };
  
  // Check each time interval - now properly detects overlaps during flight duration
  willSeeSunrise = checkTimeOverlap(SUNRISE_START, SUNRISE_END);
  willSeeSunset = checkTimeOverlap(SUNSET_START, SUNSET_END);
  willSeeNight = checkTimeOverlap(NIGHT_START, NIGHT_END);
  willSeeSunVisible = checkTimeOverlap(SUN_VISIBLE_START, SUN_VISIBLE_END);
  willSeeGoldenHourBeforeSunrise = checkTimeOverlap(GOLDEN_HOUR_BEFORE_SUNRISE_START, GOLDEN_HOUR_BEFORE_SUNRISE_END);
  willSeeGoldenHourBeforeSunset = checkTimeOverlap(GOLDEN_HOUR_BEFORE_SUNSET_START, GOLDEN_HOUR_BEFORE_SUNSET_END);
  
  // Golden hour is true if any golden hour period is detected
  const willSeeGoldenHour = willSeeGoldenHourBeforeSunrise || willSeeGoldenHourBeforeSunset;
  
  console.log(`Detection Results:
    Golden Hour Before Sunrise: ${willSeeGoldenHourBeforeSunrise}
    Sunrise: ${willSeeSunrise}
    Sun Visible: ${willSeeSunVisible}
    Golden Hour Before Sunset: ${willSeeGoldenHourBeforeSunset}
    Sunset: ${willSeeSunset}
    Night: ${willSeeNight}
    Golden Hour: ${willSeeGoldenHour}`);
  
  // Generate smart recommendations
  const summary: string[] = [];
  const recommendations: string[] = [];
  
  // Sunrise analysis
  if (willSeeSunrise) {
    summary.push(`🌅 You WILL see a beautiful sunrise during this flight!`);
    recommendations.push("Choose a window seat on the EAST side for the best sunrise views.");
  }
  
  // Sunset analysis
  if (willSeeSunset) {
    summary.push(`🌇 You WILL see a stunning sunset during this flight!`);
    recommendations.push("Choose a window seat on the WEST side for the best sunset views.");
  }
  
  // Both sunrise and sunset
  if (willSeeSunrise && willSeeSunset) {
    summary.push("🌟 Amazing! You'll see BOTH sunrise AND sunset during this flight!");
    recommendations.push("This is a rare treat! You'll experience the full sun cycle during your journey.");
  }
  
  // Golden hour analysis
  if (willSeeGoldenHour) {
    if (willSeeGoldenHourBeforeSunrise) {
      summary.push(`✨ You'll experience magical golden hour lighting before sunrise!`);
    } else if (willSeeGoldenHourBeforeSunset) {
      summary.push(`✨ You'll experience beautiful golden hour lighting before sunset!`);
    }
  }
  
  // Night analysis
  if (willSeeNight) {
    const nightHours = calculateNightHours(departureTime, arrivalTime);
    summary.push(`🌙 You'll experience ${nightHours} hours of night flying - perfect for stargazing!`);
    recommendations.push("Great opportunity for night photography and seeing city lights from above.");
  }
  
  // Sun visible analysis
  if (willSeeSunVisible && !willSeeSunrise && !willSeeSunset) {
    summary.push(`☀️ This will be a bright daylight flight with excellent visibility.`);
    recommendations.push("Perfect for scenic landscape viewing and aerial photography.");
  }
  
  // Add general recommendations
  if (willSeeSunrise || willSeeSunset || willSeeGoldenHour) {
    recommendations.push("Bring a camera - the views will be spectacular!");
  }
  
  // Determine seat suggestion based on route
  const seatSuggestion = determineSeatSuggestion(fromAirport, toAirport, willSeeSunrise, willSeeSunset);
  
  return {
    willSeeSunrise,
    willSeeSunset,
    willSeeNight,
    willSeeGoldenHour,
    summary,
    recommendations,
    seatSuggestion,
    timeline: [], // Simplified - no detailed timeline
    nightDuration: willSeeNight ? calculateNightHours(departureTime, arrivalTime) * 60 : 0,
    dayDuration: flightDuration - (willSeeNight ? calculateNightHours(departureTime, arrivalTime) * 60 : 0)
  };
};

// Helper function to calculate night hours
const calculateNightHours = (depTime: Date, arrTime: Date): number => {
  const depHour = depTime.getHours();
  const arrHour = arrTime.getHours();
  
  let nightHours = 0;
  
  // Simple night calculation (10 PM - 6 AM)
  if (depHour >= 22 || depHour <= 6) nightHours += 1;
  if (arrHour >= 22 || arrHour <= 6) nightHours += 1;
  
  return Math.max(nightHours, 0.5); // Minimum 0.5 hours if any night flying
};

// Helper function to determine seat suggestion based on proper bearing calculation
const determineSeatSuggestion = (
  fromAirport: string, 
  toAirport: string, 
  willSeeSunrise: boolean, 
  willSeeSunset: boolean
): 'left' | 'right' | 'either' => {
  
  const fromCoords = AIRPORTS[fromAirport];
  const toCoords = AIRPORTS[toAirport];
  
  if (!fromCoords || !toCoords) return 'either';
  
  // Calculate proper flight bearing using same logic as sun position calculation
  const lat1Rad = fromCoords[0] * Math.PI / 180;
  const lat2Rad = toCoords[0] * Math.PI / 180;
  const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let flightBearing = Math.atan2(y, x) * 180 / Math.PI;
  flightBearing = (flightBearing + 360) % 360; // Normalize to 0-360
  
  console.log(`Flight analysis: ${fromAirport} → ${toAirport}`);
  console.log(`Flight bearing: ${flightBearing.toFixed(1)}°`);
  console.log(`Sunrise: ${willSeeSunrise}, Sunset: ${willSeeSunset}`);
  
  if (willSeeSunrise) {
    // Sunrise is at 90° (East)
    // Calculate relative position of sunrise to flight direction
    let relativeSunPosition = 90 - flightBearing;
    relativeSunPosition = ((relativeSunPosition + 360) % 360);
    
    console.log(`Sunrise relative position: ${relativeSunPosition.toFixed(1)}°`);
    
    // If sunrise is on RIGHT side of flight direction (270° to 90°), recommend LEFT seat to look right
    // If sunrise is on LEFT side of flight direction (90° to 270°), recommend RIGHT seat to look left
    if (relativeSunPosition >= 270 || relativeSunPosition <= 90) {
      console.log(`Sunrise on RIGHT side → LEFT seat recommended`);
      return 'left'; // Sit on left to look right at sunrise
    } else {
      console.log(`Sunrise on LEFT side → RIGHT seat recommended`);
      return 'right'; // Sit on right to look left at sunrise
    }
  }
  
  if (willSeeSunset) {
    // Sunset is at 270° (West)
    // Calculate relative position of sunset to flight direction
    let relativeSunPosition = 270 - flightBearing;
    relativeSunPosition = ((relativeSunPosition + 360) % 360);
    
    console.log(`Sunset relative position: ${relativeSunPosition.toFixed(1)}°`);
    
    // If sunset is on RIGHT side of flight direction (270° to 90°), recommend LEFT seat to look right
    // If sunset is on LEFT side of flight direction (90° to 270°), recommend RIGHT seat to look left
    if (relativeSunPosition >= 270 || relativeSunPosition <= 90) {
      console.log(`Sunset on RIGHT side → LEFT seat recommended`);
      return 'left'; // Sit on left to look right at sunset
    } else {
      console.log(`Sunset on LEFT side → RIGHT seat recommended`);
      return 'right'; // Sit on right to look left at sunset
    }
  }
  
  console.log(`No sunrise/sunset → EITHER side recommended`);
  return 'either';
};

// Helper function to determine side-specific views for seat cards
const getSideSpecificViews = (
  fromAirport: string,
  toAirport: string, 
  side: 'left' | 'right',
  enhancedAnalysis: any
) => {
  if (!enhancedAnalysis) return { sunrise: false, sunset: false, night: false };
  
  const fromCoords = AIRPORTS[fromAirport];
  const toCoords = AIRPORTS[toAirport];
  
  if (!fromCoords || !toCoords) {
    return { 
      sunrise: enhancedAnalysis.willSeeSunrise, 
      sunset: enhancedAnalysis.willSeeSunset, 
      night: enhancedAnalysis.willSeeNight 
    };
  }
  
  // Calculate flight bearing
  const lat1Rad = fromCoords[0] * Math.PI / 180;
  const lat2Rad = toCoords[0] * Math.PI / 180;
  const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let flightBearing = Math.atan2(y, x) * 180 / Math.PI;
  flightBearing = (flightBearing + 360) % 360;
  
  // Check sunrise visibility for this side
  let sunriseVisible = false;
  if (enhancedAnalysis.willSeeSunrise) {
    let relativeSunrisePosition = 90 - flightBearing;
    relativeSunrisePosition = ((relativeSunrisePosition + 360) % 360);
    
    // Sunrise on RIGHT side of flight (270° to 90°) → visible from LEFT seat
    // Sunrise on LEFT side of flight (90° to 270°) → visible from RIGHT seat
    if (side === 'left') {
      sunriseVisible = (relativeSunrisePosition >= 270 || relativeSunrisePosition <= 90);
    } else {
      sunriseVisible = (relativeSunrisePosition > 90 && relativeSunrisePosition < 270);
    }
  }
  
  // Check sunset visibility for this side
  let sunsetVisible = false;
  if (enhancedAnalysis.willSeeSunset) {
    let relativeSunsetPosition = 270 - flightBearing;
    relativeSunsetPosition = ((relativeSunsetPosition + 360) % 360);
    
    // Sunset on RIGHT side of flight (270° to 90°) → visible from LEFT seat
    // Sunset on LEFT side of flight (90° to 270°) → visible from RIGHT seat
    if (side === 'left') {
      sunsetVisible = (relativeSunsetPosition >= 270 || relativeSunsetPosition <= 90);
    } else {
      sunsetVisible = (relativeSunsetPosition > 90 && relativeSunsetPosition < 270);
    }
  }
  
  // CRITICAL FIX: If both sunrise and sunset are detected, there MUST be night periods
  let nightVisible = enhancedAnalysis.willSeeNight;
  if (enhancedAnalysis.willSeeSunrise && enhancedAnalysis.willSeeSunset && !nightVisible) {
    nightVisible = true; // Force night to true when both sunrise and sunset occur
  }
  
  return {
    sunrise: sunriseVisible,
    sunset: sunsetVisible,
    night: nightVisible // Night is visible from both sides
  };
};

// Function to get the correct marker/emoji for each sun condition
const getSunConditionMarker = (condition: SunCondition): string => {
  switch (condition) {
    case 'GOLDEN_HOUR_BEFORE_SUNRISE':
      return '🌄'; // Golden hour before sunrise - mountain sunrise
    case 'SUNRISE':
      return '🌅'; // Sunrise
    case 'DAYLIGHT':
      return '☀️'; // Bright sun
    case 'GOLDEN_HOUR_BEFORE_SUNSET':
      return '🌇'; // Golden hour before sunset - cityscape sunset
    case 'SUNSET':
      return '🌆'; // Sunset over buildings
    case 'NIGHT':
      return '🌙'; // Crescent moon
    default:
      return '☀️'; // Default to sun
  }
};

// Function to get tooltip content based on sun condition
const getSunTooltipContent = (sunPos: SunPosition | null): string => {
  if (!sunPos) return '';

  // Handle cases where condition might be undefined (for backward compatibility)
  if (!sunPos.condition) {
    const elevation = sunPos.elevation?.toFixed(1) || '--';
    if (sunPos.elevation && sunPos.elevation < 0) {
      return `🌙 Night • ${Math.abs(sunPos.elevation).toFixed(1)}° below horizon`;
    } else if (sunPos.elevation && sunPos.elevation < 10) {
      return `🌅 Golden Hour • ${elevation}° above horizon`;
    } else {
      return `☀️ Sun • ${elevation}° above horizon`;
    }
  }

  const marker = getSunConditionMarker(sunPos.condition);
  const elevation = sunPos.elevation?.toFixed(1) || '--';

  switch (sunPos.condition) {
    case 'GOLDEN_HOUR_BEFORE_SUNRISE':
      return `${marker} Golden Hour Before Sunrise • ${elevation}° above horizon`;
    case 'SUNRISE':
      return `${marker} Sunrise • ${elevation}° above horizon`;
    case 'DAYLIGHT':
      return `${marker} Daylight • ${elevation}° above horizon`;
    case 'GOLDEN_HOUR_BEFORE_SUNSET':
      return `${marker} Golden Hour Before Sunset • ${elevation}° above horizon`;
    case 'SUNSET':
      return `${marker} Sunset • ${elevation}° above horizon`;
    case 'NIGHT':
      return `${marker} Night • Moon visible`;
    default:
      return `${marker} Sun • ${elevation}° above horizon`;
  }
};

// Hardcoded city pair mappings for consistent sun positioning
const CITY_PAIR_SUN_MAPPINGS: { [key: string]: { sunrise: 'left' | 'right', sunset: 'left' | 'right' } } = {
  // West-bound flights (flying west)
  'DEL-JAI': { sunrise: 'left', sunset: 'right' },   // Delhi → Jaipur
  'DEL-BOM': { sunrise: 'left', sunset: 'right' },   // Delhi → Mumbai  
  'BLR-BOM': { sunrise: 'left', sunset: 'right' },   // Bangalore → Mumbai
  'MAA-BOM': { sunrise: 'left', sunset: 'right' },   // Chennai → Mumbai
  'HYD-BOM': { sunrise: 'left', sunset: 'right' },   // Hyderabad → Mumbai
  'CCU-DEL': { sunrise: 'left', sunset: 'right' },   // Kolkata → Delhi
  'BLR-DEL': { sunrise: 'left', sunset: 'right' },   // Bangalore → Delhi
  'MAA-DEL': { sunrise: 'left', sunset: 'right' },   // Chennai → Delhi
  
  // East-bound flights (flying east)  
  'JAI-DEL': { sunrise: 'right', sunset: 'left' },   // Jaipur → Delhi
  'BOM-DEL': { sunrise: 'right', sunset: 'left' },   // Mumbai → Delhi
  'BOM-BLR': { sunrise: 'right', sunset: 'left' },   // Mumbai → Bangalore
  'BOM-MAA': { sunrise: 'right', sunset: 'left' },   // Mumbai → Chennai
  'BOM-HYD': { sunrise: 'right', sunset: 'left' },   // Mumbai → Hyderabad
  'DEL-CCU': { sunrise: 'right', sunset: 'left' },   // Delhi → Kolkata
  'DEL-BLR': { sunrise: 'right', sunset: 'left' },   // Delhi → Bangalore  
  'DEL-MAA': { sunrise: 'right', sunset: 'left' },   // Delhi → Chennai
  
  // International routes
  'DEL-JFK': { sunrise: 'right', sunset: 'left' },   // Delhi → New York (east)
  'JFK-DEL': { sunrise: 'left', sunset: 'right' },   // New York → Delhi (west)
  'BOM-LHR': { sunrise: 'right', sunset: 'left' },   // Mumbai → London (east)
  'LHR-BOM': { sunrise: 'left', sunset: 'right' },   // London → Mumbai (west)
  'DEL-NRT': { sunrise: 'right', sunset: 'left' },   // Delhi → Tokyo (east)
  'NRT-DEL': { sunrise: 'left', sunset: 'right' },   // Tokyo → Delhi (west)
  'BOM-SYD': { sunrise: 'right', sunset: 'left' },   // Mumbai → Sydney (east)
  'SYD-BOM': { sunrise: 'left', sunset: 'right' },   // Sydney → Mumbai (west)
};

// Function to get hardcoded sun side for specific city pairs
const getHardcodedSunSide = (fromAirport: string, toAirport: string, isSunrise: boolean): 'left' | 'right' | null => {
  const routeKey = `${fromAirport}-${toAirport}`;
  const mapping = CITY_PAIR_SUN_MAPPINGS[routeKey];
  
  if (mapping) {
    return isSunrise ? mapping.sunrise : mapping.sunset;
  }
  
  return null; // No hardcoded mapping found
};

// Function to calculate smooth circular sun movement based purely on time progression
const calculateRealisticSunAzimuth = (timeInMinutes: number, flightLonDiff: number, fromAirport: string, toAirport: string): number => {
  // Convert 24-hour time to a continuous circular progression (0-360 degrees)
  // 6 AM = 90° (East), 12 PM = 180° (South), 6 PM = 270° (West), 12 AM = 0° (North)
  
  const hour = timeInMinutes / 60;
  
  // Create smooth circular motion: time directly maps to degrees
  // 24 hours = 360 degrees, so each hour = 15 degrees
  let sunAzimuth = (hour * 15) % 360;
  
  // Offset so that:
  // 6 AM (sunrise) = 90° (East)
  // 12 PM (noon) = 180° (South) 
  // 6 PM (sunset) = 270° (West)
  // 12 AM (midnight) = 0° (North)
  sunAzimuth = (sunAzimuth + 90) % 360; // Add 90° offset
  
  // Get flight bearing to calculate relative position
  const fromCoords = AIRPORTS[fromAirport];
  const toCoords = AIRPORTS[toAirport];
  
  if (!fromCoords || !toCoords) {
    // Fallback: direct map coordinates
    return ((sunAzimuth + 180) % 360);
  }
  
  // Calculate aircraft heading
  const dLon = (toCoords[1] - fromCoords[1]) * Math.PI / 180;
  const lat1Rad = fromCoords[0] * Math.PI / 180;
  const lat2Rad = toCoords[0] * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let flightBearing = Math.atan2(y, x) * 180 / Math.PI;
  flightBearing = (flightBearing + 360) % 360;
  
  // Calculate sun position relative to aircraft's perspective
  // This creates the effect where the sun appears to move around the plane
  let relativeSunAzimuth = sunAzimuth - flightBearing + 90;
  relativeSunAzimuth = ((relativeSunAzimuth + 360) % 360);
  
  // Final map coordinate conversion
  const mapAzimuth = ((relativeSunAzimuth + 180) % 360);
  
  console.log(`SMOOTH SUN: Time ${hour.toFixed(1)}h → Sun ${sunAzimuth.toFixed(1)}° → Relative ${relativeSunAzimuth.toFixed(1)}° → Map ${mapAzimuth.toFixed(1)}°`);
  
  return mapAzimuth;
};

// Function to calculate bearing between two points
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360
  
  // No adjustment needed for custom SVG airplane - it points north by default
  // The SVG is designed to point upward (0 degrees = north)
  
  return bearing;
};

// Function to create rotated airplane icon
const createAirplaneIcon = (rotation: number) => {
  return L.divIcon({
    className: 'custom-airplane-icon',
    html: `<div style="
      transform: rotate(${rotation}deg); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      width: 100%; 
      height: 100%;
      transform-origin: center center;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="60" height="60" style="fill: #000000; filter: drop-shadow(0 3px 6px rgba(255,255,255,1.0));">
        <!-- Airplane fuselage (main body) - tapered from nose to tail -->
        <ellipse cx="256" cy="300" rx="16" ry="160"/>
        
        <!-- Very thick pointed nose - clearly shows front direction -->
        <polygon points="256,40 225,130 287,130"/>
        
        <!-- Thick cockpit/nose section -->
        <ellipse cx="256" cy="150" rx="25" ry="40"/>
        
        <!-- Forward fuselage (thick front section) -->
        <ellipse cx="256" cy="200" rx="22" ry="30"/>
        
        <!-- Main wings - positioned toward front -->
        <path d="M40 200 L256 160 L472 200 L472 260 L256 220 L40 260 Z"/>
        
        <!-- Wing tip extensions -->
        <rect x="35" y="190" width="20" height="80" rx="3"/>
        <rect x="457" y="190" width="20" height="80" rx="3"/>
        
        <!-- Horizontal tail stabilizers (smaller, at back) -->
        <path d="M200 420 L256 410 L312 420 L312 440 L256 435 L200 440 Z"/>
        
        <!-- Vertical tail fin (at back) -->
        <polygon points="256,390 245,450 267,450"/>
        
        <!-- Engine details under wings -->
        <ellipse cx="150" cy="230" rx="8" ry="20"/>
        <ellipse cx="362" cy="230" rx="8" ry="20"/>
        
        <!-- Rear fuselage taper -->
        <ellipse cx="256" cy="450" rx="8" ry="20"/>
      </svg>
    </div>`,
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};

// InteractiveAirplane component
interface InteractiveAirplaneProps {
  flightData: FlightData;
  flightProgress: number;
  onPositionChange: (position: { lat: number; lon: number; sunPosition: SunPosition | null }) => void;
}

const InteractiveAirplane: React.FC<InteractiveAirplaneProps> = ({ 
  flightData, 
  flightProgress, 
  onPositionChange 
}) => {
  const airplaneRef = useRef<L.Marker>(null);

  const getCurrentAirplaneData = (): { position: [number, number] | null; rotation: number } => {
    if (!flightData || flightData.path.length === 0) return { position: null, rotation: 0 };
    
    // Calculate exact position along the flight path
    const totalDistance = flightData.path.length - 1;
    const exactProgress = (flightProgress / 100) * totalDistance;
    
    // Get the two waypoints we're between
    const currentIndex = Math.floor(exactProgress);
    const nextIndex = Math.min(currentIndex + 1, flightData.path.length - 1);
    
    const currentWaypoint = flightData.path[currentIndex];
    const nextWaypoint = flightData.path[nextIndex];
    
    // Calculate the exact position between waypoints (0-1 progress within this segment)
    const progressInSegment = exactProgress - currentIndex;
    
    // Interpolate position smoothly between waypoints
    const lat = currentWaypoint.lat + (nextWaypoint.lat - currentWaypoint.lat) * progressInSegment;
    const lon = currentWaypoint.lon + (nextWaypoint.lon - currentWaypoint.lon) * progressInSegment;
    
    // Calculate rotation based on current direction of travel
    let rotation = 0;
    if (nextIndex > currentIndex) {
      // Flying forward - point towards next waypoint
      rotation = calculateBearing(currentWaypoint.lat, currentWaypoint.lon, nextWaypoint.lat, nextWaypoint.lon);
    } else {
      // At the end of the path - use direction from previous to current
      const prevIndex = Math.max(currentIndex - 1, 0);
      const prevWaypoint = flightData.path[prevIndex];
      rotation = calculateBearing(prevWaypoint.lat, prevWaypoint.lon, currentWaypoint.lat, currentWaypoint.lon);
    }
    
    return { 
      position: [lat, lon],
      rotation: rotation
    };
  };

  const { position: currentPosition, rotation: airplaneRotation } = useMemo(() => getCurrentAirplaneData(), [flightData, flightProgress]);

  useEffect(() => {
    if (!flightData || flightData.path.length === 0) return;
    
    // Calculate smooth position using the same logic as getCurrentAirplaneData
    const totalDistance = flightData.path.length - 1;
    const exactProgress = (flightProgress / 100) * totalDistance;
    
    const currentIndex = Math.floor(exactProgress);
    const nextIndex = Math.min(currentIndex + 1, flightData.path.length - 1);
    
    const currentWaypoint = flightData.path[currentIndex];
    const nextWaypoint = flightData.path[nextIndex];
    
    const progressInSegment = exactProgress - currentIndex;
    
    // Interpolate position smoothly between waypoints
    const lat = currentWaypoint.lat + (nextWaypoint.lat - currentWaypoint.lat) * progressInSegment;
    const lon = currentWaypoint.lon + (nextWaypoint.lon - currentWaypoint.lon) * progressInSegment;
    
    // Interpolate sun position based on current progress
    let currentSunPosition: SunPosition | null = null;
    if (flightData.sunPositions && flightData.sunPositions.length > 0) {
      const sunProgress = exactProgress / totalDistance;
      const sunIndex = Math.floor(sunProgress * (flightData.sunPositions.length - 1));
      const nextSunIndex = Math.min(sunIndex + 1, flightData.sunPositions.length - 1);
      
      const currentSun = flightData.sunPositions[sunIndex];
      const nextSun = flightData.sunPositions[nextSunIndex];
      
      const sunProgressInSegment = (sunProgress * (flightData.sunPositions.length - 1)) - sunIndex;
      
      currentSunPosition = {
        lat: currentSun.lat + (nextSun.lat - currentSun.lat) * sunProgressInSegment,
        lon: currentSun.lon + (nextSun.lon - currentSun.lon) * sunProgressInSegment,
        time: currentSun.time,
        azimuth: currentSun.azimuth + (nextSun.azimuth - currentSun.azimuth) * sunProgressInSegment,
        elevation: currentSun.elevation + (nextSun.elevation - currentSun.elevation) * sunProgressInSegment
      };
    }

    // Update position callback with smooth position
    onPositionChange({
      lat: lat,
      lon: lon,
      sunPosition: currentSunPosition
    });

    // Update map view to follow airplane with smooth animation
    if (airplaneRef.current) {
      const leafletElement = airplaneRef.current as any;
      const map = leafletElement._map;
      if (map) {
        map.setView([lat, lon], map.getZoom(), { 
          animate: true,
          duration: 0.1 // Very short animation for smooth following
        });
      }
    }
  }, [flightData, flightProgress, onPositionChange]);

  if (!currentPosition) return null;

  return (
    <Marker
      ref={airplaneRef}
      position={currentPosition}
      icon={createAirplaneIcon(airplaneRotation)}
      draggable={false}
      interactive={false}
      bubblingMouseEvents={false}
      eventHandlers={{
        dragstart: (e) => { (e as any).preventDefault?.(); return false; },
        drag: (e) => { (e as any).preventDefault?.(); return false; },
        dragend: (e) => { (e as any).preventDefault?.(); return false; },
        mousedown: (e) => { e.originalEvent?.preventDefault(); return false; },
        mouseup: (e) => { e.originalEvent?.preventDefault(); return false; },
        mousemove: (e) => { e.originalEvent?.preventDefault(); return false; },
        add: () => {
          if (airplaneRef.current) {
            const element = airplaneRef.current.getElement();
            if (element) {
              element.style.pointerEvents = 'none';
              element.style.userSelect = 'none';
              element.style.touchAction = 'none';
              element.draggable = false;
            }
          }
        }
      }}
    >
      <Popup>
        Airplane Position<br />
        Use the timeline slider to move me!
      </Popup>
    </Marker>
  );
};

// Page enum for navigation
enum AppPage {
  SEARCH = 'search',
  RESULTS = 'results',
  EXPERIENCE = 'experience'
}

// Navigation Component
interface NavigationProps {
  currentPage: AppPage;
  onPageChange: (page: AppPage) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  return (
    <nav style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '15px 0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: 'white',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          <span>✈️</span>
          <span>ScenicView</span>
        </div>

        {/* Navigation Items */}
        <div style={{
          display: 'flex',
          gap: '20px'
        }}>
          <button
            onClick={() => onPageChange(AppPage.SEARCH)}
            style={{
              background: currentPage === AppPage.SEARCH ? 'rgba(255,255,255,0.3)' : 'transparent',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== AppPage.SEARCH) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== AppPage.SEARCH) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => onPageChange(AppPage.EXPERIENCE)}
            style={{
              background: currentPage === AppPage.EXPERIENCE ? 'rgba(255,255,255,0.3)' : 'transparent',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== AppPage.EXPERIENCE) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== AppPage.EXPERIENCE) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span>🪑</span>
            <span>Experience Inside Plane</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

// ExperiencePage Component
interface ExperiencePageProps {
  onBack: () => void;
}

const ExperiencePage: React.FC<ExperiencePageProps> = ({ onBack }) => {
  const [selectedSeat, setSelectedSeat] = useState<string>('');

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Back Button - Top Left */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          color: '#2c3e50'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <span>←</span>
        <span>Back to Home</span>
      </button>

      <AirplaneExperience
        selectedSeat={selectedSeat}
        onSeatChange={setSelectedSeat}
      />
    </div>
  );
};

// SearchPage Component
interface SearchPageProps {
  fromAirport: string;
  setFromAirport: (value: string) => void;
  toAirport: string;
  setToAirport: (value: string) => void;
  departureTime: string;
  setDepartureTime: (value: string) => void;
  flightDuration: number | '';
  setFlightDuration: (value: number | '') => void;

  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  formatTimeDisplay: (date: Date) => string;
  getFlightEndTime: () => Date;
}

const SearchPage: React.FC<SearchPageProps> = ({
  fromAirport, setFromAirport, toAirport, setToAirport, departureTime, setDepartureTime,
  flightDuration, setFlightDuration, loading, error, onSubmit,
  formatTimeDisplay, getFlightEndTime
}) => {
  // Airport data with searchable properties
  const airports = [
    { code: "DEL", name: "Delhi", city: "Delhi", country: "India", emoji: "🏛️" },
    { code: "JAI", name: "Jaipur", city: "Jaipur", country: "India", emoji: "🏰" },
    { code: "BLR", name: "Bangalore", city: "Bangalore", country: "India", emoji: "🌆" },
    { code: "BOM", name: "Mumbai", city: "Mumbai", country: "India", emoji: "🏙️" },
    { code: "BHO", name: "Bhopal", city: "Bhopal", country: "India", emoji: "🌸" },
    { code: "LKO", name: "Lucknow", city: "Lucknow", country: "India", emoji: "🕌" },
    { code: "JFK", name: "New York", city: "New York", country: "USA", emoji: "🗽" },
    { code: "LHR", name: "London", city: "London", country: "UK", emoji: "🇬🇧" },
    { code: "NRT", name: "Tokyo", city: "Tokyo", country: "Japan", emoji: "🗾" },
    { code: "LAX", name: "Los Angeles", city: "Los Angeles", country: "USA", emoji: "🌴" },
    { code: "DXB", name: "Dubai", city: "Dubai", country: "UAE", emoji: "🏜️" },
    { code: "SIN", name: "Singapore", city: "Singapore", country: "Singapore", emoji: "🌺" },
    { code: "SYD", name: "Sydney", city: "Sydney", country: "Australia", emoji: "🦘" },
    { code: "CDG", name: "Paris", city: "Paris", country: "France", emoji: "🗼" },
    { code: "FRA", name: "Frankfurt", city: "Frankfurt", country: "Germany", emoji: "🇩🇪" },
    { code: "HKG", name: "Hong Kong", city: "Hong Kong", country: "China", emoji: "🏙️" },
    { code: "ICN", name: "Seoul", city: "Seoul", country: "South Korea", emoji: "🇰🇷" },
    { code: "BKK", name: "Bangkok", city: "Bangkok", country: "Thailand", emoji: "🇹🇭" },
    { code: "DOH", name: "Doha", city: "Doha", country: "Qatar", emoji: "🏺" },
    { code: "IST", name: "Istanbul", city: "Istanbul", country: "Turkey", emoji: "🕌" },
    { code: "MAD", name: "Madrid", city: "Madrid", country: "Spain", emoji: "🇪🇸" }
  ];

  // Searchable dropdown component
  const SearchableDropdown = ({ 
    value, 
    onChange, 
    placeholder, 
    label, 
    id 
  }: { 
    value: string; 
    onChange: (value: string) => void; 
    placeholder: string; 
    label: string; 
    id: string; 
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    // Filter airports based on search term
    const filteredAirports = airports.filter(airport =>
      airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      airport.country.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get selected airport display text
    const selectedAirport = airports.find(a => a.code === value);
    const displayText = selectedAirport 
      ? `${selectedAirport.emoji} ${selectedAirport.city} (${selectedAirport.code})`
      : placeholder;

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm("");
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
      <div className="form-group">
        <label className="input-label" htmlFor={id}>{label}</label>
        <div className="searchable-dropdown" ref={dropdownRef}>
          <div 
            className="dropdown-trigger input-field"
            onClick={() => setIsOpen(!isOpen)}
          >
            <span>{displayText}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          
          {isOpen && (
            <div className="dropdown-menu">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search airports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                  autoFocus
                />
              </div>
              
              <div className="dropdown-options">
                {filteredAirports.length > 0 ? (
                  filteredAirports.map((airport) => (
                    <div
                      key={airport.code}
                      className={`dropdown-option ${value === airport.code ? 'selected' : ''}`}
                      onClick={() => {
                        onChange(airport.code);
                        setIsOpen(false);
                        setSearchTerm("");
                      }}
                    >
                      <span className="airport-emoji">{airport.emoji}</span>
                      <span className="airport-info">
                        <span className="airport-city">{airport.city}</span>
                        <span className="airport-code">({airport.code})</span>
                      </span>
                      <span className="airport-country">{airport.country}</span>
                    </div>
                  ))
                ) : (
                  <div className="no-results">No airports found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="search-page fade-in">
      <header className="app-header">
        <h1>✈️ ScenicView - Perfect Seat Recommendation Finder</h1>
        <p>Find the best window seat for sunrise, sunset, nights and mountain  views during your flight</p>
      </header>

      <main className="search-main">
        <div className="search-container">
          <div className="search-form card-elevated slide-up">
            <div className="form-header">
              <h2>🎯 Plan Your Journey</h2>
              <p>Enter your flight details to get personalized seat recommendations</p>
            </div>
            
            <div className="form-body">
              <form onSubmit={onSubmit}>
                {/* Left Column */}
                <div className="form-left-column">
                  <div className="form-section">
                    <h3 className="section-title">
                      <span className="section-icon">🛫</span>
                      Flight Details
                    </h3>
                    
                    <div className="form-grid">
                      <SearchableDropdown
                          value={fromAirport}
                        onChange={setFromAirport}
                        placeholder="Select departure"
                        label="From Airport"
                        id="fromAirport"
                      />

                      <SearchableDropdown
                          value={toAirport}
                        onChange={setToAirport}
                        placeholder="Select destination"
                        label="To Airport"
                        id="toAirport"
                      />
                    </div>

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="input-label" htmlFor="departureTime">Departure Date & Time</label>
                        <input
                          className="input-field"
                          type="datetime-local"
                          id="departureTime"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="input-label" htmlFor="flightDuration">Flight Duration (minutes)</label>
                        <input
                          className="input-field"
                          type="number"
                          id="flightDuration"
                          min="30"
                          max="1440"
                          step="1"
                          value={flightDuration}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setFlightDuration('');
                            } else {
                              const intValue = parseInt(value, 10);
                              if (!isNaN(intValue)) {
                                setFlightDuration(intValue);
                              }
                            }
                          }}
                          placeholder="e.g., 120 (2 hours)"
                          required
                        />
                        {departureTime && flightDuration && (
                          <small className="duration-help" style={{ marginTop: '8px', display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Flight time: {formatTimeDisplay(new Date(departureTime))} → {formatTimeDisplay(getFlightEndTime())} 
                            ({Math.floor(Number(flightDuration) / 60)}h {Number(flightDuration) % 60}m)
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="form-right-column">




                  {/* Flight Tips Section - Always visible to fill space */}
                  <div className="form-section">
                    <div className="flight-tips-card">
                      <h4>
                        <span className="section-icon">💡</span>
                        Flight Seat Tips
                      </h4>
                      <div className="tips-content">
                        <div className="tip-item">
                          <span className="tip-icon">🌅</span>
                          <div className="tip-text">
                            <strong>Best Sunrise Views:</strong> East-facing windows during morning flights
                          </div>
                        </div>
                        <div className="tip-item">
                          <span className="tip-icon">🌇</span>
                          <div className="tip-text">
                            <strong>Best Sunset Views:</strong> West-facing windows during evening flights
                          </div>
                        </div>
                        <div className="tip-item">
                          <span className="tip-icon">🗺️</span>
                          <div className="tip-text">
                            <strong>Flight Direction:</strong> Our algorithm considers your exact route for precise recommendations
                          </div>
                        </div>
                        <div className="tip-item">
                          <span className="tip-icon">⏰</span>
                          <div className="tip-text">
                            <strong>Timing Matters:</strong> Sun position changes throughout your flight duration
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Section - Full Width */}
                <div className="form-submit-section">
                  {error && (
                    <div className="error" style={{ marginBottom: 'var(--space-4)' }}>
                      <span className="error-icon">⚠️</span>
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg" 
                    disabled={loading}
                    style={{ width: '100%' }}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white' }}></div>
                        Finding your perfect seat...
                      </>
                    ) : (
                      <>
                        🔍 Find My Perfect Seat
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// ResultsPage Component
interface ResultsPageProps {
  flightData: FlightData | null;
  fromAirport: string;
  toAirport: string;
  currentPosition: { lat: number; lon: number } | null;
  currentSunPosition: SunPosition | null;
  flightProgress: number;
  handleProgressChange: (newProgress: number) => void;
  handlePositionChange: (position: { lat: number; lon: number; sunPosition: SunPosition | null }) => void;
  isDragging: boolean;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleClick: (e: React.MouseEvent) => void;
  onBack: () => void;
  departureTime: string;
  flightDuration: number | '';
}



// Calculate actual astronomical sunrise and sunset times during flight
const getOptimalPeriodsInFlight = (
  departureTime: string, 
  flightDuration: number | '',
  flightData: FlightData | null
): { 
  sunrise: boolean; 
  sunset: boolean; 
  details: string[];
  sunriseTime?: Date;
  sunsetTime?: Date;
  sunriseProgress?: number;
  sunsetProgress?: number;
} => {
  if (!departureTime || !flightDuration || !flightData?.path?.length) {
    return { sunrise: false, sunset: false, details: [] };
  }
  
  const startTime = new Date(departureTime);
  const endTime = new Date(startTime.getTime() + (typeof flightDuration === 'number' ? flightDuration * 60 * 60 * 1000 : 0));
  const details: string[] = [];
  let sunriseInFlight = false;
  let sunsetInFlight = false;
  let sunriseTime: Date | undefined;
  let sunsetTime: Date | undefined;
  let sunriseProgress: number | undefined;
  let sunsetProgress: number | undefined;

  // Check each waypoint for sunrise/sunset during flight
  console.log('Checking sun positions for sunrise/sunset...');
  console.log('Flight start time:', startTime);
  console.log('Flight end time:', endTime);
  console.log('Sun positions count:', flightData.sunPositions?.length || 0);
  
  if (flightData.sunPositions) {
    flightData.sunPositions.forEach((sunPos, index) => {
      const currentTime = new Date(sunPos.time);
      const prevSunPos = index > 0 ? flightData.sunPositions[index - 1] : null;
      
      console.log(`Waypoint ${index}: ${currentTime.toISOString()}, elevation: ${sunPos.elevation}°`);
      
      if (currentTime >= startTime && currentTime <= endTime) {
        // For the first waypoint, consider if sun is already rising (elevation > -10°)
        if (index === 0 && sunPos.elevation > -10 && sunPos.elevation < 10 && !sunriseInFlight) {
          sunriseInFlight = true;
          sunriseTime = currentTime;
          sunriseProgress = (index / (flightData.path.length - 1)) * 100;
          // Removed: details.push(`🌅 Golden hour/Sunrise conditions at takeoff ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          console.log('Sunrise detected at takeoff');
        }
        
        // Check for horizon crossings between waypoints
        if (prevSunPos) {
          // Check for sunrise (sun elevation crosses from below to above horizon)
          if (prevSunPos.elevation <= 0 && sunPos.elevation > 0 && !sunriseInFlight) {
            sunriseInFlight = true;
            sunriseTime = currentTime;
            sunriseProgress = (index / (flightData.path.length - 1)) * 100;
            details.push(`🌅 Sunrise at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} during flight`);
            console.log('Sunrise detected - horizon crossing');
          }
          
          // Check for sunset (sun elevation crosses from above to below horizon)
          if (prevSunPos.elevation > 0 && sunPos.elevation <= 0 && !sunsetInFlight) {
            sunsetInFlight = true;
            sunsetTime = currentTime;
            sunsetProgress = (index / (flightData.path.length - 1)) * 100;
            // Removed: details.push(`🌇 Sunset at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} during flight`);
            console.log('Sunset detected - horizon crossing');
          }
        }
      }
    });
  }

  // If no exact crossing found, check for golden hour periods and sun conditions
  if (!sunriseInFlight || !sunsetInFlight) {
    flightData.sunPositions.forEach((sunPos, index) => {
      const currentTime = new Date(sunPos.time);
      const prevSunPos = index > 0 ? flightData.sunPositions[index - 1] : null;
      
      if (currentTime >= startTime && currentTime <= endTime) {
        // Check for morning conditions (sunrise-like)
        if (!sunriseInFlight) {
          // Early morning with low sun (good for sunrise viewing)
          if (sunPos.elevation > -5 && sunPos.elevation < 15) {
            const hour = currentTime.getHours();
            if (hour >= 5 && hour <= 9) { // Morning hours
              sunriseInFlight = true;
              sunriseTime = currentTime;
              sunriseProgress = (index / (flightData.path.length - 1)) * 100;
              details.push(`🌅 Morning golden hour at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            }
          }
          
          // Golden hour transition (sun crosses 10° elevation upward)
          if (prevSunPos && prevSunPos.elevation <= 10 && sunPos.elevation > 10) {
            sunriseInFlight = true;
            sunriseTime = currentTime;
            sunriseProgress = (index / (flightData.path.length - 1)) * 100;
            details.push(`🌅 Golden hour begins at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          }
        }
        
        // Check for evening conditions (sunset-like)
        if (!sunsetInFlight) {
          // Evening with low sun (good for sunset viewing)
          if (sunPos.elevation > -5 && sunPos.elevation < 15) {
            const hour = currentTime.getHours();
            if (hour >= 17 && hour <= 21) { // Evening hours
              sunsetInFlight = true;
              sunsetTime = currentTime;
              sunsetProgress = (index / (flightData.path.length - 1)) * 100;
              details.push(`🌇 Evening golden hour at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            }
          }
          
          // Golden hour transition (sun crosses 10° elevation downward)
          if (prevSunPos && prevSunPos.elevation > 10 && sunPos.elevation <= 10) {
            sunsetInFlight = true;
            sunsetTime = currentTime;
            sunsetProgress = (index / (flightData.path.length - 1)) * 100;
            details.push(`🌇 Golden hour begins at ${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          }
        }
      }
    });
  }

  return { 
    sunrise: sunriseInFlight, 
    sunset: sunsetInFlight, 
    details,
    sunriseTime,
    sunsetTime,
    sunriseProgress,
    sunsetProgress
  };
};

const ResultsPage: React.FC<ResultsPageProps> = ({
  flightData, fromAirport, toAirport, currentPosition, currentSunPosition,
  flightProgress, handleProgressChange, handlePositionChange, isDragging,
  handleMouseDown, handleClick, onBack, departureTime, flightDuration
}) => {
  // Resizable layout state
  const [mapWidth, setMapWidth] = useState(60); // 60% default width for map
  const [isDraggingResize, setIsDraggingResize] = useState(false);

  // Resize handler for the divider
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth;
      const newMapWidth = (e.clientX / containerWidth) * 100;
      
      // Constrain between 30% and 80%
      const constrainedWidth = Math.max(30, Math.min(80, newMapWidth));
      setMapWidth(constrainedWidth);
    };
    
    const handleMouseUp = () => {
      setIsDraggingResize(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Smart tooltip positioning to prevent off-screen tooltips
  React.useEffect(() => {
    const adjustTooltipPositions = () => {
      const tooltipContainers = document.querySelectorAll('.sun-tooltip-container');
      
      tooltipContainers.forEach((container) => {
        const rect = container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        // Remove existing positioning classes
        container.classList.remove('tooltip-left', 'tooltip-right');
        
        // If tooltip would go off the right edge
        if (rect.right > viewportWidth - 150) {
          container.classList.add('tooltip-right');
        }
        // If tooltip would go off the left edge
        else if (rect.left < 150) {
          container.classList.add('tooltip-left');
        }
      });
    };

    // Adjust on mount and window resize
    adjustTooltipPositions();
    window.addEventListener('resize', adjustTooltipPositions);
    
    return () => window.removeEventListener('resize', adjustTooltipPositions);
  }, [currentSunPosition, flightProgress]);
  if (!flightData) {
    return (
      <div className="results-page">
        <div className="error">No flight data available</div>
      </div>
    );
  }

  return (
    <div className="results-page fade-in">
      <header className="results-header">
        <button onClick={onBack} className="back-btn">
          ← Back to Search
        </button>
        <div className="results-header-content">
          <h1>✈️ Flight Results</h1>
        </div>
      </header>

      <main className="results-main">
        <div className="results-container">
          <div className="map-section" style={{ width: `${mapWidth}%` }}>
            <MapContainer
              center={[28.6139, 77.2090]}
              zoom={6}
              style={{ height: '100vh', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {flightData.path && flightData.path.length > 1 && (
                <Polyline
                  positions={flightData.path.map(wp => [wp.lat, wp.lon])}
                  color="blue"
                  weight={3}
                />
              )}

              {flightData.path && flightData.path.length > 0 && (
                <Marker
                  position={[flightData.path[0].lat, flightData.path[0].lon]}
                  icon={L.divIcon({
                    className: 'custom-marker from-marker',
                    html: '<div style="background: green; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Popup>Departure: {fromAirport}</Popup>
                </Marker>
              )}

              {flightData.path && flightData.path.length > 0 && (
                <Marker
                  position={[flightData.path[flightData.path.length - 1].lat, flightData.path[flightData.path.length - 1].lon]}
                  icon={L.divIcon({
                    className: 'custom-marker to-marker',
                    html: '<div style="background: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10],
                  })}
                >
                  <Popup>Arrival: {toAirport}</Popup>
                </Marker>
              )}

              <InteractiveAirplane 
                flightData={flightData}
                flightProgress={flightProgress}
                onPositionChange={handlePositionChange}
              />

              {/* Sun Marker on Map */}
              {currentPosition && currentSunPosition && flightData && (() => {
                // Calculate pure flight bearing for reference
                const startPoint = flightData.path[0];
                const endPoint = flightData.path[flightData.path.length - 1];
                
                const dLon = (endPoint.lon - startPoint.lon) * Math.PI / 180;
                const lat1Rad = startPoint.lat * Math.PI / 180;
                const lat2Rad = endPoint.lat * Math.PI / 180;
                
                const y = Math.sin(dLon) * Math.cos(lat2Rad);
                const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
                
                let flightBearing = Math.atan2(y, x) * 180 / Math.PI;
                flightBearing = (flightBearing + 360) % 360; // Normalize to 0-360
                
                // Use REAL sun azimuth from astronomical calculations
                // SunCalc: South=0°, West=+90°, North=180°/-180°, East=-90°
                // Map: North=0°, East=90°, South=180°, West=270°
                // Convert: Add 180° to shift from South=0° to North=0°
                let sunBearing = (currentSunPosition.azimuth + 180) % 360;
                
                // Position sun using real azimuth and elevation
                // Distance from airplane based on elevation (higher sun = farther for better visibility)
                const elevationDegrees = currentSunPosition.elevation;
                const sunDistance = Math.max(0.3, 0.8 + (90 - Math.abs(elevationDegrees)) / 180); // 0.3 to 1.3 degrees
                
                // Convert bearing to map coordinates
                const sunLat = currentPosition.lat + Math.cos(sunBearing * Math.PI / 180) * sunDistance;
                const sunLon = currentPosition.lon + Math.sin(sunBearing * Math.PI / 180) * sunDistance;
                
                return (
                  <>
                    <Marker
                      position={[sunLat, sunLon]}
                      icon={L.divIcon({
                        className: 'sun-marker',
                        html: `
                          <div class="map-sun-marker" style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 40px;
                            height: 40px;
                            background: ${elevationDegrees < 0 
                              ? 'radial-gradient(circle, #4a5568 30%, #2d3748 60%, #1a202c 100%)' 
                              : elevationDegrees < 10 
                                ? 'radial-gradient(circle, #ff8c00 30%, #ff6b35 60%, #e53e3e 100%)' 
                                : 'radial-gradient(circle, #ffd700 30%, #ffed4e 60%, #ff8c00 100%)'
                            };
                            border-radius: 50%;
                            border: 3px solid #fff;
                            box-shadow: 0 0 20px rgba(255, 215, 0, 0.6), 0 0 40px rgba(255, 215, 0, 0.3);
                            position: relative;
                            font-size: 20px;
                            text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
                            cursor: pointer;
                            transition: all 0.3s ease;
                          " title="${elevationDegrees < 0 
                            ? `🌙 Nighttime • ${Math.abs(elevationDegrees).toFixed(1)}° below horizon` 
                            : elevationDegrees < 10 
                              ? `🌅 Golden Hour • ${elevationDegrees.toFixed(1)}° above horizon` 
                              : `☀️ Daylight • ${elevationDegrees.toFixed(1)}° above horizon`
                          }">
                            ${elevationDegrees < 0 ? '🌙' : elevationDegrees < 10 ? '🌅' : '☀️'}
                            <div style="
                              position: absolute;
                              width: 60px;
                              height: 60px;
                              border: 2px solid #ffd700;
                              border-radius: 50%;
                              border-style: dashed;
                              animation: rotate 8s linear infinite;
                              opacity: 0.4;
                            "></div>
                            <div class="map-sun-tooltip" style="
                              position: absolute;
                              bottom: 120%;
                              left: 50%;
                              transform: translateX(-50%);
                              background: rgba(0, 0, 0, 0.9);
                              color: white;
                              padding: 8px 12px;
                              border-radius: 6px;
                              font-size: 12px;
                              white-space: nowrap;
                              z-index: 1000;
                              opacity: 0;
                              visibility: hidden;
                              transition: opacity 0.3s ease, visibility 0.3s ease;
                              pointer-events: none;
                              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                            ">
                              ${elevationDegrees < 0 
                                ? `🌙 Nighttime • ${Math.abs(elevationDegrees).toFixed(1)}° below horizon` 
                                : elevationDegrees < 10 
                                  ? `🌅 Golden Hour • ${elevationDegrees.toFixed(1)}° above horizon` 
                                  : `☀️ Daylight • ${elevationDegrees.toFixed(1)}° above horizon`
                              }
                            </div>
                          </div>
                          <style>
                            @keyframes rotate {
                              from { transform: rotate(0deg); }
                              to { transform: rotate(360deg); }
                            }
                            .map-sun-marker:hover {
                              transform: scale(1.1) !important;
                            }
                            .map-sun-marker:hover .map-sun-tooltip {
                              opacity: 1 !important;
                              visibility: visible !important;
                            }
                          </style>
                        `,
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                      })}
                    >
                      <Popup>
                        <div>
                          <strong>☀️ Real Sun Position</strong><br/>
                          <strong>Recommended Seat:</strong> {flightData.recommendation === 'left' ? 'Left' : 'Right'} Side<br/>
                          <strong>Sun Azimuth:</strong> {currentSunPosition.azimuth?.toFixed(1)}° (from South)<br/>
                          <strong>Sun Elevation:</strong> {currentSunPosition.elevation?.toFixed(1)}° (above horizon)<br/>
                          <strong>Map Bearing:</strong> {sunBearing.toFixed(1)}° (from North)<br/>
                          <strong>Flight Direction:</strong> {flightBearing.toFixed(1)}°<br/>
                          {elevationDegrees < 0 && <em style={{color: '#ff6b6b'}}>Sun below horizon</em>}
                          {elevationDegrees >= 0 && elevationDegrees < 10 && <em style={{color: '#ffa500'}}>Sun near horizon</em>}
                          {elevationDegrees >= 10 && <em style={{color: '#4dabf7'}}>Sun well above horizon</em>}
                        </div>
                      </Popup>
                    </Marker>

                    {/* Sun Direction Line */}
                    <Polyline
                      positions={[
                        [currentPosition.lat, currentPosition.lon],
                        [sunLat, sunLon]
                      ]}
                      color="#ffd700"
                      weight={3}
                      opacity={0.8}
                      dashArray="10, 5"
                    />
                  </>
                );
              })()}

              {/* Mountain Markers */}
              {flightData.path && (() => {
                const visibleMountains = getMountainsVisibleFromPath(flightData.path, 200);
                
                return visibleMountains.map(mountainKey => {
                  const mountain = MOUNTAINS[mountainKey];
                  
                  return (
                    <Marker
                      key={mountainKey}
                      position={[mountain.lat, mountain.lon]}
                      icon={L.divIcon({
                        className: 'mountain-marker',
                        html: `
                          <div class="map-mountain-marker" style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 35px;
                            height: 35px;
                            background: linear-gradient(135deg, #8B4513 0%, #D2691E  30%, #F4A460 60%, #FFFFFF 85%);
                            border-radius: 8px 8px 20px 20px;
                            border: 2px solid #654321;
                            box-shadow: 0 4px 12px rgba(139, 69, 19, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3);
                            position: relative;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            transform-origin: bottom center;
                          " title="${mountain.name} • ${mountain.elevation}m • ${mountain.region}">
                            🏔️
                            <div style="
                              position: absolute;
                              width: 45px;
                              height: 45px;
                              border: 2px solid #8B4513;
                              border-radius: 8px;
                              border-style: dashed;
                              animation: pulse 3s ease-in-out infinite;
                              opacity: 0.3;
                            "></div>
                            <div class="map-mountain-tooltip" style="
                              position: absolute;
                              bottom: 120%;
                              left: 50%;
                              transform: translateX(-50%);
                              background: rgba(139, 69, 19, 0.95);
                              color: white;
                              padding: 10px 14px;
                              border-radius: 8px;
                              font-size: 12px;
                              white-space: nowrap;
                              z-index: 1000;
                              opacity: 0;
                              visibility: hidden;
                              transition: opacity 0.3s ease, visibility 0.3s ease;
                              pointer-events: none;
                              box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                              border: 1px solid #F4A460;
                            ">
                              <div style="font-weight: bold; margin-bottom: 4px;">🏔️ ${mountain.name}</div>
                              <div style="font-size: 11px; opacity: 0.9;">
                                📏 ${mountain.elevation.toLocaleString()}m elevation<br/>
                                🗺️ ${mountain.region}
                              </div>
                              <div style="
                                position: absolute;
                                top: 100%;
                                left: 50%;
                                transform: translateX(-50%);
                                width: 0;
                                height: 0;
                                border-left: 6px solid transparent;
                                border-right: 6px solid transparent;
                                border-top: 6px solid rgba(139, 69, 19, 0.95);
                              "></div>
                            </div>
                          </div>
                          <style>
                            @keyframes pulse {
                              0%, 100% { transform: scale(1); opacity: 0.3; }
                              50% { transform: scale(1.1); opacity: 0.6; }
                            }
                            .map-mountain-marker:hover {
                              transform: scale(1.15) !important;
                              box-shadow: 0 6px 20px rgba(139, 69, 19, 0.7), 0 3px 10px rgba(0, 0, 0, 0.4) !important;
                            }
                            .map-mountain-marker:hover .map-mountain-tooltip {
                              opacity: 1 !important;
                              visibility: visible !important;
                            }
                          </style>
                        `,
                        iconSize: [35, 35],
                        iconAnchor: [17, 35],
                      })}
                    >
                      <Popup>
                        <div style={{ minWidth: '200px' }}>
                          <strong style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            🏔️ {mountain.name}
                          </strong>
                          <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                            <div><strong>Elevation:</strong> {mountain.elevation.toLocaleString()}m</div>
                            <div><strong>Region:</strong> {mountain.region}</div>
                            <div style={{ marginTop: '8px', padding: '8px', background: '#f0f8ff', borderRadius: '4px', fontSize: '12px' }}>
                              <strong>🔭 Mountain View Available</strong><br/>
                              This peak is visible from your flight path!
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                });
              })()}
            </MapContainer>
          </div>

          {/* Resizable Divider */}
          <div 
            className={`resize-divider ${isDraggingResize ? 'dragging' : ''}`}
            onMouseDown={handleResizeMouseDown}
          >
            <div className="resize-handle">
              <div className="resize-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div className="flight-details" style={{ width: `${100 - mapWidth}%` }}>
            {/* Professional Header */}
            <div className="flight-header">
              <h2>
                <span>✈️</span>
                Flight Results
              </h2>
              <div className="flight-route">
                {fromAirport}
                <span className="route-arrow">→</span>
                {toAirport}
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="scroll-indicator">
              <div className="scroll-hint">
                <span className="scroll-icon">⬇️</span>
                <span className="scroll-text">Scroll for Flight Timeline</span>
              </div>
            </div>

            {/* Enhanced Sun Analysis Results */}
            {flightData.enhancedAnalysis && (
              <div className="content-section">
                <div className="enhanced-analysis-card">
                  <h3>
                    <span className="section-icon">🔮</span>
                    Detailed  Analysis
                  </h3>
                  
                  {/* Summary Messages */}
                  <div className="analysis-summary">
                    {flightData.enhancedAnalysis.summary.map((message, index) => (
                      <div key={index} className="summary-message">
                        {message}
                      </div>
                    ))}
                  </div>

                  {/* Quick Stats */}
                  <div className="analysis-stats">
                    <div className="stat-item">
                      <span className="stat-icon">🌅</span>
                      <span className="stat-label">Sunrise</span>
                      <span className={`stat-value ${flightData.enhancedAnalysis.willSeeSunrise ? 'positive' : 'negative'}`}>
                        {flightData.enhancedAnalysis.willSeeSunrise ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">🌇</span>
                      <span className="stat-label">Sunset</span>
                      <span className={`stat-value ${flightData.enhancedAnalysis.willSeeSunset ? 'positive' : 'negative'}`}>
                        {flightData.enhancedAnalysis.willSeeSunset ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">🌙</span>
                      <span className="stat-label">Night</span>
                      <span className={`stat-value ${(() => {
                        // CRITICAL FIX: If both sunrise and sunset are detected, there MUST be night periods
                        const hasBothSunEvents = flightData.enhancedAnalysis.willSeeSunrise && flightData.enhancedAnalysis.willSeeSunset;
                        const nightDetected = flightData.enhancedAnalysis.willSeeNight || hasBothSunEvents;
                        return nightDetected ? 'positive' : 'negative';
                      })()}`}>
                        {(() => {
                          // CRITICAL FIX: If both sunrise and sunset are detected, there MUST be night periods
                          const hasBothSunEvents = flightData.enhancedAnalysis.willSeeSunrise && flightData.enhancedAnalysis.willSeeSunset;
                          const nightDetected = flightData.enhancedAnalysis.willSeeNight || hasBothSunEvents;
                          return nightDetected ? 'YES' : 'NO';
                        })()}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">✨</span>
                      <span className="stat-label">Golden Hour</span>
                      <span className={`stat-value ${flightData.enhancedAnalysis.willSeeGoldenHour ? 'positive' : 'negative'}`}>
                        {flightData.enhancedAnalysis.willSeeGoldenHour ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>



                  {/* Event Times */}
                  {(flightData.enhancedAnalysis.sunrise || flightData.enhancedAnalysis.sunset) && (
                    <div className="event-times">
                      {flightData.enhancedAnalysis.sunrise && (
                        <div className="event-time sunrise">
                          <span className="event-icon">🌅</span>
                          <div className="event-details">
                            <div className="event-label">Sunrise</div>
                            <div className="event-time-value">{flightData.enhancedAnalysis.sunrise.timeString}</div>
                            <div className="event-progress">
                              {Math.round(flightData.enhancedAnalysis.sunrise.progressPercent)}% through flight
                            </div>
                          </div>
                        </div>
                      )}
                      {flightData.enhancedAnalysis.sunset && (
                        <div className="event-time sunset">
                          <span className="event-icon">🌇</span>
                          <div className="event-details">
                            <div className="event-label">Sunset</div>
                            <div className="event-time-value">{flightData.enhancedAnalysis.sunset.timeString}</div>
                            <div className="event-progress">
                              {Math.round(flightData.enhancedAnalysis.sunset.progressPercent)}% through flight
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seat Recommendation Cards */}
            <div className="content-section">
              <div className="seat-comparison-container">
                <h3>Seat Recommendations & View Analysis</h3>
              
              <div className="seat-options">
                {/* Left Seat Recommendation */}
                <div className={`seat-option ${flightData.recommendation === 'left' ? 'recommended' : ''}`}>
                  <div className="seat-header">
                    <h4>🪟 Left Side Seats</h4>
                    {flightData.recommendation === 'left' && <span className="recommended-badge">⭐ Recommended</span>}
                  </div>
                  
                  <div className="view-counts">
                    {(() => {
                      const leftViews = getSideSpecificViews(fromAirport, toAirport, 'left', flightData.enhancedAnalysis);
                      return (
                        <>
                          <div className="count-item">
                            <span className="count-icon">🌅</span>
                            <span className="count-text">Sunrise Views: {leftViews.sunrise ? 'YES' : 'NO'}</span>
                          </div>
                          <div className="count-item">
                            <span className="count-icon">🌇</span>
                            <span className="count-text">Sunset Views: {leftViews.sunset ? 'YES' : 'NO'}</span>
                          </div>
                          <div className="count-item">
                            <span className="count-icon">🌙</span>
                            <span className="count-text">Night Views: {leftViews.night ? 'YES' : 'NO'}</span>
                          </div>
                          <div className="count-item">
                            <span className="count-icon">🏔️</span>
                            <span className="count-text">Mountain Views: {flightData.enhancedAnalysis?.mountainCount || 0} peaks</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Seat Recommendation */}
                <div className={`seat-option ${flightData.recommendation === 'right' ? 'recommended' : ''}`}>
                  <div className="seat-header">
                    <h4>🪟 Right Side Seats</h4>
                    {flightData.recommendation === 'right' && <span className="recommended-badge">⭐ Recommended</span>}
                  </div>
                  
                  <div className="view-counts">
                    {(() => {
                      const rightViews = getSideSpecificViews(fromAirport, toAirport, 'right', flightData.enhancedAnalysis);
                      return (
                        <>
                          <div className="count-item">
                            <span className="count-icon">🌅</span>
                            <span className="count-text">Sunrise Views: {rightViews.sunrise ? 'YES' : 'NO'}</span>
                          </div>
                          <div className="count-item">
                            <span className="count-icon">🌇</span>
                            <span className="count-text">Sunset Views: {rightViews.sunset ? 'YES' : 'NO'}</span>
                          </div>
                          <div className="count-item">
                            <span className="count-icon">🌙</span>
                            <span className="count-text">Night Views: {rightViews.night ? 'YES' : 'NO'}</span>
                          </div>
                          <div className="count-item">
                            <span className="count-icon">🏔️</span>
                            <span className="count-text">Mountain Views: {flightData.enhancedAnalysis?.mountainCount || 0} peaks</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Current View Analysis Card */}
            <div className="content-section">
              {currentSunPosition && (
                <div className="current-view-card slide-up">
                <h3>
                  <span className="section-icon">📊</span>
                  Current View Analysis
                </h3>
                <div className="view-details">
                  <div className="view-item">
                    <span className="view-label">Aircraft Position:</span>
                    <span className="view-value">
                      {currentPosition?.lat?.toFixed(4) ?? '--'}, {currentPosition?.lon?.toFixed(4) ?? '--'}
                    </span>
                  </div>
                  <div className="view-item">
                    <span className="view-label">Sun Elevation:</span>
                    <span className="view-value">{currentSunPosition.elevation?.toFixed(1) ?? '--'}°</span>
                  </div>
                  <div className="view-item">
                    <span className="view-label">Sun Azimuth:</span>
                    <span className="view-value">{currentSunPosition.azimuth?.toFixed(1) ?? '--'}°</span>
                  </div>
                  <div className="view-item">
                    <span className="view-label">Sun Visibility:</span>
                    <span className="view-value">
                      {currentSunPosition ? (
                        <>
                          <span className="sun-tooltip-container">
                            {currentSunPosition.condition ? getSunConditionMarker(currentSunPosition.condition) : '☀️'}
                            <div className={`sun-tooltip ${currentSunPosition.condition ? currentSunPosition.condition.toLowerCase() : 'daylight'}`}>
                              {currentSunPosition.condition ? getSunTooltipContent(currentSunPosition) : `Sun • ${currentSunPosition.elevation?.toFixed(1) || '--'}° above horizon`}
                            </div>
                          </span>
                          {' '}
                          {currentSunPosition.condition === 'NIGHT' ? 'Below Horizon' : 'Visible'}
                        </>
                      ) : (
                        'Not Available'
                      )}
                    </span>
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* Flight Timeline */}
            <div className="content-section">
              <div className="flight-progress-container slide-up">
              <h4>
                <span className="section-icon">🕐</span>
                Flight Timeline
              </h4>
              
              <p className="progress-instructions">
                Drag the slider to explore different moments of your flight
              </p>

              <div className="progress-slider-container">
                <div className="progress-labels">
                  <div className="progress-label">
                    <span className="progress-icon">🛫</span>
                    Departure
                  </div>
                  <div className="progress-label">
                    <span className="progress-icon">🛬</span>
                    Arrival
                  </div>
                </div>

                <div 
                  className="horizontal-slider-container"
                  onMouseDown={handleMouseDown}
                  onClick={handleClick}
                >
                  <div className="horizontal-slider-track">
                    <div 
                      className="horizontal-progress-bar"
                      style={{
                        width: `${flightProgress}%`
                      }}
                    />
                    
                    {/* Sunrise/Sunset markers on timeline */}
                    {(() => {
                      const periods = getOptimalPeriodsInFlight(departureTime, flightDuration, flightData);
                      return (
                        <>
                          {periods.sunriseProgress !== undefined && (
                            <div 
                              className="timeline-event-marker sunrise-marker"
                              style={{ left: `${periods.sunriseProgress}%` }}
                              title={`Sunrise at ${periods.sunriseTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              🌅
                            </div>
                          )}
                          {periods.sunsetProgress !== undefined && (
                            <div 
                              className="timeline-event-marker sunset-marker"
                              style={{ left: `${periods.sunsetProgress}%` }}
                              title={`Sunset at ${periods.sunsetTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            >
                              🌇
                            </div>
                          )}
                        </>
                      );
                    })()}
                    
                    <div 
                      className="horizontal-slider-handle"
                      style={{
                        left: `${flightProgress}%`
                      }}
                    />
                  </div>
                </div>

                <div className="progress-display">
                  Flight Progress: {Math.round(flightProgress)}%
                </div>
                
                {/* Sunrise/Sunset Information */}
                {(() => {
                  const periods = getOptimalPeriodsInFlight(departureTime, flightDuration, flightData);
                  if (periods.sunrise || periods.sunset) {
                    return (
                      <div className="sun-events-info">
                        <h5 style={{ margin: '10px 0 5px 0', fontSize: '14px', color: '#ffd700' }}>
                          ☀️ Sun Events During Flight
                        </h5>
                        {periods.details.map((detail, index) => (
                          <div key={index} style={{ fontSize: '12px', margin: '3px 0', color: '#e2e8f0' }}>
                            {detail}
                          </div>
                        ))}
                        {(periods.sunrise && periods.sunset) && (
                          <div style={{ fontSize: '11px', margin: '5px 0', color: '#10b981', fontWeight: 'bold' }}>
                            🌟 Perfect flight for both sunrise and sunset viewing!
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  // Page navigation state
  const [currentPage, setCurrentPage] = useState<AppPage>(AppPage.SEARCH);

  // Form data state - All fields start empty
  const [fromAirport, setFromAirport] = useState('');
  const [toAirport, setToAirport] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [flightDuration, setFlightDuration] = useState<number | ''>(''); // Start empty
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flightProgress, setFlightProgress] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [currentSunPosition, setCurrentSunPosition] = useState<SunPosition | null>(null);

  // View Preferences State - removed (no longer needed)

  const [isDragging, setIsDragging] = useState(false);

  // Helper functions for flight duration calculations
  const getFlightEndTime = (): Date => {
    if (!departureTime || !flightDuration) {
      return new Date(); // Return current time if invalid
    }
    const startTime = new Date(departureTime);
    const endTime = new Date(startTime.getTime() + Number(flightDuration) * 60 * 1000); // Convert minutes to milliseconds
    return endTime;
  };

  const formatTimeDisplay = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
  };







  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Comprehensive form validation
    if (!fromAirport || !toAirport || !departureTime || !flightDuration) {
      setError('Please fill all the details including departure airport, arrival airport, departure time, and flight duration.');
      setLoading(false);
      return;
    }



    // Check if source and destination are the same
    if (fromAirport === toAirport) {
      setError('No flights available for the same source and destination airports. Please select different departure and arrival airports.');
      setLoading(false);
      return;
    }

    // Validate flight duration
    if (typeof flightDuration === 'string' || flightDuration < 30 || flightDuration > 1440) {
      setError('Flight duration must be a number between 30 and 1440 minutes (24 hours).');
      setLoading(false);
      return;
    }

    // SIMPLIFIED APPROACH: Generate flight analysis directly in frontend
    try {
      console.log('Generating simplified flight analysis...');
      
      const mockFlightData = generateSimplifiedFlightAnalysis(
        fromAirport,
        toAirport,
        departureTime,
        flightDuration
      );

      setFlightData(mockFlightData);
      
      // Set initial flight progress to 0% (departure)
      setFlightProgress(0);
      
      console.log('Simplified flight analysis completed:', mockFlightData);
      
      // Navigate to results page
      setCurrentPage(AppPage.RESULTS);
      
    } catch (err) {
      setError('Unable to generate flight analysis. Please check your input and try again.');
      console.error('Error generating flight analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgressChange = useCallback((newProgress: number) => {
    setFlightProgress(newProgress);
  }, []);

  // Throttled version for smooth dragging with optimized frequency
  const throttledProgressChange = useCallback(
    throttle((newProgress: number) => {
      setFlightProgress(newProgress);
    }, 8), // ~120 FPS for ultra-smooth airplane movement
    []
  );

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Immediately update position on click for instant feedback
    if (flightData) {
      const sliderElement = e.currentTarget.closest('.horizontal-slider-container') as HTMLElement;
      if (sliderElement) {
        const rect = sliderElement.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        
        // Make it easier to reach 100% - if within 5% of the end, snap to 100%
        if (percentage > 95) percentage = 100;
        if (percentage < 5) percentage = 0;
        
        percentage = Math.max(0, Math.min(100, percentage));
        
        // Immediately update the visual elements without waiting for React state
        const handle = document.querySelector('.horizontal-slider-handle') as HTMLElement;
        const progressBar = document.querySelector('.horizontal-progress-bar') as HTMLElement;
        const progressText = document.querySelector('.progress-display') as HTMLElement;
        
        if (handle) handle.style.left = `${percentage}%`;
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `Flight Progress: ${Math.round(percentage)}%`;
        
        handleProgressChange(percentage);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    
    const sliderElement = e.currentTarget as HTMLElement;
    let isDraggingLocal = true;
    
    // Function to update slider position
    const updateSliderPosition = (clientX: number) => {
      if (!flightData || !sliderElement) return;
      
      const rect = sliderElement.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      
      // Make it easier to reach 100% - if within 5% of the end, snap to 100%
      if (percentage > 95) percentage = 100;
      if (percentage < 5) percentage = 0;
      
      percentage = Math.max(0, Math.min(100, percentage));
      
      // INSTANT updates - both visual and airplane position
      const handle = document.querySelector('.horizontal-slider-handle') as HTMLElement;
      const progressBar = document.querySelector('.horizontal-progress-bar') as HTMLElement;
      const progressText = document.querySelector('.progress-display') as HTMLElement;
      
      if (handle) handle.style.left = `${percentage}%`;
      if (progressBar) progressBar.style.width = `${percentage}%`;
      if (progressText) progressText.textContent = `Flight Progress: ${Math.round(percentage)}%`;
      
      // IMMEDIATE React state update
      setFlightProgress(percentage);
    };
    
    // Initial update on mouse down
    updateSliderPosition(e.clientX);
    
    // Mouse move handler
    const mouseMoveHandler = (e: MouseEvent) => {
      e.preventDefault();
      if (!isDraggingLocal) return;
      updateSliderPosition(e.clientX);
    };
    
    // Mouse up handler
    const mouseUpHandler = () => {
      isDraggingLocal = false;
      setIsDragging(false);
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
    
    document.addEventListener('mousemove', mouseMoveHandler, { passive: false });
    document.addEventListener('mouseup', mouseUpHandler, { passive: false });
  };



  const handlePositionChange = (position: { lat: number; lon: number; sunPosition: SunPosition | null }) => {
    setCurrentPosition({ lat: position.lat, lon: position.lon });
    setCurrentSunPosition(position.sunPosition);
  };

  // Navigation function to go back to search
  const goBackToSearch = () => {
    setCurrentPage(AppPage.SEARCH);
    setError(null); // Clear any errors when going back
  };

  // Navigation function to change pages
  const handlePageChange = (page: AppPage) => {
    setCurrentPage(page);
    setError(null); // Clear any errors when changing pages
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case AppPage.SEARCH:
        return (
          <SearchPage 
            fromAirport={fromAirport}
            setFromAirport={setFromAirport}
            toAirport={toAirport}
            setToAirport={setToAirport}
            departureTime={departureTime}
            setDepartureTime={setDepartureTime}
            flightDuration={flightDuration}
            setFlightDuration={setFlightDuration}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            formatTimeDisplay={formatTimeDisplay}
            getFlightEndTime={getFlightEndTime}
          />
        );
      case AppPage.RESULTS:
        return (
          <ResultsPage 
            flightData={flightData}
            fromAirport={fromAirport}
            toAirport={toAirport}
            currentPosition={currentPosition}
            currentSunPosition={currentSunPosition}
            flightProgress={flightProgress}
            handleProgressChange={handleProgressChange}
            handlePositionChange={handlePositionChange}
            isDragging={isDragging}
            handleMouseDown={handleMouseDown}
            handleClick={handleClick}
            onBack={goBackToSearch}
            departureTime={departureTime}
            flightDuration={flightDuration}
          />
        );
      case AppPage.EXPERIENCE:
        return (
          <ExperiencePage 
            onBack={goBackToSearch}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="App">
      {/* Only show navigation on Search page */}
      {currentPage === AppPage.SEARCH && (
        <Navigation 
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      )}
      {renderCurrentPage()}
    </div>
  );
}

export default App;