var scene, renderer, camera, controls, grid;
var userObjects = [],userObjectsOldPos = [];
var selectionBox,selectionControls;
var selectedObjects=[];
var canvasElem = document.getElementById( "viewport" );
var editorLog = document.getElementById( "editorLog" );
var propertiesTab = document.getElementById( "propTab" );
var WIDTH = canvasElem.getBoundingClientRect().width;
var HEIGHT = canvasElem.getBoundingClientRect().height;
const particle_limit = 10000;

var scene_gravity = new THREE.Vector3( 0, -10, 0);
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
	scene.setGravity( scene_gravity );
	camera = new THREE.PerspectiveCamera( 45, WIDTH/HEIGHT, 0.1, 1000 );
	camera.position.set( 0, 5, 25 );
	scene.add( camera );

	renderer.setSize( WIDTH, HEIGHT );
	renderer.setClearColor( new THREE.Color(0x888888) );
	//renderer.sortObjects = false;
	
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
	var defaultMaterial = new THREE.MeshBasicMaterial({color: 0x555555});
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
		case 5: obj = new ParticleSystem();
				break;
	}
	scene.add(obj);
	obj.scene_index = userObjects.length;
	userObjects.push(obj);
	obj.name = "object." + userObjects.length;
	updateList();

	if(selectionBox == undefined){
		selectionBox = new THREE.BoxHelper(obj, 0xff0000);
		scene.add(selectionBox);
	}else{
		selectionBox.update(obj);
	}
	obj.setAsStatic();
	selectObject(obj);
	animate();
	return false;
}
function removeObject(){
	if(selectedObjects[0] && userObjects.length>1){
		var name = selectedObjects[0].name;
		var index = selectedObjects[0].scene_index;
		userObjects.splice(index,1);
		scene.remove(selectedObjects[0]);
		updateList();
		selectObject(userObjects[(index+1)%userObjects.length]);
		LogEditor(name + " removed from scene","success");
	}else{
		LogEditor("2 or more Objects must be present to remove an Object","error")
	}
}
function addLamp(type){
	var lamp;
	switch(type){
		case 1: //lamp = new THREE.PointLight( 0xff0000, 1, 100 );
				lamp = new Lamp( 1 , 0xff0000, 100 );
				break;
		case 2: //lamp = new THREE.DirectionalLight( 0xffffff, 0.5 );
				lamp = new Lamp( 2 , 0xff0000, 1 );
				break;
		case 3: //lamp = new THREE.SpotLight( 0xffffff );
				lamp = new Lamp( 3 , 0xff0000);
				break;
		case 4: //lamp = new THREE.AmbientLight( 0x404040 );
				lamp = new Lamp( 4 , 0xff0000);
				break;
	}
	scene.add(lamp);
	lamp.name = "lamp." + userObjects.length;
	userObjects.push(lamp);
	updateList();
	if(selectionBox == undefined){
		selectionBox = new THREE.BoxHelper(lamp, 0xff0000);
		scene.add(selectionBox);
	}else{
		selectionBox.update(lamp);
	}
	selectObject(lamp);
	animate();
}

function updateViewportControls(){
	controls.update();
	//selectionControls.update();
}

function onEditorMouseClick(event){

	event.preventDefault();
	//console.log("up");
	var rect = canvasElem.getBoundingClientRect();

	var vector = new THREE.Vector3();
	var raycaster = new THREE.Raycaster();
	var dir = new THREE.Vector3();
	var mouse = new THREE.Vector2();
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
	/*obj.__dirtyPosition = true;
	obj.__dirtyRotation = true;*/
	selectedObjects = [];
	selectedObjects.push(obj);
	selectionControls.attach(obj);
	//document.getElementById("objName").value = obj.name;
	setColor(parseInt(obj.userData.ButtonId) , false);
	//document.getElementById("bottom").innerHTML = obj.name;
	updatePropertiesTab();
	//render();
}

