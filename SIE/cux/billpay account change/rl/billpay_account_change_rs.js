/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */
define([
    'N/record'
], (record) => {
    function post(context) {
        const {action , checkInfo} = context

        if(action === 'changeAccount'){
            const error = {status : 'error' , message : "变更失败"}
            const sucess= {status : 'sucess', message : "变更完成"} 

            try{
                const checkEle = checkLists(checkInfo)
                return changeListsAccount(checkEle , sucess)
            }catch(e){
                return {details : e.message , ...error}
            }
        }
    }

    function changeListsAccount(checkEle,sucess){
        log.error('checkEle',checkEle)

        const errorLists = new Array()

        checkEle.map(list => {
            try{
                record.submitFields({
                    type : record.Type.VENDOR_PAYMENT,
                    id : list.transid,
                    values : {
                        account : list.account
                    }
                })
            }catch(e){
                errorLists.push({
                    tranid : list.transidtext,
                    message : e.message
                })
            }
        })
  
        return {errorLists , ...sucess}
    }

    const checkLists = checkInfo => {
        const checkEle = new Array()

        Object.keys(checkInfo).map(key => {
            if(checkInfo && checkInfo[key]){
                if(checkInfo[key].check === 'T' || checkInfo[key].check === true || checkInfo[key].check === 'true'){
                    checkEle.push({transid : key , ...checkInfo[key]})
                }
            }
        })

        return checkEle
    }

    return {post}
})
