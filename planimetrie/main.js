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
// scene.add( cube );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const controls = new OrbitControls(camera, renderer.domElement)
// const controls = new FirstPersonControls(camera, renderer.domElement)
// const controls = new MapControls(camera, renderer.domElement)

// controls.enableDamping = true

camera.position.x = 0
camera.position.y = 0
camera.position.z = 10
scene.add(new THREE.AxesHelper(5))

var loader = new ColladaLoader();

const filename = 'dm.dae'
loader.load(filename, function(collada){
    var dm = collada.scene.children[0]
    dm.rotation.x = -Math.PI / 2
    let s = 0.0254 // one inch in meters
    dm.scale.set(s, s, s)
    dm.position.x = -90
    dm.position.y = 2
    dm.position.z = -20
    scene.add(dm)
});

const light = new THREE.AmbientLight( 0x888888 ); // soft white light
scene.add( light );

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.position.set( 1, 2, 3 ).normalize();
scene.add( directionalLight );

function animate() {
	requestAnimationFrame( animate );

    renderer.render( scene, camera );
    controls.update();
}
animate();

