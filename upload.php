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
        $devID = 'pcarad';
	    $appID = 'CARadd873-f513-4d4e-9805-a1772cf489f';
	    $certID = '322f701e-99fe-44ca-97fb-f35cee1f65bb';
	    //the token representing the eBay user to assign the call with
	    $userToken = 'AgAAAA**AQAAAA**aAAAAA**eDzSSw**nY+sHZ2PrBmdj6wVnY+sEZ2PrA2dj6wFk4SgDpOKowudj6x9nY+seQ**njAAAA**AAMAAA**7VZu6QOCEj2paeYG5T/rk+7xqvOTd0IktqTOGbLCbJXKJl/3sc3KgrO5qCymRybVztgtvUIIKj6DCDJw6y3813znxXuRVzM7UKYGFh2Fr/hnPaPbkcPc72dK/UeIy/MJLanYEuBVYvpvOD69AMGHwuwMewGQ2h/WdgS20miOfkU5pOfjK+7CO2Rq/kI7I8zI9U6B/ziEkgam5ceYoO8Ry25RDDTivHThSiW7IrOo+a7j6X2CPnCdqRWAXzfs3Bsy/FgjCAGs1TDuJ7ZSESW34FdMTqAbLqRm3Sfm+swKeePQ37ya9+/SUtXBCveskR098WoIRovHjuIYusnf9tKCzkQt0+tD8q2SWv8BB9o1CqUw7o7wh0lhbak6PnGLBlY6HVLI9FYiSmH9XsO20fCTzXbZ/+Ls+hJ70WT+0SdUU255CDkNf8kzxG79s1A+BnUrDCoYDy2tlyEB/A5zBz9Z7dKjII42tdUw0nUS1+vf3YVKTLSbtCeDivcFBeQWBgIkM/T3uc+LTER340oZJXCqyUQVFO75NTnSufT05/mZWjNQNQhtlpJimtsq9v2zfCcwuWK14l9oQ0jE/JWp4YzWZKhfjOfUtZ0hsO7+VdFE8EBbTqkqYtbwOJXRDyIF/EDerS3WobitExI6uT2DzSKgJSDp7TXnUSSd0LnuTL9N2kkGFJAjuh4u4+Mr+0iArrRL/8/FlNKcDaBngaCgjX5GhbC5CPcYLoDJwAmMy5biIvu7md2+qP9R/Asm0ek+V6uQ';
	
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