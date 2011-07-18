<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<HTML>
<HEAD>
	<META http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
	<TITLE>Picture Uploader</TITLE>
	<style type="text/css">
			body {
				margin: 0 auto;
				width: 960px;
			}
			h1 {
				margin: 40px 0 55px;
				color: gray;
				text-align: center;
			}
			.border {
				background-color: #F1F1F1;
				border: 1px solid gainsboro;
			}
			.piccontainer {				
				width: 200px;
				margin: 10px;
				float: left;				
			}
			.picman {
				font-family: Arial,Helvetica,sans-serif;
				font-size: 12px;
				font-weight: bold;
			}
			.picman a {				
				text-decoration: none; 
			}
			.picholder {
				height: 131px;
				position: relative;
			}
			.add {
				margin-top: 20px;
				text-align: center;			
				position: relative;			
			}
			.add span.extra {
				font-size: 16px;
			}
			div.browse {
				overflow: hidden; 
				width: 155px; 
				height: 20px; 
				position: absolute; 
				left: 375px; 
				top: 0;
			}
			.browse {
				opacity: 0;
				filter:alpha(opacity=0); 
				font-size: 20px; 
				height: 20px; 
				position: absolute; 
				right: 0px; 
				top: 0px;
			}
			.filename {
				text-align: center;
				color: gray;
				font-size: 12px;
				padding: 7px 0;
				visibility: hidden;
			}
			.error {
				color: red;
				visibility: hidden;
				height: 12px;
			}
			.picbottom {
				text-align: center;
				margin: 5px 0;				
			}
			.controls {
				margin: 0 auto 1px;
				text-align: center;
				visibility: hidden;
			}
			.controls div {
				display: inline-block;				
			}
			.controls div.icon-hover {
				border: 1px solid white;
				padding: 2px 0;
			}
			.controls div.icon-hover:hover {
				border-color: #A1BADF;
			}						
			.icons {
				background-image: url("image_edit_icons-v2.gif");
				height: 16px;
				width: 16px;
				margin: 0 2px;
			}
			.rleft {
				background-position: -16px 0;
			}
			.rright {
				background-position: -32px 0;
			}	
			.delete {
				background-position: -64px 0;
			}
			.progressmeter {
				padding-top: 70px;
				color: gray;
				visibility: hidden;
			}				
			.progressmeter div{
				display: inline-block;
			}
			.progressmeter .progress {
				width: 0%;
				height: 8px;
				background-color: gray; 
			}
			.progressmeter .meter {				
				height: 7px;
				width: 148px;
				border: 1px solid gray;
				margin: 0 1px 0 10px;
			}	
			.overlay {
				position: absolute;
				display: none;
				z-index: 2;
				left: 25%;
				top: 25%;
			}						
			.bigimage {
				border: 20px solid black;
				position: relative;
			}
			.close {
				position: absolute;
				left: 97%;
				top: -3%;
			}
			.close a {
				color: wheat;
				text-decoration: none;
				font-size: 16px;
			}
			.mask {
				opacity: 0;
				filter:alpha(opacity=0);
				left: 0;
				top: 0;
				width: 100%;
				height: 100%;
				z-index: 1;
				position: absolute;
				display: none;			
			}
	</style>	
</HEAD>
<BODY>
	<h1>Picture Uploader</h1>
	<div id="mask" class="mask"></div>
	<div class="picman">
		<div id="add" class="add">
			<form id="file_upload_form" method="post" enctype="multipart/form-data" action="upload.php">
				<a href="#"><span><span class="extra">+</span> Add Pictures</span></a>
				<div class="browse">
					<input type="file" name="picfile" id="picfile" class="browse" multiple="multiple"/>
				</div>
			</form>				
		</div>		
		<div id="picContainer0" class="piccontainer">
			<div id="overlay0" class="overlay">
				<div class="bigimage">
					<div class="close"><a href="#" id="closeZoomLink0">Close</a></div>
					<div id="enlarge0"></div>
				</div>
			</div>		
			<div id="picTop0">
				<div id="error0" class="error"></div>
				<div id="controls0" class="controls">
					<div id="zoom0" class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons zoom" title="Zoom"></div>
					</div>
					<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons rleft" title="Rotate left"></div>
					</div>
					<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons rright" title="Rotate right"></div>
					</div>
					<div id="delete0" class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons delete" title="Delete"></div>
					</div>
				</div>
			</div>
			<div class="picholder border">
				<div id="imageWrapper0"></div>
				<div id="fileName0" class="filename">Image Name</div>					
				<div id="progressMeter0" class="progressmeter">
					<div id="meter0" class="meter">
						<div id="progress0" class="progress"></div>
					</div>
					<div id="percentage0" class="percentage">0%</div> 
				</div>
			</div>
			<div id="picBottom0" class="picbottom">
				2007 Acura TSX
			</div>
		</div>
		<div id="picContainer1" class="piccontainer">
			<div id="overlay1" class="overlay">
				<div class="bigimage">
					<div class="close"><a href="#" id="closeZoomLink1">Close</a></div>
					<div id="enlarge1"></div>
				</div>
			</div>		
			<div id="picTop1">
				<div id="error1" class="error"></div>
				<div id="controls1" class="controls">
					<div id="zoom1" class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons zoom" title="Zoom"></div>
					</div>
					<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons rleft" title="Rotate left"></div>
					</div>
					<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons rright" title="Rotate right"></div>
					</div>
					<div id="delete1" class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
						<div class="icons delete" title="Delete"></div>
					</div>
				</div>
			</div>
			<div class="picholder border">
				<div id="imageWrapper1"></div>
				<div id="fileName1" class="filename">Image Name</div>					
				<div id="progressMeter1" class="progressmeter">
					<div id="meter1" class="meter">
						<div id="progress1" class="progress"></div>
					</div>
					<div id="percentage1" class="percentage">0%</div> 
				</div>
			</div>
			<div id="picBottom1" class="picbottom">
				2004 Acura MSX
			</div>
		</div>		
	</div>	
	<script src="progressmeter.js"></script>
	<script src="picuploader.js"></script>
	<script src="picmanager.js"></script>
	<script>
		var PicManConfig = {
			MAX_LIMIT: 2,
			uploadForm: "file_upload_form", 
			file: "picfile", 
			maskLayer: "mask",
			addPicLayer: "add",
			serverURL: "upload.php",
			image: { 
				fileNameLayer: "fileName", 
				progressMeterLayer: "progressMeter",
				progressLayer: "progress",
				percentLayer: "percentage", 
				errorLayer: "error",
				imageWrapper: "imageWrapper",
				controlsLayer: "controls",
				overlayLayer: "overlay",
				zoomLayer: "enlarge",
				picContainer: "picContainer",
				closeZoomLink: "closeZoomLink",
				zoomControl: "zoom", 
				deleteControl: "delete"
			}		
		};		
		// Initialize PicMan
		PicManager.init(PicManConfig);	
	</script>		
</BODY>
</HTML>