function onEditorKeyDown(event){
	//event.preventDefault();
	var key = event.keyCode;
	//console.log( key );
	if(key == 80){	//P Key Pressed
		simulatePhysics = simulatePhysics ? false : true;
		if(simulatePhysics){
			setUserObjectsOldPositions();
			scene.onSimulationResume();
			LogEditor("Simulation started","success");
		}else{
			/*selectedObjects[0].__dirtyPosition = true;
			selectedObjects[0].__dirtyRotation = true;*/
			resetScene();
			LogEditor("Simulation stopped","error");
		}
	}
	if(key == 17){//Control Key
		selectionControls.setTranslationSnap(1);
	}
	if(key == 110 || key == 190 || key == 70){ //fullstop,numpad fullstop and F keys
		var selPos = selectedObjects[0].position;
		var vec = new THREE.Vector3();
		camera.getWorldDirection( vec );
		vec.multiplyScalar(-4 * selectedObjects[0].scale.length());
		vec.add(selPos);
		camera.position.copy(vec);
		controls.target.set(selPos.x,selPos.y,selPos.z);
	}
}

function onEditorKeyUp(event){
	//event.preventDefault();
	var key = event.keyCode;
	//console.log(key);
	if(key == 17){//Control Key
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
					//editorLog.innerHTML += "<span style='color:lightgreen'>" + item + ' loaded <br></span>';
					LogEditor( item + ' loaded <br>', "success" );
				};
	var texture = new THREE.TextureLoader( manager ).load(texPath);
	material.color = new THREE.Color(0x666666);
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
			//var obj = new Physijs.BoxMesh( objGeometry, material);
			var obj = new GameObject(objGeometry, material, Physijs.BoxMesh);
			/*obj.__dirtyPosition = true;
    		obj.__dirtyRotation = true;*/

    		scene.add(obj);
			userObjects.push(obj);
			obj.setAsStatic();

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
				//editorLog.innerHTML += Math.round(percentComplete, 2) + '% downloaded <br>';
				LogEditor( Math.round(percentComplete, 2) + '% downloaded' );
				}
			},
			function ( xhr ) {
				//window.alert("failed to load resource from " + objPath);
				//editorLog.innerHTML += "<span style='color:red'>" + "Failed to load resource from '" + objPath + "'<br></span>";
				LogEditor( "Failed to load resource from '" + objPath + "'", "error");
				return null;
			} );
}

function resetScene(){
	var zVec = new THREE.Vector3();
	for(i=0; i<userObjects.length; i++){
		userObjects[i].position.x = userObjectsOldPos[i].px;
		userObjects[i].position.y = userObjectsOldPos[i].py;
		userObjects[i].position.z = userObjectsOldPos[i].pz;

		userObjects[i].rotation.x = userObjectsOldPos[i].rx;
		userObjects[i].rotation.y = userObjectsOldPos[i].ry;
		userObjects[i].rotation.z = userObjectsOldPos[i].rz;
		//console.log(userObjectsOldPos[i]);
		userObjects[i].__dirtyPosition = true;
		userObjects[i].__dirtyRotation = true;
		userObjects[i].setAngularVelocity( zVec );
		userObjects[i].setLinearVelocity( zVec );
	}	
}

