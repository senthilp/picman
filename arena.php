<?php 
	// Picture Count
	$PIC_COUNT = 8;
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
					<input type="file" name="picfile" id="picfile" accept="image/*" class="browse" />
				</div>				
			</form>				
		</div>
		<div id="dropBox" class="dropbox">
			<?php 
				for($i=0; $i < $PIC_COUNT; $i++) {
					if($i%4 == 0) {
						echo '<div class="clear"></div>';
					}
					echo getPicTemplate($i);
				}
			?>	
		</div>		
	</div>	
	<script src="utils.js"></script>
	<script src="progressmeter.js"></script>
	<script src="picuploader.js"></script>
	<script src="picmanager.js"></script>
	<script>
		var PicManConfig = {
			MAX_LIMIT: <?php echo $PIC_COUNT; ?>, // Total number of pic placeholders 
			uploadForm: "file_upload_form", // Form element ID which contains the HTML file element
			file: "picfile", // HTML file element ID
			maskLayer: "mask", // The mask div element ID which creates a background mask during zoom and when upload is progressing 
			addPicLayer: "add", // The div element id which contains the Add Picture link and HTML file element 
			serverURL: "upload.php", // The AJAX server URL
			errorImage: "no-pic-error.png", // Error image URL displayed when an error occurs during upload
			dropBox: "dropBox", // The Div element ID of the drop box for drag & drop
			dropText: "dropText", // The Div element ID wrapping the text mentioning the feature supports drag & drop
			imageHash: null, // An array of image info objects, default null but when already uploaded images the object is set
				 			 // Format: [{thumbnailUrl: "http://xyz", mainUrl: "http://abc"}]
			primaryIndex: 0, // The index of the image which should be made primary, default 0
			startIndex: 0, // The start index in the arena, default 0 but when already uploaded images the index is set accordingly
			// Below attributes are associated with every image and all IDs are indexed from 0
			// For e.g. the pic container div ID at first location will be picContainer0 and so on
			image: { 
				picContainer: "picContainer", // The container Div element ID of a picture
				fileNameLayer: "fileName", // The Div element ID in the pic container which holds the file name
				progressMeterLayer: "progressMeter", // The Div element ID which holds the progress meter elements				
				progressLayer: "progress", // The inner Div element ID of the progress meter which shows progress
				percentLayer: "percentage", // The Div element ID showing the progress percentage
				imageWrapper: "imageWrapper", // The Div element ID wrapping the thumbnail image
				controlsLayer: "controls", // The Div element ID which contains the dashboard controls
				overlayLayer: "overlay",// The Div element ID of the overlay for zooming an image
				zoomLayer: "enlarge", // The Div element ID wrapping the zoom image				
				closeZoomLink: "closeZoomLink", // The anchor ID for the close link in overlay
				zoomControl: "zoom", // The Div element ID for the zoom control
				primaryControl: "primary", // The Div element ID for the make primary image control
				deleteControl: "delete" // The Div element ID for the delete image control
			}		
		};		
		// Initialize PicMan
		PicManager.init(PicManConfig);	
	</script>		 
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