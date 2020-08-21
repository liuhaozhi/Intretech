/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       11 Jun 2020     Administrator
 *
 */

/**
 * @param {Object} dataIn Parameter object
 * @returns {Object} Output object
 */
function getRESTlet(dataIn) {
	 
        var csv_file = nlapiLoadFile(1621); //Replace XXXX with the ID of the file on the File Cabinet
        var ids = csv_file.getValue();
        var text = ids.split('\n');       
        //Looping through each result of the Search
      
        for (i=1; i < text.length; i++){

             nlapiLogExecution('Debug', 'details', text[i]);    
             try{  
             //load each search      
             var search = nlapiLoadSearch('transaction' , text[i]);
             search.setIsPublic(true);
             var scriptid = search.getScriptId();
      
             //save the search
      
             search.saveSearch();
             }
             catch(e)
             {
                nlapiLogExecution('Debug', ' errordetails',e);    
             }
        }
        return  'aa' ;
    
    
    }
 