function setUserObjectsOldPositions(){
	var i=0;
	userObjectsOldPos = [];
	for(i=0; i<userObjects.length; i++){
		var posToPush = {};
		posToPush.px = userObjects[i].position.x;
		posToPush.py = userObjects[i].position.y;
		posToPush.pz = userObjects[i].position.z;
		posToPush.rx = userObjects[i].rotation.x;
		posToPush.ry = userObjects[i].rotation.y;
		posToPush.rz = userObjects[i].rotation.z;
		userObjectsOldPos.push( posToPush );
		//LogEditor(userObjects[i].position.x);
	}
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
	//console.log("properties changed");
	var targ = event.target;
	if(targ.id.substring(0,4) == "phy_"){
		if(targ.id.substring(4) == "static"){
			if(targ.checked){
				selectedObjects[0].setAsStatic();
				//selectedObjects[0]._physijs.mass = 0;
			}else{
				selectedObjects[0].setAngularFactor( new THREE.Vector3( 1 ,1 ,1 ) );
				selectedObjects[0].setLinearFactor( new THREE.Vector3( 1 ,1 ,1 ) );
				selectedObjects[0].isStatic = false;
				//selectedObjects[0]._physijs.mass = 1;
			}
		}
		if(targ.id.substring(4) == "mass"){
			selectedObjects[0]._physijs.mass = parseFloat(targ.value) ;
		}
		if(targ.id.substring(4) == "friction"){
			selectedObjects[0].setFriction( parseFloat(targ.value) );
		}if(targ.id.substring(4) == "restitution"){
			selectedObjects[0].setRestitution( parseFloat(targ.value) );
		}
		targ.blur();
	}/*else{
		targ.value = "";
	}*/
	if(targ.id.substring(0,5) == "part_" && selectedObjects[0].ObjType == "ParticleSystem"){
		if(targ.id.substring(5) == "opacity"){
			selectedObjects[0].particles.material.opacity = parseFloat(targ.value);
		}
		if(targ.id.substring(5) == "size"){
			selectedObjects[0].particles.material.size = parseFloat(targ.value);
		}
		if(targ.id.substring(5) == "rate"){
			selectedObjects[0].rate = parseFloat(targ.value);
		}
		if(targ.id.substring(5) == "gInfluence"){
			selectedObjects[0].gravity_influence = parseFloat(targ.value);
		}
		targ.blur();
	}/*else{
		targ.value = "";
	}*/
	if(targ.id.substring(0,4) == "mat_" && userObjects.length>0){
		if(targ.id.substring(4) == "name"){
			selectedObjects[0].MatName = targ.value;
		}
		if(targ.id.substring(4) == "color"){
			selectedObjects[0].material.color.setHex( "0x" + targ.value.substring(1) );
		}
		if(targ.id.substring(4) == "type"){
			var newMat;
			var curMat = selectedObjects[0].material;
			if(targ.value == "1"){
				selectedObjects[0].MatType = 1;
				newMat = new THREE.MeshBasicMaterial({color: curMat.color});
			}else if(targ.value == "2"){
				selectedObjects[0].MatType = 2;
				newMat = new THREE.MeshLambertMaterial({color: curMat.color});
			}else if(targ.value == "3"){
				selectedObjects[0].MatType = 3;
				newMat = new THREE.MeshStandardMaterial({color: curMat.color});
			}else if(targ.value == "4"){
				selectedObjects[0].MatType = 4;
				newMat = new THREE.MeshPhongMaterial({color: curMat.color});
			}
			selectedObjects[0].material = newMat;
		}
		targ.blur();
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
		if(obj.isLight){
			return;
		}
		document.getElementById("phy_static").checked = obj.isStatic;
		document.getElementById("phy_mass").value = obj.mass;
		document.getElementById("phy_friction").value = obj.friction;
		document.getElementById("phy_restitution").value = obj.restitution;
		document.getElementById("mat_name").value = selectedObjects[0].MatName;
		document.getElementById("mat_color").value = '#' + obj.material.color.getHexString();
		document.getElementById("mat_type").value = selectedObjects[0].MatType + "";
		if(obj.ObjType == "GameObject"){
			document.getElementById("part_opacity").value = "";
			document.getElementById("part_size").value = "";
			document.getElementById("part_rate").value = "";
			document.getElementById("part_gInfluence").value = "";
		}else if(obj.ObjType == "ParticleSystem"){
			document.getElementById("part_opacity").value = obj.particles.material.opacity;
			document.getElementById("part_size").value = obj.size;
			document.getElementById("part_rate").value = obj.rate;
			document.getElementById("part_gInfluence").value = obj.gravity_influence;
		}
	}
}
function LogEditor(message, type = "message"){
	var spn = "";
	if( type == "error" ){
		spn = "<span style='color:red'>";
	}else if( type == "message" ){
		spn = "<span style='color:white'>";
	}else if( type == "success" ){
		spn = "<span style='color:lightgreen'>";
	}else{
		return;
	}
	editorLog.innerHTML += spn + message + "<br></span>";
}

function appendUserCode(){
	var s = document.createElement("script");
	s.type = "text/javascript";
	s.id = "appendedCode";
    s.innerHTML = "window.addEventListener('keyup',runUserCode);function runUserCode(event){if(simulatePhysics){"
					+document.getElementById("userCode").value
        			+"window.requestAnimationFrame(runUserCode);}}";
    document.getElementById("main_body").appendChild(s);
	//document.getElementById("appendedCode").remove();
	//console.log(document.getElementById("main_body"));
}

