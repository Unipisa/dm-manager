import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { MapControls } from 'three/addons/controls/MapControls.js';
import {ColladaLoader} from 'three/addons/loaders/ColladaLoader.js';

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
cube.position.x = 90
cube.position.y = -20
cube.position.z = -4
scene.add( cube );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
// const controls = new OrbitControls(camera, renderer.domElement)
// const controls = new FirstPersonControls(camera, renderer.domElement)
const controls = new MapControls(camera, renderer.domElement)

// controls.enableDamping = true

// camera.position.x = 88
// camera.position.y = -13
// camera.position.z = 4
camera.up.set(0, 0, 1)
// camera.lookAt(92, -27, -12)
camera.position.x = 0
camera.position.y = 0
camera.position.z = 10
scene.add(new THREE.AxesHelper(5))


var loader = new ColladaLoader();

var dm = null

const filename = 'dm.dae'
loader.load(filename, function(collada){
    dm = collada
    dm.scene.position.x = -90
    dm.scene.position.y = 20
    dm.scene.position.z = 2
    // dm.scene.scale.set(1, 1, 1)
    // console.log(dm)
    scene.add(dm.scene);
});

const light = new THREE.AmbientLight( 0x888888 ); // soft white light
scene.add( light );

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set( 1, 2, 3 ).normalize();
scene.add( directionalLight );

function animate() {
	requestAnimationFrame( animate );

    if (dm) {
        let dm_camera = dm.scene.children[0].children[0]  
        renderer.render( scene, camera );
    }

    controls.update();
    
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;

}
animate();

