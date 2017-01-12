var scene, renderer, camera, controls;
var selectionBox;
var WIDTH = 800, HEIGHT = 600;
var selectedObjects=[];

var clock = new THREE.Clock();

init();
animate();

function init(){

	renderer = new THREE.WebGLRenderer({/*antialias:true*/});
	
	scene = new THREE.Scene();

	camera = new THREE.PerspectiveCamera(45, WIDTH/HEIGHT, 0.1, 1000);
	camera.position.set(0,5,25);
	scene.add(camera);

	renderer.setSize(WIDTH,HEIGHT);
	renderer.setClearColor(new THREE.Color(0x888888));

	var canvasElem = document.getElementById("viewport");
	canvasElem.style.width = WIDTH;
	canvasElem.style.height = HEIGHT;
	canvasElem.appendChild(renderer.domElement);

	controls = new THREE.OrbitControls( camera, canvasElem );
	controls.addEventListener( 'change', render );

	var grid = new THREE.GridHelper(10,10,0x444444,0x666666);
	scene.add(grid);

}
function render(){
	renderer.render(scene, camera);
}
function animate(){
	requestAnimationFrame(render);
	controls.update();
}
function addNewObj(){
	var obj = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xffffbb}));
	obj.position.set(Math.random()*6-3,Math.random()*6-3,Math.random()*6-3);
	scene.add(obj);
	obj.name="lol";
	if(selectionBox == undefined){
		selectionBox = new THREE.BoxHelper(obj, 0xff0000);
		scene.add(selectionBox);
	}else{
		selectionBox.update(obj);
	}
	
	selectedObjects = [];
	selectedObjects.push(obj);
	
	document.getElementById("menu").innerHTML += selectedObjects[0].name;
	animate();
}