function importTexture(){
	var path = window.prompt("Enter path of texture:");
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {
			console.log( item, loaded, total );
			LogEditor( item + ' loaded <br>', "success" );
		};
	manager.onError = function ( item ) {
		LogEditor( 'Failed to load ' + item + ' <br>', "error" );
		return;
	};
	var texture = new THREE.TextureLoader( manager ).load(path);
	console.log(texture);
	//if(texture.image)
		selectedObjects[0].material.map = texture;
		selectedObjects[0].material.needsUpdate = true;
}
//GameObject Class start
function GameObject(geometry, material, Meshtype){
	this.isStatic = true;
	this.friction = 0.8;
	this.restitution = 0.2;
	this.ObjType = "GameObject";
	this.MatType = 1;
	this.MatName = "new Material";
	this.scene_index = -1;

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
GameObject.prototype.setAsStatic = function(){
	var zVec = new THREE.Vector3();
	this.setAngularFactor( zVec );
	this.setAngularVelocity( zVec );
	this.setLinearFactor( zVec );
	this.setLinearVelocity( zVec );
	this.isStatic = true;
}
//GameObject Class end
//Particle System Class start
function ParticleSystem(count = particle_limit, size = 0.2, rate = 0.1, particle_opacity = 0.5 ){
	this.waitForUpdateFlag = false;
	this.particle_count = count;
	this.rate = rate;
	this.active_particles = Math.round(count * 0.016);
	this.gravity_influence = 1;
	this.clock = new THREE.Clock();
	this.point_velocities = [];

	var particle_points = new THREE.Geometry();
	var pMaterial = new THREE.PointsMaterial({
      color: 0xFFFFFF,
      size: size,
      transparent:true,
      opacity: particle_opacity
    });

    var mesh_trans_material = new THREE.MeshLambertMaterial( {visible:false/*transparent:true, opacity:0*/} );
	//THREE.Mesh.call( this, new THREE.BoxGeometry( 1, 1, 1), mesh_trans_material );
	GameObject.call( this, new THREE.BoxBufferGeometry( 1, 1, 1), mesh_trans_material, Physijs.BoxMesh );
	this.ObjType = "ParticleSystem";
	//this.mass = 0;

	var range = this.scale;
    for (var p = 0; p < this.particle_count; p++) {
    	/*var pX = Math.random() * range.x - range.x/2,
			pY = Math.random() * range.y - range.y/2,
			pZ = Math.random() * range.z - range.z/2;*/
		var pX = 0, pY = 0, pZ = 0;

		var point = new THREE.Vector3(pX, pY, pZ);
		//var point = new THREE.Vector3( this.position.x, this.position.y, this.position.z );
		particle_points.vertices.push( point );
		this.point_velocities.push( new THREE.Vector3( ) );
	}
	this.particles = new THREE.Points( particle_points, pMaterial );
	this.particles.sortParticles = true;
	this.dead_particles_start = 0;
	this.dead_particles_end = 0;
	scene.add(this.particles);
	if(!this.waitForUpdateFlag){
		requestAnimationFrame(this.update.bind(this));
	}
}

//ParticleSystem.prototype = Object.create(THREE.Mesh.prototype);
ParticleSystem.prototype = Object.create(GameObject.prototype);
ParticleSystem.prototype.constructor = ParticleSystem;
ParticleSystem.prototype.update = function(){
	var delta = this.clock.getDelta();
	if(simulatePhysics){
		var geo = this.particles.geometry;
		var range = this.scale;
		this.active_particles += Math.round(this.particle_count * delta * this.rate);
		this.active_particles = Math.min(this.active_particles, this.particle_count);

		if(this.particle_count != this.active_particles ){
			for( var p = 0; p < this.particle_count; p++ ){
				/*if( p < particle_limit && p > this.particle_count){
					LogEditor(p);
					geo.vertices[p].x = 0;
					geo.vertices[p].y = 0;
					geo.vertices[p].z = 0;
				}*/
				if( p < this.active_particles){
					this.point_velocities.push( new THREE.Vector3( ) );
					//this.particles.material.opacity = 0;
				}
				else{
					geo.vertices[p].x = this.position.x + Math.random() * range.x - range.x/2;
					geo.vertices[p].y = this.position.y + Math.random() * range.y - range.y/2;
					geo.vertices[p].z = this.position.z + Math.random() * range.z - range.z/2;
					//this.particles.material.opacity = 1;
				}
			}
		}else{
			this.dead_particles_end = Math.min( this.dead_particles_start + Math.round( this.particle_count * delta * this.rate), this.particle_count );
			for( var p = this.dead_particles_start; p < this.dead_particles_end; p++ ){
				var pX = this.position.x + Math.random() * range.x - range.x/2,
					pY = this.position.y + Math.random() * range.y - range.y/2,
					pZ = this.position.z + Math.random() * range.z - range.z/2;

				geo.vertices[p].copy(new THREE.Vector3(pX, pY, pZ));
				this.point_velocities[p].copy(new THREE.Vector3());
				//this.particles.material.opacity = this.particle_opacity;
			}
			this.dead_particles_start = ( this.dead_particles_end < this.particle_count ) ? this.dead_particles_end : 0;
		}
		this.particles.geometry.verticesNeedUpdate = true;
		this.particles.sortParticles = true;
		var pLen = this.active_particles;
		//var pLen = particle_limit;
		//LogEditor(pLen);
		while (pLen--){
			this.particles.material.opacity = 0.5;
			var verts = geo.vertices[pLen];
			var g = new THREE.Vector3();
			g.copy(scene_gravity);
			var vel = this.point_velocities[ pLen ];
			this.point_velocities[pLen].x = vel.x + g.x * delta * this.gravity_influence;
			this.point_velocities[pLen].y = vel.y + g.y * delta * this.gravity_influence;
			this.point_velocities[pLen].z = vel.z + g.z * delta * this.gravity_influence;

			verts.x +=  this.point_velocities[pLen].x * delta;
			verts.y +=  this.point_velocities[pLen].y * delta;
			verts.z +=  this.point_velocities[pLen].z * delta;
		}
		this.particles.geometry.verticesNeedUpdate = true;
	}
	if(!this.waitForUpdateFlag){
		requestAnimationFrame(this.update.bind(this));
	}
}
ParticleSystem.prototype.updateParticleCount = function(newCount){
	var geo = this.particles.geometry;
	var range = this.scale;
	//this.waitForUpdateFlag = true;
	var p = this.particle_count;
	//this.active_particles = Math.round(p * 0.016);
	while(p--){
		geo.vertices[p].x = this.position.x + Math.random() * range.x - range.x/2;
		geo.vertices[p].y = this.position.y + Math.random() * range.y - range.y/2;
		geo.vertices[p].z = this.position.z + Math.random() * range.z - range.z/2;
		this.point_velocities[p].copy(new THREE.Vector3());
		this.particles.material.opacity = 0;
	}
	this.particle_count = newCount;
	//this.waitForUpdateFlag = false;
	requestAnimationFrame(this.update.bind(this));
	console.log(this.particle_count);
}
//Particle System Class end
//Lamp Class start
function Lamp(lampType = 1, color, intensity = 10){
	this.light_source;
	this.helper;
	var mesh_trans_material = new THREE.MeshBasicMaterial( {visible:false/*transparent:true, opacity:0*/} );
	THREE.Mesh.call( this, new THREE.BoxGeometry( 1, 1, 1), mesh_trans_material );
	switch(lampType){
		case 1: this.light_source = new THREE.PointLight( this.color, this.intensity ,100);
				this.helper = new THREE.PointLightHelper(this.light_source,1);
				break;
		case 2: this.light_source = new THREE.DirectionalLight( this.color, this.intensity);
				this.helper = new THREE.DirectionalLightHelper(this.light_source);
				break;
		case 3: this.light_source = new THREE.SpotLight( this.color, this.intensity ,100);
				this.helper = new THREE.SpotLightHelper(this.light_source);
				break;
		case 4: this.light_source = new THREE.AmbientLight( this.color, this.intensity ,100);
				this.helper = new THREE.PointLightHelper(this.light_source);
				break;
	}
	//requestAnimationFrame(this.update.bind(this));
	scene.add(this.light_source);
	scene.add(this.helper);
	this.update();
}
Lamp.prototype = Object.create(THREE.Mesh.prototype);
Lamp.prototype.constructor = Lamp;
Lamp.prototype.update = function(){
	this.light_source.position.set(this.position.x, this.position.y, this.position.z);
	this.helper.update();
	requestAnimationFrame(this.update.bind(this));
}
//Lamp Class end