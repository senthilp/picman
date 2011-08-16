<?php 
	// Vehicle List
	$VEH_LIST = array("", 
					"", 
					"",
					"",
					"",
					"",
					"",
					""
					);
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<HTML>
<HEAD>
	<META http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
	<TITLE>Picture Uploader</TITLE>
	<style type="text/css">
			body {
				font-family: Arial,Helvetica,sans-serif;
				font-size: 12px;			
				margin: 0 auto;
				width: 960px;
			}
			h1 {
				margin: 10px 0;
				color: gray;
				text-align: center;
			}
			.border {
				background-color: #F1F1F1;
				border: 1px solid gainsboro;
			}
			.piccontainer {				
				width: 200px;
				margin-right: 10px;
				float: left;				
			}
			.primary {
				border: 3px solid brown;
			}
			.picman {
				font-weight: bold;
			}
			.dropbox {			
    			border-radius: 2px 2px 2px 2px;
    			height: 360px;
    			margin-top: 20px;    			
    			padding: 20px 0 0 60px;
			}
			.droptext {
				display: none;
				color: #CCCCCC
			}
			.activate {
				border: 4px dashed #DDDDDD;
			}
			.dragenter {
				border-color: #3964C2;
			}
			.picman a {				
				text-decoration: none; 
			}
			.picholder {
				height: 131px;
				position: relative;
			}
			.add {
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
				font-size: 40px; 
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
				display: none;
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
			.primcontol {				
				font-family: cursive,Helvetica,sans-serif;
				font-size: 14px;
				height: 16px;
				width: 16px;					
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
			.clear {
				clear: both;
			}
			.videodemo {
				margin-top: 20px;
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
				<div id="dropText" class="droptext">
					Or
					<br/>
					Drag photos into the drop box
				</div>
				<div class="browse">
					<input type="file" name="picfile" id="picfile" class="browse" />
				</div>				
			</form>				
		</div>
		<div id="dropBox" class="dropbox">
			<?php 
				for($i=0, $l=count($VEH_LIST); $i < $l; $i++) {
					if($i%4 == 0) {
						echo '<div class="clear"></div>';
					}
					echo getPicTemplate($i, $VEH_LIST[$i]);
				}
			?>	
		</div>		
	</div>	
	<div id="videoDemo" class="clear videodemo">
		<a target="_blank" href="http://www.youtube.com/watch?v=68rNuzYnxOI">Quick Demo</a>
	</div>
	<script src="progressmeter.js"></script>
	<script src="picuploader.js"></script>
	<script src="picmanager.js"></script>
	<script>
		var PicManConfig = {
			MAX_LIMIT: <?php echo count($VEH_LIST); ?>,
			uploadForm: "file_upload_form", 
			file: "picfile", 
			maskLayer: "mask",
			addPicLayer: "add",
			serverURL: "upload.php",
			errorImage: "no-pic-error.png",
			dropBox: "dropBox",
			dropText: "dropText",
			primaryIndex: 0,
			startIndex: 0,
			imageHash: null,
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
				primaryControl: "primary",
				deleteControl: "delete"
			}		
		};		
		// Initialize PicMan
		PicManager.init(PicManConfig);	
	</script>		
	<script src="http://webplayer.yahooapis.com/player-beta.js"></script> 
</BODY>
</HTML>
<?php 			
	function getPicTemplate($index, $vehicle) {
		$html = array();
		$html[] = '<div id="picContainer'.$index.'" class="piccontainer">';
		$html[] = '<div id="overlay'.$index.'" class="overlay">';
		$html[] = '<div class="bigimage">';
		$html[] = '<div class="close"><a href="#" id="closeZoomLink'.$index.'">Close</a></div>';
		$html[] = '<div id="enlarge'.$index.'"></div>';
		$html[] = '</div>';
		$html[] = '</div>';
		$html[] = '<div id="picTop'.$index.'">';
		$html[] = '<div id="error'.$index.'" class="error"></div>';
		$html[] = '<div id="controls'.$index.'" class="controls">';
		$html[] = '<div id="zoom'.$index.'" class="icon-hover" onmousedown="this.style.background = \'#DDE1EB\';" onmouseup="this.style.background = \'\';">';
		$html[] = '<div class="icons zoom" title="Zoom"></div>';
		$html[] = '</div>';
		$html[] = '<div class="icon-hover" onmousedown="this.style.background = \'#DDE1EB\';" onmouseup="this.style.background = \'\';">';
		$html[] = '<div id="primary'.$index.'" class="primcontol" title="Make Primary">P</div>';
		$html[] = '</div>';
		$html[] = '<div id="delete'.$index.'" class="icon-hover" onmousedown="this.style.background = \'#DDE1EB\';" onmouseup="this.style.background = \'\';">';		
		$html[] = '<div class="icons delete" title="Delete"></div>';
		$html[] = '</div>';		
		$html[] = '</div>';
		$html[] = '</div>';
		$html[] = '<div class="picholder border">';
		$html[] = '<div id="imageWrapper'.$index.'"></div>';
		$html[] = '<div id="fileName'.$index.'" class="filename">Image Name</div>';
		$html[] = '<div id="progressMeter'.$index.'" class="progressmeter">';
		$html[] = '<div id="meter'.$index.'" class="meter">';
		$html[] = '<div id="progress'.$index.'" class="progress"></div>';
		$html[] = '</div>';
		$html[] = '<div id="percentage'.$index.'" class="percentage">0%</div>';
		$html[] = '</div>';
		$html[] = '</div>';
		$html[] = '<div id="picBottom'.$index.'" class="picbottom">';
		$html[] = $vehicle;
		$html[] = '</div>';
		$html[] = '</div>';
				
		return implode("\n", $html);
	}
?>