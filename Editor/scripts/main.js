var scene, renderer, camera, controls,grid;
var userObjects = [];
var selectionBox,selectionControls;
var WIDTH = 800, HEIGHT = 600;
var selectedObjects=[];

var simulatePhysics = false;
var clock = new THREE.Clock();
Physijs.scripts.worker = 'scripts/Physijs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

init();
//window.addEventListener('load', init);
animate();

function init(){
	var canvasElem = document.getElementById( "viewport" );
	canvasElem.addEventListener( 'mouseup', onEditorMouseClick, false );
	window.addEventListener( 'keydown', onEditorKeyDown, false );
	window.addEventListener( 'keyup', onEditorKeyUp, false );

	renderer = new THREE.WebGLRenderer({/*antialias:true*/});
	
	//scene = new THREE.Scene();
	scene = new Physijs.Scene();

	camera = new THREE.PerspectiveCamera( 45, WIDTH/HEIGHT, 0.1, 1000 );
	camera.position.set( 0, 5, 25 );
	scene.add( camera );

	renderer.setSize( WIDTH, HEIGHT );
	renderer.setClearColor( new THREE.Color(0x888888) );

	
	canvasElem.style.width = WIDTH;
	canvasElem.style.height = HEIGHT;
	canvasElem.appendChild( renderer.domElement );
	//var t = document.createTextNode(selectedObjects[0].name);       // Create a text node
	//canvasElem.appendChild(t);

	controls = new THREE.OrbitControls( camera, canvasElem );
	selectionControls = new THREE.TransformControls( camera, canvasElem);
	scene.add(selectionControls);

	controls.addEventListener( 'change', render );	
	selectionControls.addEventListener( 'change', render );

	grid = new THREE.GridHelper( 10, 20, 0x444444, 0x666666 );
	scene.add(grid);

}
function render(){
	if(selectionBox!==undefined){
		selectionBox.update(selectedObjects[0]);
	}
	renderer.render( scene, camera );
	if(simulatePhysics){
		scene.simulate();
	}
}
function animate(){
	updateViewportControls();
	render();
	requestAnimationFrame( animate );
	//animate();
}
function addNewObj(){
	//var obj = new THREE.Mesh(new THREE.BoxBufferGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xffffbb}));
	//var k = parseInt(window.prompt("Enter Mass"));
	var obj = new Physijs.BoxMesh(new THREE.BoxBufferGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xffffbb}));
	scene.add(obj);
	obj.__dirtyPosition = true;
	userObjects.push(obj);
	obj.name="object." + userObjects.length;

	if(selectionBox == undefined){
		selectionBox = new THREE.BoxHelper(obj, 0xff0000);
		scene.add(selectionBox);
	}else{
		selectionBox.update(obj);
	}
	
	selectObject(obj);
	//document.getElementById( "menu" ).innerHTML += selectedObjects[0].name;
	animate();
}

function updateViewportControls(){
	controls.update();
	//selectionControls.update();
}

function onEditorMouseClick(event){
	var xfac = -0.022;
	var yfac = 0.095;
	event.preventDefault();
	//console.log("up");
	var vector = new THREE.Vector3();
	var raycaster = new THREE.Raycaster();
	var dir = new THREE.Vector3();
	var mouse = new THREE.Vector2();
	mouse.x = ( event.clientX / WIDTH ) * 2 - 1 + xfac;
	mouse.y = - ( event.clientY / HEIGHT ) * 2 + 1 + yfac;

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

	var intersects = raycaster.intersectObjects( userObjects );
	if(intersects.length > 0){
		if(intersects.length == 1){
			selectObject(intersects[0].object);
		}else{
			var matched=false;
			var i=0;
			while( i<intersects.length ){
				if(intersects[i].object == selectedObjects[0]){
					matched=true;
					break;
				}
				i++;
			}if( !matched ){
				selectObject( intersects[0].object );
			}else{
				selectObject( intersects[(i+1)%intersects.length].object );
			}
		}
	}
}

function selectObject(obj){
	if(obj!=grid){
		selectedObjects = [];
		selectedObjects.push(obj);
		selectionControls.attach(obj);
		document.getElementById("bottom").innerHTML = obj.name;
		render();
	}
}

function onEditorKeyDown(event){
	//event.preventDefault();
	var key = event.keyCode;
	//console.log( key );
	if(key == 80){	//Enter Key Pressed
		simulatePhysics = simulatePhysics ? false : true;
		if(simulatePhysics){
			scene.onSimulationResume();
		}
	}
	if(key == 17){
		selectionControls.setTranslationSnap(1);
	}
}

function onEditorKeyUp(event){
	//event.preventDefault();
	var key = event.keyCode;
	if(key == 17){
		selectionControls.setTranslationSnap(null);
	}
}

function setObjName(event){
	var key = event.keyCode;
	if(key == 13){
		event.preventDefault();
		var tempName = document.getElementById("sample").value;
		if( selectedObjects.length > 0 ){
			selectedObjects[0].name = tempName;
			document.getElementById("sample").value = "";
			document.getElementById("bottom").innerHTML = selectedObjects[0].name;
		}
	}
}