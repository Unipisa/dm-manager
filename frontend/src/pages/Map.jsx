import { useState, useEffect } from 'react'

import * as THREE from 'three'

function mountThree(element, width=640, height=480) {
    console.log("mountThree!")
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera( 75, width/height, 0.1, 1000 )
    

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize( width, height )
    const el = element.appendChild( renderer.domElement )

    const geometry = new THREE.BoxGeometry( 1, 1, 1 )
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } )
    const cube = new THREE.Mesh( geometry, material )
    scene.add( cube )

    camera.position.z = 5

    let stop = false

    function animate() {
        if (stop) return
        
        requestAnimationFrame( animate )
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
        renderer.render( scene, camera )
    }
    animate()
    return () => {
        console.log("unmountThree!")
        stop = true
        element.removeChild(el)
    }
}

export default function MapPage() {
    const [element, setElement] = useState(null)    
    useEffect(() => {
        if (!element) return
        return mountThree(element)
    }, [element])
    return <div ref={setElement} />
}