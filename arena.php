<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<HTML>
<HEAD>
	<META http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
	<TITLE>Picture Uploader</TITLE>
	<style type="text/css">
			body {
				margin: 0 auto;
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
			#picContainer {				
				font-family: Arial,Helvetica,sans-serif;
				font-weight: bold;
				font-size: 12px;
				width: 200px;
				margin: 0 auto;
			}
			#picContainer a {				
				text-decoration: none; 
			}
			.picholder {
				height: 131px;
				position: relative;
			}
			#add {
				text-align: center;	
				margin: 24px 0;						
			}
			#add span.extra {
				font-size: 16px;
			}
			div.browse {
				overflow: hidden; 
				width: 155px; 
				height: 20px; 
				position: absolute; 
				left: 0; 
				top: 53px;
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
			#fileName {
				text-align: center;
				color: gray;
				font-size: 12px;
				padding: 7px 0;
				visibility: hidden;
			}
			#error {
				color: red;
				visibility: hidden;
				height: 12px;
			}
			#picTop {
			}
			#picBottom {
				text-align: center;
				margin: 5px 0;				
			}
			#controls {
				margin: 0 auto 1px;
				text-align: center;
				visibility: hidden;
			}
			#controls div {
				display: inline-block;				
			}
			#controls div.icon-hover {
				border: 1px solid white;
				padding: 2px 0;
			}
			#controls div.icon-hover:hover {
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
			#progressMeter {
				padding-top: 16px;
				color: gray;
				visibility: hidden;
			}				
			#progressMeter div{
				display: inline-block;
			}
			#progressMeter #progress {
				width: 0%;
				height: 8px;
				background-color: gray; 
			}
			#progressMeter #meter {				
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
		<div id="overlay" class="overlay">
			<div class="bigimage">
				<div class="close"><a href="#" onclick="PicManager.closeOverlay(0);return false;">Close</a></div>
				<div id="enlarge"></div>
			</div>
		</div>
		<div id="picContainer" onmouseover="PicManager.showControls(0);" onmouseout="PicManager.hideControls(0);">
			<form id="file_upload_form" method="post" enctype="multipart/form-data" action="upload.php" target="upload_target">
				<div id="picTop">
					<div id="error"></div>
					<div id="controls">
						<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';" onclick="PicManager.zoomImage(0);">
							<div class="icons zoom" title="Zoom"></div>
						</div>
						<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';" onclick="PicManager.rotateLeft();">
							<div class="icons rleft" title="Rotate left"></div>
						</div>
						<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';">
							<div class="icons rright" title="Rotate right"></div>
						</div>
						<div class="icon-hover" onmousedown="this.style.background = '#DDE1EB';" onmouseup="this.style.background = '';" onclick="PicManager.deleteImage(0);">
							<div class="icons delete" title="Delete"></div>
						</div>
					</div>
				</div>
				<div class="picholder border">
					<div id="imageWrapper"></div>
					<div id="fileName">Image Name</div>
					<div id="add">
						<a href="#"><span><span class="extra">+</span> Add a Picture</span></a>
						<div class="browse">
							<input type="file" name="file" id="file" class="browse" onchange="PicManager.upload(0);"/>
						</div>				
					</div>
					<div id="progressMeter">
						<div id="meter">
							<div id="progress"></div>
						</div>
						<div id="percentage">0%</div> 
					</div>
				</div>
				<div id="picBottom">
					2007 Acura TSX
				</div>
				<iframe id="upload_target" name="upload_target" src="" style="width:0;height:0;border:0px solid #fff;"></iframe>
			</form>
		</div>
	</div>
	<script src="pic.js"></script>
</BODY>
</HTML>