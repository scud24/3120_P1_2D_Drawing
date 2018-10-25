/**
 * @author Jialei Li, K.R. Subrmanian, Zachary Wartell
 * 
 * 
 */


/*****
 * 
 * GLOBALS
 * 
 *****/

// 'draw_mode' are names of the different user interaction modes.
// \todo Student Note: others are probably needed...
var draw_mode = {DrawLines: 0, DrawTriangles: 1, DrawQuads: 2, ClearScreen: 3, None: 4};

// 'curr_draw_mode' tracks the active user interaction mode
var curr_draw_mode = draw_mode.DrawLines;

// GL array buffers for points, lines, and triangles
var vBuffer_Pnt, vBuffer_Line, vBuffer_Triangle, vBuffer_Quad, vBuffer_Select;

// Array's storing 2D vertex coordinates of points, lines, triangles, etc.
// Each array element is an array of size 2 storing the x,y coordinate.
var points = [], line_verts = [], tri_verts = [], quad_verts = [], selection_points =[];
var line_colors = [], tri_colors=[], quad_colors=[];
var current_color= [0.0,1.0,0.0,1.0];
// count number of points clicked for new line
var num_pts_line = 0;

//count points clicked for triangles
var num_pts_tri = 0;
//count points clicked for quads
var num_pts_quad = 0;

var selected_objects =[];
var current_selection_index = 0;

var gl_last, a_Position_last, u_FragColor_last, canvas_last;

/*****
 * 
 * MAIN
 * 
 *****/
function main() {
    
    //math2d_test();
    
    /**
     **      Initialize WebGL Components
     **/
    
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShadersFromID(gl, "vertex-shader", "fragment-shader")) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // create GL buffer objects
    vBuffer_Pnt = gl.createBuffer();
    if (!vBuffer_Pnt) {
        console.log('Failed to create the buffer object');
        return -1;
    }
	vBuffer_Select = gl.createBuffer();
    if (!vBuffer_Select) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    vBuffer_Line = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    var skeleton=true;
    if(skeleton)
    {
        document.getElementById("App_Title").innerHTML += "-Skeleton";
    }

    //create buffers for triangles and quads...
	vBuffer_Triangle = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }
	vBuffer_Quad = gl.createBuffer();
    if (!vBuffer_Line) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // get GL shader variable locations
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return -1;
    }

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    /**
     **      Set Event Handlers
     **
     **  Student Note: the WebGL book uses an older syntax. The newer syntax, explicitly calling addEventListener, is preferred.
     **  See https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
     **/
    // set event handlers buttons
    document.getElementById("LineButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawLines;
            });

    document.getElementById("TriangleButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawTriangles;
            });   


    document.getElementById("QuadButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.DrawQuads;
            });   			
    
    document.getElementById("ClearScreenButton").addEventListener(
            "click",
            function () {
                curr_draw_mode = draw_mode.ClearScreen;
                // clear the vertex arrays
                while (points.length > 0)
                    points.pop();
                while (line_verts.length > 0)
                    line_verts.pop();
                while (tri_verts.length > 0)
                    tri_verts.pop();
				while (quad_verts.length > 0)
                    quad_verts.pop();

                gl.clear(gl.COLOR_BUFFER_BIT);
                
                curr_draw_mode = draw_mode.DrawLines;
            });
            
    //\todo add event handlers for other buttons as required....     
	document.getElementById("DeleteButton").addEventListener(
            "click",
            function () {
                if((selected_objects.length != 0) && (current_selection_index<selected_objects.length))
				{
					if(selected_objects[current_selection_index][0] == "line")
					{
						line_verts.splice(selected_objects[current_selection_index][0]*2,2);
						line_colors.splice(selected_objects[current_selection_index][0],1);
					}
					else if(selected_objects[current_selection_index][0] == "triangle")
					{
						console.log("Pre-splice: " + tri_verts);
						tri_verts.splice(selected_objects[current_selection_index][0]*3,3);
						tri_colors.splice(selected_objects[current_selection_index][0],1);
						console.log("Post-splice: " + tri_verts);
					}
					else if(selected_objects[current_selection_index][0] == "quad")
					{
						quad_verts.splice(selected_objects[current_selection_index][0]*4,4);
						quad_colors.splice(selected_objects[current_selection_index][0],1);
					}
					else 
					{
						console.log("Error - selected object type: " + selected_objects[current_selection_index][0]);
					}
				}
				selected_objects = [];
				current_selection_index = 0;
				selection_points = [];
				drawObjects(gl,a_Position, u_FragColor);
            });			

    // set event handlers for color sliders
    /* \todo right now these just output to the console, code needs to be modified... */
    document.getElementById("RedRange").addEventListener(
            "input",
            function () {
                console.log("RedRange:" + document.getElementById("RedRange").value);
				current_color[0] = document.getElementById("RedRange").value/100.0;
				updateSelectedObjectColor();				
            });
    document.getElementById("GreenRange").addEventListener(
            "input",
            function () {
                console.log("GreenRange:" + document.getElementById("GreenRange").value);
				current_color[1] = document.getElementById("GreenRange").value/100.0;
				updateSelectedObjectColor();		
            });
    document.getElementById("BlueRange").addEventListener(
            "input",
            function () {
                console.log("BlueRange:" + document.getElementById("BlueRange").value);
				current_color[2] =document.getElementById("BlueRange").value/100.0;
				updateSelectedObjectColor();		
            });                        
            
    // init sliders 
    // \todo this code needs to be modified ...
    document.getElementById("RedRange").value = 0;
    document.getElementById("GreenRange").value = 100;
    document.getElementById("BlueRange").value = 0;
            
    // Register function (event handler) to be called on a mouse press
    canvas.addEventListener(
            "mousedown",
            function (ev) {
                handleMouseDown(ev, gl, canvas, a_Position, u_FragColor);
                });
}

