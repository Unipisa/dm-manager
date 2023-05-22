import * as THREE from 'three';
import {ColladaLoader} from 'three/addons/loaders/ColladaLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
//scene.add( cube );

camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 10;
camera.lookAt(0, 0, 0);

var loader = new ColladaLoader();

var dm = null

//const filename = 'cubo.dae'
const filename = 'dm.dae'
loader.load(filename, function(collada){
    dm = collada.scene     
    scene.add(dm);
    dm.position.x = -88;
    dm.position.y = 20;
    /*
    dm.position.x = 20;
    dm.position.y = 3;
    dm.position.z = 60;
    dm.rotation.x = 1.57;
    dm.rotation.y = 0;
    dm.rotation.z = -1.57;
    */
});

const light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

// White directional light at half intensity shining from the top.
const directionalLight = new THREE.DirectionalLight( 0xffffff, 1.0 );
scene.add( directionalLight );

let pause = true;

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    if (event.key === ' ') {
        pause = !pause;
    }
};

function animate() {
	requestAnimationFrame( animate );

    if (dm != null && !pause) {
        dm.rotation.x += 0.01;
        dm.rotation.y += 0.02;
        dm.rotation.z += 0.03;
    }
    // console.log(dm.rotation)

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;	

    renderer.render( scene, camera );
}
animate();

