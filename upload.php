<?php
$response = array(); // response object

/**
* Handle file uploads via XMLHttpRequest
*/
class UploadedFileXhr {
	
	private $size = 0;
	private $error = 0;
	
	function __construct() {
        if (isset($_SERVER["CONTENT_LENGTH"])){
            $this->size = (int)$_SERVER["CONTENT_LENGTH"];
        } else {
        	$this->error = UPLOAD_ERR_INI_SIZE;
        }
        // If size exceeds limit
        if($this->size > 12582912) {
        	$this->error = UPLOAD_ERR_INI_SIZE;
        }		
	}
	
	function getBinary() {
        $input = fopen("php://input", "r");
        $temp = tmpfile();
        $realSize = stream_copy_to_stream($input, $temp);
        fclose($input);
        
        fseek($temp, 0, SEEK_SET);
		$multiPartImageData = fread($temp, $realSize);
        
        return $multiPartImageData;
    }
    
    function getName() {
        return $_GET['picfile'];
    }
    
    function getSize() {
        return $this->size;
    }
    
    function getError() {
    	return $this->error;
    }
    
}

/**
* Handle file uploads via regular form post (uses the $_FILES array)
*/
class UploadedFileForm {

    function getBinary() {
        $input = fopen($_FILES['picfile']['tmp_name'], "r");
		$multiPartImageData = fread($input, $this->getSize());
        fclose($input);
        
        return $multiPartImageData;        
    }

    function getName() {
        return $_FILES['picfile']['name'];
    }
    
    function getSize() {
        return $_FILES['picfile']['size'];
    }
    
    function getError() {
    	$_FILES['picfile']['error'];
    }
}

// Retreiving the file based on upload type (AJAX or Iframe)
$fileObj = 0;
if(isset($_GET['picfile'])) {
	$fileObj = new UploadedFileXhr();	
} elseif(isset($_FILES['picfile'])) {
	$fileObj = new UploadedFileForm();
}

if ($fileObj) {  // file was send from browser
	if (!$fileObj->getError() || $fileObj->getError() == UPLOAD_ERR_OK) {  // no error
		
		require_once 'eBayApi.php';    	   

		// File details
		$picNameIn = $fileObj->getName(); // image file to read and upload	    
	    $multiPartImageData = $fileObj->getBinary(); // do a binary read of image
		
        // Credentials for eBay image upload API
        // Register in http://developer.ebay.com/ to get access to eBay public APIs
        // The registration process will generate the following credentials - Developer
        // Id, Application Id, Certificate Id and a eBay user token. Please use those
        // values below
        $devID = '<Your eBay developer Id>';
	    $appID = '<Your eBay App Id>';
	    $certID = '<Your eBay cert Id>';
	    //the token representing the eBay user to assign the call with
	    $userToken = '<Your eBay user token>';
	
	    $siteID  = 0;                            // siteID needed in request - US=0, UK=3, DE=77...
	    $verb    = 'UploadSiteHostedPictures';   // the call being made:
	    $version = 721;                          // eBay API version
	
	    ///Build the request XML request which is first part of multi-part POST
	    $xmlReq = '<?xml version="1.0" encoding="utf-8"?>' . "\n";
	    $xmlReq .= '<' . $verb . 'Request xmlns="urn:ebay:apis:eBLBaseComponents">' . "\n";
	    $xmlReq .= "<Version>$version</Version>\n";                                	            
	    $xmlReq .= "<ErrorLanguage>en_US</ErrorLanguage>\n";
	    $xmlReq .= "<CustomPictureSet>4000008</CustomPictureSet>\n";
	    $xmlReq .= "<ExtensionInDays>36500</ExtensionInDays>\n";
	    $xmlReq .= "<PictureName>$picNameIn</PictureName>\n";    
	    $xmlReq .= "<RequesterCredentials><eBayAuthToken>$userToken</eBayAuthToken></RequesterCredentials>\n";
	    $xmlReq .= '</' . $verb . 'Request>';
	
	    $boundary = "MIME_boundary";
	    $CRLF = "\r\n";
	    
	    // The complete POST consists of an XML request plus the binary image separated by boundaries
	    $firstPart   = '';
	    $firstPart  .= "--" . $boundary . $CRLF;
	    $firstPart  .= 'Content-Disposition: form-data; name="XML Payload"' . $CRLF;
	    $firstPart  .= 'Content-Type: text/xml;charset=utf-8' . $CRLF . $CRLF;
	    $firstPart  .= $xmlReq;
	    $firstPart  .= $CRLF;
	    
	    $secondPart = '';
	    $secondPart .= "--" . $boundary . $CRLF;
	    $secondPart .= 'Content-Disposition: form-data; name="dummy"; filename="dummy"' . $CRLF;
	    $secondPart .= "Content-Transfer-Encoding: binary" . $CRLF;
	    $secondPart .= "Content-Type: application/octet-stream" . $CRLF . $CRLF;
	    $secondPart .= $multiPartImageData;
	    $secondPart .= $CRLF;
	    $secondPart .= "--" . $boundary . "--" . $CRLF;
	    
	    $fullPost = $firstPart . $secondPart;
	    
	    // Create a new eBay session (defined below) 
	    $session = new eBayApi($userToken, $devID, $appID, $certID, false, $version, $siteID, $verb, $boundary);
	
	    $respXmlStr = $session->sendHttpRequest($fullPost);   // send multi-part request and get string XML response
	    
	    // Check for errors
	    if(stristr($respXmlStr, 'HTTP 404') || $respXmlStr == '') {
	    	error_log("########### ".print_r($respXmlStr, true));
	    	// EPS API upload error  
	     	$response['error'] = getErrorResp(130, 'EPS API upload error');	        
	    } else {    
		    $respXmlObj = simplexml_load_string($respXmlStr);     // create SimpleXML object from string for easier parsing
		                                                          // need SimpleXML library loaded for this		                                                          
		    $ack        = $respXmlObj->Ack;
		    $picObj     = $respXmlObj->SiteHostedPictureDetails->PictureSetMember;
		    
		    $data = array();
		    $data['ack'] = "".$ack;
			$data['mainUrl'] = "".$picObj[0]->MemberURL;
			$data['thumbNail'] = "".$picObj[1]->MemberURL;		     
		    $response['data'] = $data;
	    }
    } elseif ($fileObj->getError() == UPLOAD_ERR_INI_SIZE) {
    	// File exceeds the allowed size (upload_max_filesize directive in php.ini')
     	$response['error'] = getErrorResp(120, 'File exceeds the allowed size');
    } else { 
		// File is corrupted
		$response['error'] = getErrorResp(110, 'File is corrupted');			
    }
} else {
	// No file to upload
	$response['error'] = getErrorResp(100, 'No file to upload');	
}

// Set HTTP header to html
header("Content-Type: text/html; charset=utf-8");  

// Serialize the response
//$response = array('error'=>getErrorResp(100, 'No file to upload')); // Placeholder To simulate error scenario
$html = json_encode($response);

// Build the script output
if(isset($_POST['cb'])) {
	$cb = $_POST['cb'];
	$html = '<script>'.$cb.'('.$html.')</script>'; 
}

// echo out the content
echo $html;

/**
 * 
 * Function to build the error response  
 * 
 * @function getErrorResp
 * @param $id {String} Error ID
 * @param $msg {String} Error Message
 * 
 */			
function getErrorResp($id, $msg) {
	return array('id' => $id, 'msg' => $msg);
}
?>