/*****
 * 
 * FUNCTIONS
 * 
 *****/

 /*
 * sets current selected object's color to current_color
 */
 function updateSelectedObjectColor(){
	 if((selected_objects.length != 0) && (current_selection_index<selected_objects.length))
				{
					if(selected_objects[current_selection_index][0] == "line")
					{
						line_colors[selected_objects[current_selection_index][2]] = [current_color[0],current_color[1], current_color[2],1]
					}
					else if(selected_objects[current_selection_index][0] == "triangle")
					{
						tri_colors[selected_objects[current_selection_index][2]] = [current_color[0],current_color[1], current_color[2],1]
					}
					else if(selected_objects[current_selection_index][0] == "quad")
					{
						quad_colors[selected_objects[current_selection_index][2]]= [current_color[0],current_color[1], current_color[2],1]
					}
				}	 
		if(gl_last){
			drawObjects(gl_last,a_Position_last, u_FragColor_last);
		}
 }
 
/*
 * Handle mouse button press event.
 * 
 * @param {MouseEvent} ev - event that triggered event handler
 * @param {Object} gl - gl context
 * @param {HTMLCanvasElement} canvas - canvas 
 * @param {Number} a_Position - GLSL (attribute) vertex location
 * @param {Number} u_FragColor - GLSL (uniform) color
 * @returns {undefined}
 */
