var scene,renderer,camera;
var WIDTH = 800,HEIGHT = 600;

init();
animate();

function init(){

	renderer = new THREE.WebGLRenderer();
	
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 1000);
	camera.position.set(0,5,25);
	scene.add(camera);

	renderer.setSize(WIDTH,HEIGHT);
	renderer.setClearColor(new THREE.Color(0xBBBBBB));

	var canvasElem = document.getElementById("viewport");
	canvasElem.appendChild(renderer.domElement);

	var grid = new THREE.GridHelper(10,10);
	scene.add(grid);
}
function render(){
	renderer.render(scene, camera);
}
function animate(){
	requestAnimationFrame(render);
}