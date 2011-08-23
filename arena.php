<?php 
	// Vehicle Count
	$VEH_COUNT = 8;
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<HTML>
<HEAD>
	<META http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
	<TITLE>Picture Uploader</TITLE>
	<link rel="shortcut icon" href="favicon.ico" />
	<link type="text/css" rel="stylesheet" href="picman.css" />
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
				for($i=0; $i < $VEH_COUNT; $i++) {
					if($i%4 == 0) {
						echo '<div class="clear"></div>';
					}
					echo getPicTemplate($i);
				}
			?>	
		</div>		
	</div>	
	<div id="videoDemo" class="clear videodemo">
		<a target="_blank" href="http://www.youtube.com/watch?v=68rNuzYnxOI">Quick Demo</a>
	</div>
	<script src="utils.js"></script>
	<script src="progressmeter.js"></script>
	<script src="picuploader.js"></script>
	<script src="picmanager.js"></script>
	<script>
		var PicManConfig = {
			MAX_LIMIT: <?php echo $VEH_COUNT; ?>,
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
	<!-- <script src="http://webplayer.yahooapis.com/player-beta.js"></script> --> 
</BODY>
</HTML>
<?php 			
	function getPicTemplate($index) {
		$html = array();
		$html[] = '<div id="picContainer'.$index.'" class="piccontainer">';
		$html[] = '<div id="overlay'.$index.'" class="overlay">';
		$html[] = '<div class="bigimage">';
		$html[] = '<div class="close"><a href="#" id="closeZoomLink'.$index.'">Close</a></div>';
		$html[] = '<div id="enlarge'.$index.'"></div>';
		$html[] = '</div>';
		$html[] = '</div>';
		$html[] = '<div id="picTop'.$index.'">';
		$html[] = '<div id="controls'.$index.'" class="controls">';
		$html[] = '<div id="zoom'.$index.'" class="icon-hover" onmousedown="this.style.background = \'#DDE1EB\';" onmouseup="this.style.background = \'\';">';
		$html[] = '<div class="icons zoom" title="Zoom"></div>';
		$html[] = '</div>';
		$html[] = '<div id="primary'.$index.'" class="icon-hover" onmousedown="this.style.background = \'#DDE1EB\';" onmouseup="this.style.background = \'\';">';
		$html[] = '<div class="primcontol" title="Make Primary">P</div>';
		$html[] = '</div>';
		$html[] = '<div id="delete'.$index.'" class="icon-hover" onmousedown="this.style.background = \'#DDE1EB\';" onmouseup="this.style.background = \'\';">';		
		$html[] = '<div class="icons delete" title="Delete"></div>';
		$html[] = '</div>';		
		$html[] = '</div>';
		$html[] = '<div class="clear"></div>';
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
		$html[] = '</div>';
		$html[] = '</div>';
				
		return implode("\n", $html);
	}
?>