function handleMouseDown(ev, gl, canvas, a_Position, u_FragColor) {
    gl_last = gl;
	canvas_last = canvas;
	a_Position_last = a_Position;
	u_FragColor_last = u_FragColor;
	var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
    
    // Student Note: 'ev' is a MouseEvent (see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent)
    
	// convert from canvas mouse coordinates to GL normalized device coordinates
	x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
	y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
		
	if(ev.shiftKey){
		var new_selection = [];
		if(line_verts.length>1){	
			for(i = 0; i < line_verts.length/2; i++){				
			var p0 = new Vec2(line_verts[i*2]);
			var p1 = new Vec2(line_verts[i*2+1]);
			var p = new Vec2([x,y]);
		
			var dist = pointLineDist(p0,p1, p)
			//console.log ("Point line distance: " + dist);
			if (dist < 0.02)
			{
				var new_object = ["line",[p0,p1],i];
				new_selection.push(new_object);
				console.log("Added " + new_object[0] + " to selected_objects");
			}
			}
		}
		if(tri_verts.length>2){		
			for(i = 0; i < tri_verts.length/3; i++){				
			var tri_p0 = new Vec2(tri_verts[i*3]);
			var tri_p1 = new Vec2(tri_verts[i*3+1]);
			var tri_p2 = new Vec2(tri_verts[i*3+2]);
			var tri_p = new Vec2([x,y]);
		
			var bary = barycentric(tri_p0,tri_p1, tri_p2, tri_p);
			console.log ("Baryentric coords: " + bary);
			if( bary[0] > 0 && bary[1] > 0 && bary[2]>0)
			{
				var new_object = ["triangle",[tri_p0,tri_p1,tri_p2],i];
				new_selection.push(new_object);
				console.log("Added " + new_object[0] + " to selected_objects");
			}
			}
		}
		
		if(quad_verts.length>3){		
			for(i = 0; i < quad_verts.length/4; i++){				
			var quad_p0 = new Vec2(quad_verts[i*4]);
			var quad_p1 = new Vec2(quad_verts[i*4+1]);
			var quad_p2 = new Vec2(quad_verts[i*4+2]);
			var quad_p3 = new Vec2(quad_verts[i*4+3]);
			var quad_p = new Vec2([x,y]);
		
			var quad_bary1 = barycentric(quad_p0,quad_p1, quad_p2, quad_p);
			var quad_bary2 = barycentric(quad_p0,quad_p2, quad_p3, quad_p);
			//console.log ("Quad bary 1 coords: " + quad_bary1);
			//console.log ("Quad bary 2 coords: " + quad_bary2);
			if(( quad_bary1[0] > 0 && quad_bary1[1] > 0 && quad_bary1[2]>0)||( quad_bary2[0] > 0 && quad_bary2[1] > 0 && quad_bary2[2]>0))
			{
				var new_object = ["quad",[quad_p0,quad_p1,quad_p2,quad_p3],i];
				new_selection.push(new_object);
				console.log("Added " + new_object[0] + " to selected_objects");
			}
			
			}
		}
		//todo: compare last selection to new selection
		
			//selected_objects = new_selection;
			console.log("Start");
			console.log(new_selection);
			console.log(selected_objects);
		
		if(new_selection.length == selected_objects.length && new_selection.length != 0)
		{

			var difference_found = false;
			for(i = 0; i < new_selection.length; i++)
			{
				console.log("loop1");
				if(new_selection[i][0] != selected_objects[i][0]){
					console.log("Difference found at " + i);
					console.log("NS: " + new_selection[i][0] + " SO: " + selected_objects[i][0]);
					difference_found = true;
				}
				else{
					if(new_selection[i][1].length != selected_objects[i][1].length){						
					console.log("Difference found at " + i);
					console.log("NS: " + new_selection[i][1] + " SO: " + selected_objects[i][1]);
					difference_found = true;
					}
					else{
								console.log("loop2: " + new_selection[i][1])
						for(j = 0; j < new_selection[i][1].length; j++)
						{
								console.log("loop3: " +new_selection[i][1][j])								
								console.log(new_selection[i][1][j])
							for(k = 0; k < new_selection[i][1][j].array.length; k++)
							{
								console.log("loop4: " +new_selection[i][1][j].array[k])
							if(new_selection[i][1][j].array[k] != selected_objects[i][1][j].array[k]){						
								console.log("Difference found at " + i);
								console.log("NS: " + new_selection[i][1][j].array + " SO: " + selected_objects[i][1][j].array);
								difference_found = true;
							}
							else{
								console.log("Same?");
								console.log(selected_objects[i][1][j][k])
								console.log(new_selection[i][1][j][k])
							}
							}
						}
					}
				}
			}
			if((!difference_found) &&(new_selection.length!= 0))
			{
			console.log("selections match");
			current_selection_index++;
			
			console.log("Current index" + current_selection_index + " length: " + selected_objects.length);
				if(current_selection_index >= selected_objects.length)
				{
					current_selection_index = 0;
				}
			console.log("Current index" + current_selection_index + " length: " + selected_objects.length);
				
			}
			else{
			selected_objects = [];
			for(i = 0; i < new_selection.length; i++)
			{
					selected_objects[i]=new_selection[i]
			}
			current_selection_index = 0;
			}
		}
		else{
			selected_objects = [];
			for(i = 0; i < new_selection.length; i++)
			{
				if(new_selection[i] != selected_objects[i]){
					selected_objects[i]=new_selection[i]
				}
			}
			current_selection_index = 0;
		}
		if(selected_objects.length != 0){
			var selected_object = selected_objects[current_selection_index];
			selection_points = [];
			for(i=0; i < selected_object[1].length;i++){			
			selection_points.push([selected_object[1][i].array[0],selected_object[1][i].array[1]]);
			//console.log("pushing point: " + selected_object[1][i].array);
			}
			console.log("selected_object: " +selected_object[0] + ": " + selected_object[1][1].array + " points: " + selection_points.length);
		}
		else{
			selection_points = [];
		}
	}
	else{
		//-----------------------------ADD Points/Shapes------------------
		if (curr_draw_mode !== draw_mode.None) {
			// add clicked point to 'points'
			points.push([x, y]);
		}

		// perform active drawing operation
		switch (curr_draw_mode) {
			case draw_mode.DrawLines:
				// in line drawing mode, so draw lines
				if (num_pts_line < 1) {			
					// gathering points of new line segment, so collect points
					line_verts.push([x, y]);
					num_pts_line++;
				}
				else {						
					// got final point of new line, so update the primitive arrays
					line_verts.push([x, y]);
					line_colors.push([current_color[0],current_color[1], current_color[2],1]);
					num_pts_line = 0;
					points.length = 0;
				}
				break;
			case draw_mode.DrawTriangles:
				// in tri drawing mode, so draw tris
				if (num_pts_tri < 2) {			
					// gathering points of new tri, so collect points
					tri_verts.push([x, y]);
					num_pts_tri++;
				}
				else {						
					// got final point of new tri, so update the primitive arrays
					tri_verts.push([x, y]);
					tri_colors.push([current_color[0],current_color[1], current_color[2],1]);
					num_pts_tri = 0;
					points.length = 0;
				}
				break;
			case draw_mode.DrawQuads:
				// in quad drawing mode, so draw quads
				if (num_pts_quad < 3) {			
					// gathering points of new quad, so collect points
					quad_verts.push([x, y]);
					num_pts_quad++;
				}
				else {						
					// got final point of new quad, so update the primitive arrays
					quad_verts.push([x, y]);
					quad_colors.push([current_color[0],current_color[1], current_color[2],1]);
					num_pts_quad = 0;
					points.length = 0;
				}
				break;
		}
    
    
	}
		drawObjects(gl,a_Position, u_FragColor);
}

