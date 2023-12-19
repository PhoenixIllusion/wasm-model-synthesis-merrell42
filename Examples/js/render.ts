export type ModelType = 'simpletiled'|'overlapping'|'tiledmodel';
type Size = { width: number, height: number, depth: number };
function RenderFunction(width: number, height: number, depth: number,
  getLabel: (x: number, y: number, z: number)=> number,
  onLabel: (x: number, y: number, z: number, label: number)=>void): void {
    for (let z = 0; z < depth; z++)
    for (let y = 0; y < height; y++) {
      let line = [];
      for (let x = 0; x < width; x++) {
        const label = getLabel(x,y,z);
        onLabel(x,y,z,label);
      }
    }
}

export function SimpleTileRender(div: HTMLDivElement, size: Size,
  getLabel: (x: number, y: number, z: number)=> number,
  urlForLabel: (label: number)=>{url: string, class: string}): void {
  div.innerHTML = '';
  div.style.gridTemplateColumns = `repeat(${size.width},1fr)`;

  const createTile = (label: number): HTMLImageElement => {
    const img = new Image();
    const data = urlForLabel(label);
    img.src = data.url;
    img.className = data.class;
    return img;
  }

  RenderFunction(size.width, size.height, size.depth, getLabel, 
    (_x, _y, _z, label) => {
      div.appendChild(createTile(label));
    })
}

export function OverlappingRender(div: HTMLDivElement, size: Size,
  getLabel: (x: number, y: number, z: number)=> number,
  getImageDataForLabel: (label: number)=>ImageData
  ): void {
    
    div.innerHTML = '';
    const canvas = document.createElement('canvas');
    div.appendChild(canvas);
    canvas.className = 'overlapping';
    canvas.style.width = 16 * size.width + 'px';
    canvas.style.width = 16 * size.height + 'px';
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d')!;

    const drawTile = (x: number, y: number, _z: number, label: number): void => {
      const imgData = getImageDataForLabel(label);
      ctx.putImageData(imgData, x, y);
    }

    RenderFunction(size.width, size.height, size.depth, getLabel, drawTile)
  }


import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera';
import { DirectionalLight } from 'three/src/lights/DirectionalLight';
import { Vector3 } from 'three/src/math/Vector3';
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { Scene } from 'three/src/scenes/Scene';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { BoxGeometry, BufferGeometry, Material, Mesh, MeshStandardMaterial } from 'three/src/Three';

  export function TiledModelRender(div: HTMLDivElement, size: Size,
    getLabel: (x: number, y: number, z: number)=> number,
    getModelForLabel: (label: number)=>string
    ): void {
      div.innerHTML = '';

      const renderer = new WebGLRenderer();
      renderer.setClearColor(0xbfd1e5);
      renderer.setPixelRatio(window.devicePixelRatio);

      const viewportSize = {width: window.innerWidth*0.8, height: window.innerHeight*0.8}
      renderer.setSize(viewportSize.width, viewportSize.height);
      const camera = new PerspectiveCamera(60, viewportSize.width/ viewportSize.height, 0.2, 2000);
      camera.position.set(0, 15, 30);
      camera.lookAt(new Vector3(0, 0, 0));

      const scene = new Scene();
      const dirLight = new DirectionalLight(0xffffff, 1);
      dirLight.position.set(10, 10, 5);
      scene.add(dirLight);
    
      const controls = new OrbitControls(camera, div);
    
      div.appendChild(renderer.domElement);

    const geometryCache: {[label: number]: BufferGeometry} = {}
    const materialCache: {[label: number]: Material} = {
      1: new MeshStandardMaterial({color: 0xFF0000}),
      2: new MeshStandardMaterial({color: 0x00FF00}),
      3: new MeshStandardMaterial({color: 0x0000FF}),
      4: new MeshStandardMaterial({color: 0xFFFF00}),
      5: new MeshStandardMaterial({color: 0xFF00FF}),
      6: new MeshStandardMaterial({color: 0x00FFFF}),
      7: new MeshStandardMaterial({color: 0x663333}),
      8: new MeshStandardMaterial({color: 0x336633}),
      9: new MeshStandardMaterial({color: 0x333366}),
      10: new MeshStandardMaterial({color: 0x666633}),
      11: new MeshStandardMaterial({color: 0x663366}),
      12: new MeshStandardMaterial({color: 0x336666})
    }


    const drawModel = (x: number, y: number, z: number, label: number): void => {
      if(label > 0) {
        let material = materialCache[label]|| new MeshStandardMaterial({color: 0xFFFFFF});
        let geometry = geometryCache[label]|| new BoxGeometry(1,1,1);
        if(!materialCache[label]) materialCache[label] = material;
        if(!geometryCache[label]) geometryCache[label] = geometry;

        const mesh = new Mesh(geometry, material);
        mesh.position.set(x-size.width/2,z-size.depth/2,y-size.height/2);
        scene.add(mesh);
      }
    };

    RenderFunction(size.width, size.height, size.depth, getLabel, drawModel)

    const render = () => {
      requestAnimationFrame(render);
	    renderer.render(scene, camera);
    };
    render();
  }