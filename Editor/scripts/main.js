var scene, renderer, camera, controls,grid;
var selectionBox,selectionControls;
var WIDTH = 800, HEIGHT = 600;
var selectedObjects=[];

var clock = new THREE.Clock();

init();
//window.addEventListener('load', init);
animate();

function init(){
	document.body.addEventListener( 'mouseup', onEditorMouseClick, false);

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
	selectionControls = new THREE.TransformControls( camera, canvasElem);
	scene.add(selectionControls);

	controls.addEventListener( 'change', render );	
	selectionControls.addEventListener( 'change', render );

	grid = new THREE.GridHelper(10,20,0x444444,0x666666);
	scene.add(grid);

}
function render(){
	if(selectionBox!==undefined){
		selectionBox.update(selectedObjects[0]);
	}
	renderer.render(scene, camera);
}
function animate(){
	updateViewportControls();
	requestAnimationFrame(render);
}
function addNewObj(){
	var obj = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xffffbb}));
	scene.add(obj);
	obj.name="haha";

	if(selectionBox == undefined){
		selectionBox = new THREE.BoxHelper(obj, 0xff0000);
		scene.add(selectionBox);
	}else{
		selectionBox.update(obj);
	}
	
	selectObject(obj);
	document.getElementById("menu").innerHTML += selectedObjects[0].name;
	animate();
}

function updateViewportControls(){
	controls.update();
	//selectionControls.update();
}

function onEditorMouseClick(event){
	event.preventDefault();
	console.log("up");
	var vector = new THREE.Vector3();
	var raycaster = new THREE.Raycaster();
	var dir = new THREE.Vector3();
	var mouse = new THREE.Vector2();
	mouse.x = (( event.clientX / WIDTH ) * 2 - 1.014);
	mouse.y = - ( event.clientY / HEIGHT ) * 2 + 1 + 0.054;

	if ( camera instanceof THREE.OrthographicCamera ) {
		vector.set( ( event.clientX / WIDTH ) * 2 - 1, - ( event.clientY / HEIGHT ) * 2 + 1, - 1 ); // z = - 1 important!
		vector.unproject( camera );
		dir.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );
		raycaster.set( vector, dir );
	} else if ( camera instanceof THREE.PerspectiveCamera ) {
		raycaster.setFromCamera(mouse, camera);
		//scene.add(new THREE.ArrowHelper( raycaster.ray.direction, raycaster.ray.origin, 100, Math.random() * 0xffffff ));
		render();
	}

	var intersects = raycaster.intersectObjects( scene.children );
	if(intersects.length > 0){
		selectObject(intersects[0].object);
	}
}

function selectObject(obj){
	if(obj!=grid){
		selectedObjects = [];
		selectedObjects.push(obj);
		selectionControls.attach(selectedObjects[0]);
		render();
	}
}