/*
 * Draw all objects
 * @param {Object} gl - WebGL context
 * @param {Number} a_Position - position attribute variable
 * @param {Number} u_FragColor - color uniform variable
 * @returns {undefined}
 */
function drawObjects(gl, a_Position, u_FragColor) {

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
	var i=0
    // draw lines
    if (line_verts.length>1) {	
        // enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Line);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(line_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

		
		while(i<Math.floor(line_verts.length/2)){
        gl.uniform4f(u_FragColor, line_colors[i][0], line_colors[i][1], line_colors[i][2],  line_colors[i][3]);
        // draw the lines
        gl.drawArrays(gl.LINES, i*2, 2 );
		i++;
		}
    }
	
	
	console.log("current color: " + current_color);
   //draw triangles
    if (tri_verts.length>2) {	
        // enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Triangle);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(tri_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

		i=0;
		while(i<Math.floor(tri_verts.length/3)){
		console.log("tri colors[" + i +"]: " + tri_colors[i]);
        gl.uniform4f(u_FragColor, tri_colors[i][0], tri_colors[i][1], tri_colors[i][2], tri_colors[i][3]);
        // draw the tris
        gl.drawArrays(gl.TRIANGLES, i*3, 3);
		i++;
		}
    }
   
   //draw quads
    if (quad_verts.length>3) {	
        // enable the line vertex
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Quad);
        // set vertex data into buffer (inefficient)
        gl.bufferData(gl.ARRAY_BUFFER, flatten(quad_verts), gl.STATIC_DRAW);
        // share location with shader
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // draw the quads
		i=0;
		while(i<Math.floor(quad_verts.length/4)){
				
        gl.uniform4f(u_FragColor, quad_colors[i][0], quad_colors[i][1], quad_colors[i][2], quad_colors[i][3]);
        gl.drawArrays(gl.TRIANGLE_FAN, i*4, 4 );
		i++;
		}
    }
    
    // draw primitive creation vertices 
	//console.log("normal points: " + points.length);
    if (points.length !== 0)
    {
		for(i = 0; i < points.length; i++)
		{
			//console.log("Normal point: " + points[i]);
		}
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Pnt);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, 1.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.POINTS, 0, points.length);    
    }
	
	 // draw primitive creation vertices 
	console.log("points: " + selection_points.length);

    if (selection_points.length !== 0)
    {
		for(i = 0; i < selection_points.length; i++)
		{
			//console.log("Selection point: " + selection_points[i]);
		}
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer_Select);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(selection_points), gl.STATIC_DRAW);
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        gl.uniform4f(u_FragColor, 0.0, 1.0, 1.0, 1.0);
        gl.drawArrays(gl.POINT, 0, selection_points.length);    
    }
}

/**
 * Converts 1D or 2D array of Number's 'v' into a 1D Float32Array.
 * @param {Number[] | Number[][]} v
 * @returns {Float32Array}
 */
function flatten(v)
{
    var n = v.length;
    var elemsAreArrays = false;

    if (Array.isArray(v[0])) {
        elemsAreArrays = true;
        n *= v[0].length;
    }

    var floats = new Float32Array(n);

    if (elemsAreArrays) {
        var idx = 0;
        for (var i = 0; i < v.length; ++i) {
            for (var j = 0; j < v[i].length; ++j) {
                floats[idx++] = v[i][j];
            }
        }
    }
    else {
        for (var i = 0; i < v.length; ++i) {
            floats[i] = v[i];
        }
    }

    return floats;
}


