var scene, renderer, camera, controls, grid;
var userObjects = [];
var selectionBox,selectionControls;
var selectedObjects=[];
var canvasElem = document.getElementById( "viewport" );
var editorLog = document.getElementById( "editorLog" );
var propertiesTab = document.getElementById( "propTab" );
var WIDTH = canvasElem.getBoundingClientRect().width;
var HEIGHT = canvasElem.getBoundingClientRect().height;

var simulatePhysics = false;
var clock = new THREE.Clock();
Physijs.scripts.worker = 'scripts/Physijs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

window.onload = function(){
	init();
	animate();
}

function init(){
	//canvasElem = document.getElementById( "viewport" );
	canvasElem.addEventListener( 'mouseup', onEditorMouseClick, false );
	canvasElem.addEventListener( 'mousemove', updatePropertiesTab );
	propertiesTab.addEventListener( 'change', onPropertiesChanged );
	//window.addEventListener( 'resize', onCanvasResize, false);
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
	selectionControls.update();
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
function addNewObj(type){
	var obj;
	var defaultMaterial = new THREE.MeshBasicMaterial({color: 0xffffbb});
	switch(type){
		case 1: //obj = new Physijs.BoxMesh(new THREE.BoxBufferGeometry(1, 1, 1), defaultMaterial);
				obj = new GameObject(new THREE.BoxBufferGeometry(1, 1, 1), defaultMaterial, Physijs.BoxMesh);
				break;
		case 2: //obj = new Physijs.CylinderMesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 16), defaultMaterial);
				obj = new GameObject(new THREE.CylinderGeometry(0.5, 0.5, 1, 16), defaultMaterial, Physijs.CylinderMesh);
				break;
		case 3: //obj = new Physijs.SphereMesh(new THREE.SphereGeometry(0.5, 12, 8), defaultMaterial);
				obj = new GameObject(new THREE.SphereGeometry(0.5, 12, 8), defaultMaterial, Physijs.SphereMesh);
				break;
		case 4: addCustomObj(defaultMaterial);
					return;
				break;
	}
	scene.add(obj);
	obj.__dirtyPosition = true;
    obj.__dirtyRotation = true;

	userObjects.push(obj);
	obj.name="object." + userObjects.length;
	updateList();

	if(selectionBox == undefined){
		selectionBox = new THREE.BoxHelper(obj, 0xff0000);
		scene.add(selectionBox);
	}else{
		selectionBox.update(obj);
	}
	
	selectObject(obj);
	//document.getElementById( "menu" ).innerHTML += selectedObjects[0].name;
	animate();
	return false;
}

function updateViewportControls(){
	controls.update();
	//selectionControls.update();
}

function onEditorMouseClick(event){
	var xfac = 0;//-0.022;
	var yfac = 0;//0.095;
	event.preventDefault();
	//console.log("up");
	var rect = canvasElem.getBoundingClientRect();

	var vector = new THREE.Vector3();
	var raycaster = new THREE.Raycaster();
	var dir = new THREE.Vector3();
	var mouse = new THREE.Vector2();
	/*mouse.x = ( event.clientX / WIDTH ) * 2 - 1 + xfac;
	mouse.y = - ( event.clientY / HEIGHT ) * 2 + 1 + yfac;*/
	mouse.x = (( event.clientX - rect.left ) / rect.width) * 2 - 1;
	mouse.y = -(( event.clientY - rect.top ) / rect.height) * 2 + 1;

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

	var intersects = raycaster.intersectObjects( userObjects, true );
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
	selectedObjects = [];
	selectedObjects.push(obj);
	selectionControls.attach(obj);
	//document.getElementById("objName").value = obj.name;
	setColor(parseInt(obj.userData.ButtonId) , false);
	document.getElementById("bottom").innerHTML = obj.name;
	updatePropertiesTab();
	//render();
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
	if(key == 13 || key == 9){
		//event.preventDefault();
		var tempName = document.getElementById("objName").value;
		if( selectedObjects.length > 0 ){
			if(tempName != ""){
				selectedObjects[0].name = tempName;
			}else{
				document.getElementById("objName").value = selectedObjects[0].name;
			}
			document.getElementById("objName").blur();
			updateList();
			document.getElementById("bottom").innerHTML = selectedObjects[0].name;
		}
	}
}

function onCanvasResize(){
	//console.log("before"+WIDTH);
	/*WIDTH = 0.5913 * window.innerWidth; 
	HEIGHT = 0.7 * window.innerHeight;*/
	/*WIDTH = canvasElem.getBoundingClientRect().width;
	HEIGHT = canvasElem.getBoundingClientRect().height;*/
	//console.log("after"+WIDTH);
	renderer.setSize( WIDTH, HEIGHT);
	camera.aspect	= WIDTH / HEIGHT;
	camera.updateProjectionMatrix();
	canvasElem.width=WIDTH;
	canvasElem.height=HEIGHT;
	//console.log(canvasElem.width);
}
function updateList(){
	var list = document.getElementById("objectList");
	list.innerHTML = "";
	for(var i=0;i<userObjects.length;i++){
		list.innerHTML += "<input type='button' class='button' id='obj" + i + "' value = \""
							+ userObjects[i].name + " \" onclick=\"setColor('" + i + "')\"/><br>";
		userObjects[i].userData = { ButtonId: i };
	}
}
function setColor(btn, setFromList = true){
  var crnt=btn;  
  var i=0;
  len = userObjects.length;
  while(i<len){
  var property = document.getElementById("obj"+i);
  //console.log(btn);
    if (i != crnt){
        property.style.backgroundColor = "#444444";   
        property.style.color='lightgrey';
        //property.style.border='1px hidden';
    }
    else{
        property.style.backgroundColor = "grey";
        property.style.color='white';
        if(setFromList){
        	selectObject(userObjects[i]);
        }
        //property.style.border='1px solid black';
    }
  	i++;
	}
}

function addCustomObj(material){
	
	var objPath = window.prompt("Enter Object Path(Web):");
	var texPath = "";//window.prompt("Enter Texture Path(Web):");
	var manager = new THREE.LoadingManager();
				manager.onProgress = function ( item, loaded, total ) {
					console.log( item, loaded, total );
					editorLog.innerHTML += "<span style='color:lightgreen'>" + item + ' loaded <br></span>';
				};
	var texture = new THREE.TextureLoader( manager ).load(texPath);
    var loader  = new THREE.OBJLoader( manager ).load(objPath,  
    	function ( object )
        {
        	var name;
        	var objGeometry;
            object.traverse(
                function ( child )
                {
                    if(child instanceof THREE.Mesh)
                    {
                    	child.material = material;
						//child.material.map = texture;
						objGeometry = child.geometry;
						name = child.name;
					}
				} );

            while(object.parent!=null){
				object=object.parent;
			}
			var obj = new Physijs.BoxMesh( objGeometry, material);
			/*obj.__dirtyPosition = true;
    		obj.__dirtyRotation = true;*/

    		scene.add(obj);
			userObjects.push(obj);
			
			obj.name = name == '' ? "object." + userObjects.length : name;
			updateList();
			if(selectionBox == undefined){
				selectionBox = new THREE.BoxHelper(object, 0xff0000);
				scene.add(selectionBox);
			}else{
				selectionBox.update(obj);
			}
			selectObject(obj);
			animate();
		},
		function ( xhr ) {
			if ( xhr.lengthComputable ) {
				var percentComplete = xhr.loaded / xhr.total * 100;
				console.log( Math.round(percentComplete, 2) + '% downloaded' );
				editorLog.innerHTML += Math.round(percentComplete, 2) + '% downloaded <br>';
				}
			},
			function ( xhr ) {
				//window.alert("failed to load resource from " + objPath);
				editorLog.innerHTML += "<span style='color:red'>" + "Failed to load resource from '" + objPath + "'<br></span>";
				return null;
			} );
}

function updateTransforms(event = null){
	if(event){
		var key = event.keyCode;
		var fac = 1;
		targ = event.target;
		//event.preventDefault();
		var trans;
		if(targ.id.charAt(0) == 'p'){
			trans = selectedObjects[0].position;
		}else if(targ.id.charAt(0) == 'r'){
			trans = selectedObjects[0].rotation;
			fac = Math.PI / 180;
		}else{
			trans = selectedObjects[0].scale;
		}
		//console.log(key);
		if(key == 13 || key == 9){

			if(targ.id.charAt(1) == 'X')
					trans.x = parseFloat(targ.value * fac);
			else if(targ.id.charAt(1) == 'Y')
					trans.y = parseFloat(targ.value * fac);
			else
					trans.z = parseFloat(targ.value * fac);
			document.getElementById(targ.id).blur();
		}
	}
}

function onPropertiesChanged(event){
	console.log("properties changed");
	var targ = event.target;
	if(targ.id.substring(0,4) == "phy_"){
		if(targ.id.substring(4) == "static"){
			if(targ.checked){
				selectedObjects[0].setAngularFactor( new THREE.Vector3() );
				selectedObjects[0].setLinearFactor( new THREE.Vector3() );
				selectedObjects[0].isStatic = true;
				//selectedObjects[0]._physijs.mass = 0;
			}else{
				selectedObjects[0].setAngularFactor( new THREE.Vector3( 1 ,1 ,1 ) );
				selectedObjects[0].setLinearFactor( new THREE.Vector3( 1 ,1 ,1 ) );
				selectedObjects[0].isStatic = false;
				//selectedObjects[0]._physijs.mass = 1;
			}
		}
		if(targ.id.substring(4) == "friction"){
			selectedObjects[0].setFriction( parseFloat(targ.value) );
			targ.blur();
		}if(targ.id.substring(4) == "restitution"){
			selectedObjects[0].setRestitution( parseFloat(targ.value) );
			targ.blur();
		}
	}
}
function updatePropertiesTab(){
	if(selectedObjects[0]){
		var obj = selectedObjects[0];
		document.getElementById("objName").value = obj.name;
		document.getElementById("pX").value = obj.position.x;
		document.getElementById("pY").value = obj.position.y;
		document.getElementById("pZ").value = obj.position.z;
		document.getElementById("rX").value = obj.rotation.x * 180 / Math.PI;
		document.getElementById("rY").value = obj.rotation.y * 180 / Math.PI;
		document.getElementById("rZ").value = obj.rotation.z * 180 / Math.PI;
		document.getElementById("sX").value = obj.scale.x;
		document.getElementById("sY").value = obj.scale.y;
		document.getElementById("sZ").value = obj.scale.z;
		document.getElementById("phy_static").checked = obj.isStatic;
		document.getElementById("phy_mass").value = obj.mass;
		document.getElementById("phy_friction").value = obj.friction;
		document.getElementById("phy_restitution").value = obj.restitution;
	}
}
//GameObject Class start
function GameObject(geometry, material, Meshtype){
	this.isStatic = false;
	this.friction = 0.8;
	this.restitution = 0.2;

	this.phyMaterial = Physijs.createMaterial( material, this.friction, this.restitution );
	Meshtype.call(this, geometry, this.phyMaterial);

	this.mass = 1;
	//console.log(this.phyMaterial._physijs.friction);
}
GameObject.prototype = new Physijs.Mesh;
GameObject.prototype.constructor = GameObject;
GameObject.prototype.setFriction = function(friction){
	this.friction = friction;
	this.phyMaterial._physijs.friction = this.friction;
}
GameObject.prototype.setRestitution = function(restitution){
	this.restitution = restitution;
	this.phyMaterial._physijs.restitution = this.restitution;
}
//GameObject Class end